const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Season = require('../models/Season');
const Movie = require('../models/Movie');
const cloudinary = require('../../utils/cloudinary');
const fs = require('fs');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);
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
exports.createMovie = async (req, res, next) => {
	const { seasonName, movieName } = req.body;
	const cloudinaryFolderName = toLowerCaseNonAccentVietnamese(movieName).replaceAll(' ', '_');
	const cloudinaryFolderPath = `Kmovie/movies/${cloudinaryFolderName}`;
	Movie.findOne({ name: movieName })
		.then((movie) => {
			// Check if movie exists in database
			if (!movie) {
				// Find season relate to that movie
				Season.findOne({ name: seasonName }).then(async (season) => {
					// Upload images to cloudinary
					const movieImage = {
						picture: '',
						poster: '',
						nameImg: '',
					};
					for (const [key, fieldName] of Object.entries(req.files)) {
						let imageID = fieldName[0].fieldname;
						const result = await new Promise((resolve, reject) => {
							cloudinary.uploader.upload(
								fieldName[0].path,
								{
									public_id: imageID,
									folder: cloudinaryFolderPath,
									overwrite: true,
								},
								(err, url) => {
									if (err) return reject(err);
									return resolve(url);
								}
							);
						})
							.then((image) => {
								movieImage[key] = image.secure_url;
							})
							.catch((err) => {
								console.log(err.message);
							});
					}

					//Add new movie
					const newMovie = new Movie({
						_id: new mongoose.Types.ObjectId().toString(),
						...req.body,
						...movieImage,
					});
					newMovie
						.save()
						.then((movieCreated) => {
							// Check if season exists in database
							if (!season) {
								const newSeason = new Season({
									_id: new mongoose.Types.ObjectId().toString(),
									name: seasonName,
									list: [{ seasonName: movieName, link: movieCreated._id }],
								});
								newSeason
									.save()
									.then((updateNewSeason) => {
										return res.status(200).json({
											flag: 'success',
											data: {
												movie: movieCreated,
												season: updateNewSeason,
											},
											message: 'Added new season for this movie',
										});
									})
									.catch((err) => {
										return res.status(500).json({
											flag: 'error',
											data: null,
											message: err.message,
										});
									});

								//Push new movie if season already exist
							} else {
								season.list.push({
									seasonName: movieName,
									link: movieCreated._id,
								});
								season
									.save()
									.then((updateExistedSeason) => {
										return res.status(200).json({
											flag: 'success',
											data: {
												movie: movieCreated,
												season: updateExistedSeason,
											},
											message: 'Update movie to existed season',
										});
									})
									.catch((err) => {
										return res.status(500).json({
											flag: 'error',
											data: null,
											message: err.message,
										});
									});
							}
						})
						.catch((err) => {
							return res.status(500).json({
								flag: 'error',
								data: null,
								message: err.message,
							});
						});
				});
			} else {
				return res.status(422).json({
					flag: 'error',
					data: null,
					message: 'Movies with the same name already existed',
				});
			}
		})
		.catch((err) => {
			return res.status(500).json({
				flag: 'error',
				data: null,
				message: err.message,
			});
		});
};

exports.getTotalMovies = (req, res, next) => {
	Movie.find({})
		.then((movies) => {
			if (movies.length !== 0) {
				return res.status(200).json({
					flag: 'success',
					data: movies,
					meta: {
						total: movies.length,
					},
					message: 'Get total movies successfully',
				});
			} else {
				return res.status(404).json({
					flag: 'error',
					data: null,
					message: 'Not found any movie',
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

exports.deleteMovie = (req, res, next) => {
	const { movieID } = req.params;
	Movie.deleteOne({ _id: movieID })
		.then(({ deletedCount }) => {
			if (deletedCount) {
				Season.findOneAndUpdate(
					{ list: { $elemMatch: { link: movieID } } },
					{ $pull: { list: { link: movieID } } },
					{ new: true }
				).then((season) => {
					return res.status(200).json({
						flag: 'success',
						data: season,
						message: 'Movie deleted successfully',
					});
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Movie not found',
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

exports.deleteTotalMovies = (req, res, next) => {
	Movie.deleteMany({})
		.then(({ deletedCount }) => {
			Season.updateMany({}, { list: [] }, { new: true })
				.then(() => {
					return res.status(200).json({
						success: {
							message: 'Deleted successfully',
							deletedCount,
						},
					});
				})
				.catch((err) => {
					return res.status(500).json({
						error: {
							message: err.message,
						},
					});
				});
		})
		.catch((err) => {
			return res.status(500).json({
				error: {
					message: err.message,
				},
			});
		});
};
