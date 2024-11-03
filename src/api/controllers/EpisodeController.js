const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Episode = require('../models/Episode');
const cloudinary = require('../../utils/cloudinary');
const path = require('path');
const fs = require('fs-extra');
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

async function appendMainFile(filePath, link, videoConfig, vip) {
	const content = `#EXT-X-STREAM-INF:BANDWIDTH=${videoConfig.bitrate.replace(
		'k',
		'000'
	)},RESOLUTION=${videoConfig.resolution}\n${link}\n`;
	try {
		if (!vip) {
			if (videoConfig.name.localeCompare('1080p') !== 0) {
				fs.appendFileSync(filePath, content);
			}
		} else {
			fs.appendFileSync(filePath, content);
		}
		console.log('Content appended for main file successfully.');
	} catch (err) {
		throw err;
	}
}

async function deleteLocal(dir) {
	try {
		const tsFiles = await fs.readdir(dir);
		await Promise.all(
			tsFiles
				.filter((file) => file.endsWith('.ts'))
				.map(async (file) => {
					return fs.remove(path.join(dir, file));
				})
		);
		console.log('delele all local .ts files successfully ');
	} catch (err) {
		throw err;
	}
}

async function writeToM3u8File(m3u8File, segmentLinks) {
	try {
		// Read the file asynchronously
		const data = await fs.readFile(m3u8File, 'utf8');
		let updatedData = data;

		// Replace each segment name with its corresponding link
		segmentLinks.forEach((link) => {
			const splitLink = link.split('/');
			const segmentName = splitLink[splitLink.length - 1];
			updatedData = updatedData.replace(segmentName, link);
		});
		// Write the updated content back to the file only once after all replacements
		await fs.writeFile(m3u8File, updatedData);
		console.log('Replace to actual link in m3u8 file successfully');
		return m3u8File; // Return the file path after writing
	} catch (err) {
		throw err;
	}
}

async function uploadToCloudinary(episodePath, cloudinaryFolderPath, segmentName, type) {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload(
			episodePath,
			{
				resource_type: type ? type : 'video',
				public_id: segmentName,
				folder: cloudinaryFolderPath,
				overwrite: true,
			},
			(error, result) => {
				if (error) {
					reject(error); // Reject the promise with the error
				} else {
					console.log('Uploaded to cloudinary');
					resolve(result.secure_url); // Resolve the promise with the URL
				}
			}
		);
	});
}

async function splitSegmentsAndUpload(inputPath, outputName, cloudinaryPathToResolution) {
	const outputDir = path.dirname(inputPath);
	const m3u8Path = path.join(outputDir, `${outputName}.m3u8`);
	const segmentPath = path.join(outputDir, `segment%03d.ts`);
	return new Promise(async (resolve, reject) => {
		ffmpeg(inputPath)
			.outputOptions([
				'-c:v copy', // Copy video codec
				'-c:a aac', // Encode audio to AAC
				'-bsf:a aac_adtstoasc', // Bitstream filter for AAC
				'-start_number 0', // Start segment numbering at 0
				'-hls_time 3', // Segment duration of 3 seconds
				'-hls_list_size 0', // Unlimited entries in the playlist
				`-hls_segment_filename ${segmentPath}`, // Segment filename pattern
				'-f hls', // Output format HLS
			])
			.output(m3u8Path) // Output .m3u8 file
			.on('end', async () => {
				console.log('HLS conversion completed.');
				const tsFiles = await fs.readdir(outputDir);
				const segmentLinks = [];
				await Promise.all(
					tsFiles
						.filter((file) => file.endsWith('.ts'))
						.map(async (file) => {
							const pathToSegment = path.join(outputDir, file);
							const segmentName = file.split('.')[0];
							const link = await uploadToCloudinary(
								pathToSegment,
								cloudinaryPathToResolution,
								segmentName
							);
							return segmentLinks.push(link);
						})
				);

				const m3u8 = await writeToM3u8File(m3u8Path, segmentLinks);
				const result = await uploadToCloudinary(
					m3u8,
					cloudinaryPathToResolution,
					outputName,
					'raw'
				);
				await deleteLocal(outputDir);
				resolve(result);
			})
			.on('error', (err) => {
				throw err;
			})
			.run();
	});
}

function convertVideo(inputPath, outputPath, quality) {
	return new Promise((resolve, reject) => {
		ffmpeg(inputPath)
			.output(outputPath)
			.videoCodec('libx264')
			.videoBitrate(quality.bitrate)
			.audioCodec('copy')
			.size(quality.resolution)
			.outputOptions(['-crf 18'])
			.on('progress', (progress) => {
				console.log(`Processing: for ${quality.resolution} ${progress.frames} frames done`);
			})
			.on('end', () => {
				console.log(`Finished processing: ${quality.resolution}`);
				resolve();
			})
			.on('error', (err) => {
				throw err;
			})
			.run();
	});
}

