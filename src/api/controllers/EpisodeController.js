const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Movie = require('../models/Movie');
const Episode = require('../models/Episode');
const cloudinary = require('../../utils/cloudinary');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

function toLowerCaseNonAccentVietnamese(str) {
	str = str.toLowerCase();
	str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
	str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
	str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
	str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
	str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
	str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
	str = str.replace(/đ/g, 'd');
	// Some system encode vietnamese combining accent as individual utf-8 characters
	str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
	str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
	return str;
}

function compressVideo(inputFilePath, outputPath) {
	return new Promise((resolve, reject) => {
		ffmpeg(inputFilePath)
			.videoCodec('libx265') // Use H.265 codec for better compression
			.outputOptions([
				'-crf 28', // Adjust CRF for file size/quality balance
				'-preset slow', // Slower preset for better compression
			])
			.on('end', () => {
				console.log('Compression finished');
				resolve(outputPath); // Return the output file path after compression
			})
			.on('error', (err) => {
				console.error('Error during compression', err);
				reject(err);
			})
			.save(outputPath); // Save compressed video to the output folder
	});
}

function uploadToCloudinary(fileName, episodePath, cloudinaryFolderPath) {
	return cloudinary.uploader.upload(
		episodePath,
		{
			resource_type: 'video',
			public_id: fileName,
			folder: cloudinaryFolderPath,
			overwrite: true,
		},
		(error, result) => {
			if (error) {
				return res.status(500).json({
					flag: 'error',
					message: error.message,
					data: null,
				});
			} else {
				return result;
			}
		}
	);
}

exports.createEpisode = (req, res, next) => {
	const { movieID, episodeName, movieName } = req.body;
	const cloudinaryFolderName = toLowerCaseNonAccentVietnamese(movieName).replaceAll(' ', '_');
	const cloudinaryFolderPath = `Kmovie/movies/${cloudinaryFolderName}`;
	const episodePath = req.file.path;
	const compressedPath = path.join(path.dirname(episodePath), `compressed_${fileName}.mp4`);
	const fileName = `${cloudinaryFolderName}_episode_${episodeName}`;
	Episode.findOne({ $and: [{ movie: movieID, episodeName }] })
		.then(async (episode) => {
			try {
				// Compress the video
				const outputFilePath = await compressVideo(episodePath, compressedPath);
				const file = await uploadToCloudinary(
					fileName,
					outputFilePath,
					cloudinaryFolderPath
				);
				// Upload to Cloudinary in the specific folder
				Movie.findOne({ _id: movieID }).then((movie) => {
					if (movie) {
						if (!episode) {
							const newEpisode = new Episode({
								_id: new mongoose.Types.ObjectId().toString(),
								episodeName,
								movie: movieID,
								link: file.playback_url,
							});
							newEpisode.save().then((updateEpisode) => {
								return res.status(200).json({
									flag: 'success',
									data: updateEpisode,
									message: 'Episode saved successfully',
								});
							});
						} else {
							return res.status(403).json({
								flag: 'error',
								data: null,
								message: 'This episode already exists',
							});
						}
					} else {
						return res.status(404).json({
							flag: 'error',
							message: 'Movie not exists',
							data: null,
						});
					}
				});
			} catch (error) {
				console.error('Error processing video:', error);
			}
		})
		.catch((err) => {
			return res.status(500).json({
				flag: 'error',
				message: err.message,
				data: null,
			});
		});
};

exports.getTotalEpisodes = (req, res, next) => {
	Episode.find({})
		.then((episodes) => {
			if (episodes.length !== 0) {
				return res.status(200).json({
					data: episodes,
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Not found any episode',
					},
				});
			}
		})
		.catch((err) => {
			return res.status(500).json({
				error: {
					message: err.message,
				},
			});
		});
};
