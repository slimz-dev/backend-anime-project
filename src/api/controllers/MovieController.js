const mongoose = require('mongoose');
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

async function uploadImagesToCloudinary(imageFiles, cloudinaryFolderPath) {
	const imagesStorage = {
		picture: '',
		poster: '',
		nameImg: '',
	};
	for (const [key, fieldName] of Object.entries(imageFiles)) {
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
				imagesStorage[key] = image.secure_url;
			})
			.catch((err) => {
				return res.status(500).json({
					flag: 'error',
					message: err.message,
					data: null,
				});
			});
	}
	return imagesStorage;
}

exports.movie = (req, res, next) => {
	const newMovie = new Movie({
		...req.body,
	});
	newMovie
		.save()
		.then((movie) => {
			return res.status(200).json({
				data: movie,
			});
		})
		.catch((err) => {
			return res.status(500).json({
				message: err.message,
			});
		});
};

exports.createMovie = async (req, res, next) => {
	const { seasonName, movieName } = req.body;
	const cloudinaryFolderName = toLowerCaseNonAccentVietnamese(movieName).replaceAll(' ', '_');
	const cloudinaryFolderPath = `Kmovie/movies/${cloudinaryFolderName}`;
	const fileStorage = req.files;
	Movie.findOne({ name: movieName })
		.then((movie) => {
			// Check if movie exists in database
			if (!movie) {
				// Find season relate to that movie
				Season.findOne({ name: seasonName }).then(async (season) => {
					// Upload images to cloudinary
					const movieImage = await uploadImagesToCloudinary(
						fileStorage,
						cloudinaryFolderPath
					);
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

exports.searchMovie = (req, res, next) => {
	const { query } = req.query;
	const diacriticRegex = query
		.replace(/a/g, '[aàáảãạâầấẩẫậăằắẳẵặ]') // Matches 'a' with various Vietnamese accents
		.replace(/e/g, '[eèéẻẽẹêềếểễệ]') // Matches 'e' with accents
		.replace(/i/g, '[iìíỉĩị]') // Matches 'i' with accents
		.replace(/o/g, '[oòóỏõọôồốổỗộơờớởỡợ]') // Matches 'o' and 'ô', 'ơ' with accents
		.replace(/u/g, '[uùúủũụưừứửữự]') // Matches 'u' and 'ư' with accents
		.replace(/y/g, '[yỳýỷỹỵ]') // Matches 'y' with accents
		.replace(/d/g, '[dđ]'); // Matches 'd' and 'đ'
	const movieRegex = new RegExp(`^${diacriticRegex}`, 'i');
	Movie.find({ $or: [{ movieName: movieRegex }, { otherName: movieRegex }] })
		.then((movies) => {
			return res.status(200).json({
				flag: 'success',
				message: 'Query successfully',
				data: movies,
				metadata: {
					total: movies.length,
				},
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

exports.getMovie = (req, res, next) => {
	const { movieID } = req.params;
	Movie.findOne({ _id: movieID })
		.then((movie) => {
			if (movie) {
				return res.status(200).json({
					flag: 'success',
					data: movie,
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
				flag: 'error',
				data: null,
				message: err.message,
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

exports.getMoviesFromUpdate = (req, res, next) => {
	const { day, completed } = req.query;
	if (!day || !completed) {
		return res.status(400).json({
			flag: 'error',
			data: null,
			message: 'Missing query params',
		});
	}
	const updateDay = JSON.parse(day);
	const isCompleted = JSON.parse(completed);
	if (typeof isCompleted !== 'boolean' || typeof updateDay !== 'number') {
		return res.status(400).json({
			flag: 'error',
			data: null,
			message:
				'Wrong type of param, "day" must be a number and "completed" must be a boolean',
		});
	}
	const stringDay = getEnglishDay(updateDay);
	Movie.find({ isCompleted: isCompleted, update: { $in: updateDay } })
		.then((movies) => {
			if (movies.length !== 0) {
				return res.status(200).json({
					flag: 'success',
					data: {
						releaseDay: stringDay,
						list: movies,
					},
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

exports.topRatedMovies = (req, res, next) => {
	Movie.find({})
		.populate('categories')
		.sort({ 'rating.totalStar': 1 })
		.limit(10)
		.exec()
		.then((movies) => {
			if (movies.length !== 0) {
				return res.status(200).json({
					flag: 'success',
					data: movies,
					meta: {
						total: movies.length,
					},
					message: 'Get top 10 rating movies successfully',
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

exports.topWatchedMovies = (req, res, next) => {
	Movie.find({})
		.populate('categories')
		.sort({ watchTime: 1 })
		.limit(10)
		.exec()
		.then((movies) => {
			if (movies.length !== 0) {
				return res.status(200).json({
					flag: 'success',
					data: movies,
					meta: {
						total: movies.length,
					},
					message: 'Get top 10 waching movies successfully',
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

exports.upcomingMovies = (req, res, next) => {
	Movie.find({ isReleased: false })
		.populate('categories')
		.sort({ releasedDate: 1 })
		.exec()
		.then((movies) => {
			return res.status(200).json({
				flag: 'success',
				data: movies,
				meta: {
					total: movies.length,
				},
				message: 'Get upcoming movies successfully',
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

exports.patchAllMovies = (req, res, next) => {
	const data = req.body;
	Movie.updateMany({}, data, { new: true })
		.then((update) => {
			if (update.modifiedCount !== 0) {
				return res.status(200).json({
					flag: 'success',
					message: 'successfully updated',
					data: null,
				});
			} else {
				return res.status(404).json({
					flag: 'error',
					message: 'Not found any movie',
					data: null,
				});
			}
		})
		.catch((err) => {
			res.status(500).json({
				flag: 'error',
				message: err.message,
				data: null,
			});
		});
};

exports.patchMovie = (req, res, next) => {
	const { movieID } = req.params;
	const data = req.body;
	console.log(data);
	Movie.findOneAndUpdate({ _id: movieID }, data, { new: true })
		.then((movie) => {
			if (movie) {
				return res.status(200).json({
					flag: 'success',
					message: 'successfully updated',
					data: movie,
				});
			} else {
				return res.status(404).json({
					flag: 'error',
					message: 'Not found any movie',
					data: null,
				});
			}
		})
		.catch((err) => {
			res.status(500).json({
				flag: 'error',
				message: err.message,
				data: null,
			});
		});
};

exports.hotestMovie = (req, res, next) => {
	Movie.find({})
		.sort({ watchTime: 1 })
		.limit(1)
		.populate('categories')
		.exec()
		.then((movies) => {
			if (movies.length !== 0) {
				return res.status(200).json({
					flag: 'success',
					data: movies,
					meta: {
						total: movies.length,
					},
					message: 'Get hottest movie successfully',
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

const getEnglishDay = (number) => {
	let stringDay;
	switch (number) {
		case 2:
			stringDay = 'Monday';
			break;
		case 3:
			stringDay = 'Tuesday';
			break;
		case 4:
			stringDay = 'Wednesday';
			break;
		case 5:
			stringDay = 'Thursday';
			break;
		case 6:
			stringDay = 'Friday';
			break;
		case 7:
			stringDay = 'Saturday';
			break;
		case 8:
			stringDay = 'Sunday';
			break;
		default:
			stringDay = 'Not a valid day';
			break;
	}
	return stringDay;
};