async function createQualities(inputFilePath, fileName) {
	try {
		const qualityFiles = [];
		const qualities = [
			{ name: '360p', resolution: '640x360', bitrate: '1000k' },
			{ name: '480p', resolution: '854x480', bitrate: '1500k' },
		];
		for (const quality of qualities) {
			const outputResolutionPath = path.join(
				path.dirname(inputFilePath),
				`${fileName}_${quality.name}.mp4`
			);
			await convertVideo(inputFilePath, outputResolutionPath, quality);
			qualityFiles.push({
				path: outputResolutionPath,
				resolution: quality.resolution,
				bitrate: quality.bitrate,
				name: quality.name,
			});
		}
		qualityFiles.push({
			name: '1080p',
			path: inputFilePath,
			resolution: '1920x1080',
			bitrate: '5000k',
		});
		return qualityFiles;
	} catch (err) {
		throw err;
	}
}

async function createMainFile(pathToMainFile, name) {
	try {
		const dir = path.dirname(pathToMainFile);
		const mainFilePath = path.join(dir, name);
		const content = `#EXTM3U\n#EXT-X-VERSION:3\n\n`;
		await fs.promises.writeFile(mainFilePath, content, { flag: 'w' });
		console.log('main file created');
		return mainFilePath;
	} catch (err) {
		throw err;
	}
}

exports.createEpisode = (req, res, next) => {
	const { movieID, episodeName, movieName } = req.body;
	const movieNameToLowerCase = toLowerCaseNonAccentVietnamese(movieName).replaceAll(' ', '_');
	const cloudinaryPathToMovie = `Kmovie/movies/${movieNameToLowerCase}`;
	const episodePath = req.file.path;
	const cloudinaryEpisodeName = `${movieNameToLowerCase}_episode_${episodeName}`;
	const cloudinaryPathToEpisode = `${cloudinaryPathToMovie}/${cloudinaryEpisodeName}`;
	Episode.findOne({ $and: [{ movie: movieID, episodeName }] })
		.then(async (episode) => {
			try {
				const mainFile = await createMainFile(episodePath, 'main.m3u8');
				const secondFile = await createMainFile(episodePath, 'main_novip.m3u8');
				const qualityFiles = await createQualities(episodePath, cloudinaryEpisodeName);
				for (const quality of qualityFiles) {
					const videoName = `${cloudinaryEpisodeName}_${quality.name}`;
					const cloudinaryPathToResolution = `${cloudinaryPathToEpisode}/${videoName}`;
					const linkToDiffrentPath = await splitSegmentsAndUpload(
						quality.path,
						videoName,
						cloudinaryPathToResolution
					);
					await appendMainFile(mainFile, linkToDiffrentPath, quality, true);
					await appendMainFile(secondFile, linkToDiffrentPath, quality, false);
				}
				const vipLink = await uploadToCloudinary(
					mainFile,
					cloudinaryPathToEpisode,
					'main.m3u8',
					'raw'
				);
				const noVipLink = await uploadToCloudinary(
					secondFile,
					cloudinaryPathToEpisode,
					'main_novip.m3u8',
					'raw'
				);
				Movie.findOne({ _id: movieID }).then((movie) => {
					if (movie) {
						if (!episode) {
							const newEpisode = new Episode({
								_id: new mongoose.Types.ObjectId().toString(),
								episodeName,
								movie: movieID,
								link: vipLink,
								secondLink: noVipLink,
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
				return res.status(500).json({
					flag: 'error',
					message: error.message,
					data: null,
				});
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

exports.getEpisodes = (req, res, next) => {
	const userID = req.userID;
	const accessToken = req.accessToken;
	const { movieID } = req.params;
	Episode.find({ movie: movieID })
		.then((episodes) => {
			User.findOne({ _id: userID })
				.then((user) => {
					if (user) {
						const currentDate = new Date();
						if (user.vipExpired > currentDate) {
							const episodesCloned = episodes.map((episode) => {
								const episodeCloned = episode.toObject();
								delete episodeCloned.secondLink;
								return episodeCloned;
							});
							return res.status(200).json({
								flag: 'success',
								message: 'Fetch episodes successfully',
								data: episodesCloned,
								meta: {
									accessToken,
								},
							});
						} else {
							const episodesCloned = episodes.map((episode) => {
								const episodeCloned = episode.toObject();
								episodeCloned.link = episodeCloned.secondLink;
								delete episodeCloned.secondLink;
								return episodeCloned;
							});
							return res.status(200).json({
								flag: 'success',
								message: 'Fetch episodes successfully',
								data: episodesCloned,
								meta: {
									accessToken,
								},
							});
						}
					} else {
						return res.status(404).json({
							flag: 'error',
							message: 'User not found',
							data: null,
						});
					}
				})
				.catch((err) => {
					throw err;
				});
		})
		.catch((err) => {
			return res.status(500).json({
				flag: 'error',
				message: err.message,
				data: null,
			});
		});
};

// exports.removeEpisode = (req, res, next) => {
// 	const { }
// }
