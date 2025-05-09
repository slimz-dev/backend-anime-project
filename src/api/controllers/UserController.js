const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const Notification = require('../models/Notification');
const Level = require('../models/Level');
const Movie = require('../models/Movie');
const Episode = require('../models/Episode');
const cloudinary = require('../../utils/cloudinary');
require('dotenv').config();

exports.createUser = (req, res, next) => {
	const { username, password, name } = req.body;
	User.findOne({ username: username })
		.then((user) => {
			if (!user && username && password && name) {
				//ENCODE password
				bcrypt.hash(password, 10, (err, hash) => {
					if (err) {
						return res.status(500).json({
							flag: 'error',
							data: null,
							message: err.message,
						});
					} else {
						UserGroup.findOne({ name: process.env.DEFAULT_ROLE_NAME }).then((group) => {
							const users = new User({
								_id: new mongoose.Types.ObjectId().toString(),
								name,
								username,
								password: hash,
								role: group._id,
							});
							users.save().then((result) => {
								const notification = new Notification({
									_id: new mongoose.Types.ObjectId().toString(),
									to: result._id,
								});
								notification.save();
								return res.status(201).json({
									flag: 'success',
									data: result,
									message: 'Successfully created',
								});
							});
						});
					}
				});
			} else {
				if (user) {
					return res.status(409).json({
						flag: 'error',
						data: null,
						message: 'User already exists',
					});
				} else if (!password) {
					return res.status(400).json({
						flag: 'error',
						data: null,
						message: 'Password is required',
					});
				} else if (!name) {
					return res.status(400).json({
						flag: 'error',
						data: null,
						message: 'Name is required',
					});
				} else {
					return res.status(400).json({
						flag: 'error',
						data: null,
						message: 'Username is required',
					});
				}
			}
		})
		.catch((err) => {
			return res.status(500).json({
				error: { message: err.message },
			});
		});
};

exports.getTotalUser = (req, res, next) => {
	User.find({})
		.populate('role')
		.populate('movieFollowed')
		.populate({
			path: 'movieRated',
			populate: [
				{
					path: 'fiveStars',
					model: 'Movie',
				},
				{
					path: 'fourStars',
					model: 'Movie',
				},
				{
					path: 'oneStar',
					model: 'Movie',
				},
				{
					path: 'threeStars',
					model: 'Movie',
				},
				{
					path: 'twoStars',
					model: 'Movie',
				},
			],
		})
		.populate({
			path: 'movieWatched',
			populate: {
				path: 'watched',
				model: 'Episode',
				populate: { path: 'movie', model: 'Movie' },
			},
		})
		.populate({ path: 'level', model: Level })
		.exec()
		.then((users) => {
			return res.status(200).json({
				data: users,
				length: users.length,
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

exports.deleteUser = (req, res, next) => {
	const userID = req.params.userID;
	User.findOne({ _id: userID })
		.then((user) => {
			if (user) {
				User.deleteOne({ _id: userID })
					.then(() => {
						return res.status(200).json({
							flag: 'success',
							data: null,
							message: 'Delete user successfully',
						});
					})
					.catch((err) => {
						return res.status(500).json({
							flag: 'error',
							data: null,
							message: err.message,
						});
					});
			} else {
				return res.status(404).json({
					flag: 'error',
					data: null,
					message: 'No user found with this ID',
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

exports.loginUser = (req, res, next) => {
	const { username, password, deviceID, deviceName } = req.body;
	User.findOne({ username })
		.populate({
			path: 'movieWatched',
			populate: {
				path: 'watched',
				model: 'Episode',
				populate: { path: 'movie', model: 'Movie' },
			},
		})
		.populate('movieFollowed')
		.populate({
			path: 'movieRated',
			populate: [
				{
					path: 'fiveStars',
					model: 'Movie',
				},
				{
					path: 'fourStars',
					model: 'Movie',
				},
				{
					path: 'oneStar',
					model: 'Movie',
				},
				{
					path: 'threeStars',
					model: 'Movie',
				},
				{
					path: 'twoStars',
					model: 'Movie',
				},
			],
		})
		.populate({ path: 'level', model: Level })
		.select('-role')
		.exec()
		.then((user) => {
			// console.log(JSON.stringify(user.level, 0, 2));
			if (user && username && password) {
				bcrypt.compare(password, user.password, async (err, result) => {
					if (err) {
						return res.status(500).json({
							flag: 'error',
							data: null,
							message: err.message,
						});
					}
					if (result) {
						const accessToken = jwt.sign(
							{
								userID: user._id,
							},
							process.env.ACCESS_TOKEN_SECRET,
							{
								expiresIn: '1d',
							}
						);
						const refreshToken = jwt.sign(
							{
								userID: user._id,
							},
							process.env.REFRESH_TOKEN_SECRET,
							{
								expiresIn: '30d',
							}
						);
						// If device already has a refresh token
						const indexOfDevice = user.loginDevices.findIndex((device) => {
							return device.deviceID === deviceID;
						});
						if (indexOfDevice !== -1) {
							user.loginDevices.splice(indexOfDevice, 1);
							await user.save();
						}
						// Push the refresh token
						user.loginDevices.push({
							deviceID,
							deviceName,
							refreshToken,
						});
						await user.save();

						// Remove the devices from the reponse data
						const data = user.toJSON();
						delete data.loginDevices;
						delete data.password;
						maskSensitiveData(data, ['mail', 'phone']);
						return res.status(200).json({
							flag: 'success',
							data,
							meta: {
								accessToken,
								refreshToken,
							},
							message: 'Request successful',
						});
					} else {
						return res.status(401).json({
							flag: 'error',
							data: null,
							message: 'Wrong password',
						});
					}
				});
			} else if (!username) {
				return res.status(422).json({
					flag: 'error',
					data: null,
					message: 'Username is required',
				});
			} else if (!password) {
				return res.status(422).json({
					flag: 'error',
					data: null,
					message: 'Password is required',
				});
			} else {
				return res.status(404).json({
					flag: 'error',
					data: null,
					message: 'No user found with this username',
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
async function uploadToCloudinary(imagePath, cloudinaryFolderPath, pID) {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload(
			imagePath,
			{
				public_id: pID,
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
exports.changeUser = async (req, res, next) => {
	const { userID } = req.params;
	const { name, quote, phone, mail, dob } = req.body;
	const changeData = {
		name,
		quote,
		phone,
		mail,
		dob,
	};
	if (req.file) {
		const cloudinaryFolderPath = `Kmovie/users/${userID}`;
		const avatar = await uploadToCloudinary(req.file.path, cloudinaryFolderPath, 'avatar');
		changeData.avatar = avatar;
	}
	User.findOneAndUpdate({ _id: userID }, changeData, { new: true })
		.then(async (user) => {
			if (user) {
				return res.status(200).json({
					flag: 'success',
					data: user,
					message: 'User has been updated',
				});
			} else {
				return res.status(404).json({
					flag: 'error',
					data: null,
					message: 'User does not exist',
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

exports.changeTotalUser = (req, res, next) => {
	const changeData = req.body;
	User.updateMany({}, changeData, { new: true })
		.then((users) => {
			if (users.length !== 0) {
				return res.status(200).json({
					flag: 'success',
					data: users,
					message: 'All users has been updated',
				});
			} else {
				return res.status(404).json({
					flag: 'error',
					data: null,
					message: 'Found 0 user',
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

exports.getUser = (req, res, next) => {
	const userID = req.userID;
	const accessToken = req.accessToken;
	const { refreshToken } = req.body;
	User.findOne({ _id: userID })
		.populate({
			path: 'movieWatched',
			populate: {
				path: 'watched',
				model: 'Episode',
				populate: { path: 'movie', model: 'Movie' },
			},
		})
		.populate('movieFollowed')
		.populate({
			path: 'movieRated',
			populate: [
				{
					path: 'fiveStars',
					model: 'Movie',
				},
				{
					path: 'fourStars',
					model: 'Movie',
				},
				{
					path: 'oneStar',
					model: 'Movie',
				},
				{
					path: 'threeStars',
					model: 'Movie',
				},
				{
					path: 'twoStars',
					model: 'Movie',
				},
			],
		})
		.populate({ path: 'level', model: Level })
		.select('-role')
		.select('-password')
		.exec()
		.then((user) => {
			const hasDevice = user.loginDevices.find((device) => {
				return device.refreshToken === refreshToken;
			});
			let data = user.toJSON();
			delete data.loginDevices;
			maskSensitiveData(data, ['mail', 'phone']);
			if (user && hasDevice) {
				return res.status(200).json({
					flag: 'success',
					data,
					meta: {
						accessToken,
					},
					message: 'Getting user information successfully',
				});
			} else if (hasDevice === undefined) {
				return res.status(403).json({
					flag: 'error',
					data: null,
					message: 'This device has been removed',
				});
			} else {
				return res.status(404).json({
					flag: 'error',
					data: null,
					message: 'User not found',
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

exports.removeDevices = (req, res, next) => {
	const verifyID = req.userID;
	const accessToken = req.accessToken;
	const { userID } = req.params;
	const { deviceID } = req.body;
	if (userID.localeCompare(verifyID) === 0) {
		User.findOneAndUpdate(
			{ _id: userID },
			{ $pull: { loginDevices: { deviceID } } },
			{ new: true }
		)
			.then((user) => {
				if (user) {
					return res.status(200).json({
						flag: 'success',
						data: user,
						meta: {
							accessToken,
						},
						message: 'Remove devices successfully',
					});
				}
				return res.status(404).json({
					flag: 'error',
					data: [],
					message: 'User not found',
				});
			})
			.catch((err) => {
				return res.status(500).json({
					flag: 'error',
					data: null,
					message: err.message,
				});
			});
	} else {
		return res.status(404).json({
			flag: 'error',
			message: 'Token invalid',
			data: null,
		});
	}
};

exports.applyMovieHistory = (req, res, next) => {
	const verifyID = req.userID;
	const { userID } = req.params;
	const accessToken = req.accessToken;
	if (verifyID.localeCompare(userID) === 0) {
		const { currentTime, watchTime, episodeID, movieID } = req.body;
		let parseMovieToID;
		if (movieID._id) {
			parseMovieToID = movieID._id;
		} else {
			parseMovieToID = movieID;
		}
		User.findOne({ _id: userID })
			.populate({ path: 'movieWatched', populate: { path: 'watched', model: 'Episode' } })
			.then(async (user) => {
				if (user) {
					const indexOfMovie = user.movieWatched.findIndex((item) => {
						return item.watched.movie.toString().localeCompare(parseMovieToID) === 0;
					});
					if (indexOfMovie !== -1) {
						user.movieWatched.splice(indexOfMovie, 1);
					}
					user.movieWatched.push({
						currentTime,
						watched: episodeID,
					});
					user.power += watchTime * 1000;

					await user
						.save()
						.then((updatedUser) => {
							Movie.findOne({ _id: parseMovieToID })
								.then(async (movie) => {
									if (movie) {
										movie.watchTime += 1;
										await movie
											.save()
											.then((updatedMovie) => {
												return res.status(200).json({
													flag: 'success',
													message: 'Updated user successfully',
													data: { updatedUser, updatedMovie },
													meta: {
														accessToken,
													},
												});
											})
											.catch((err) => {
												throw err;
											});
									} else {
										return res.status(404).json({
											flag: 'error',
											message: 'Movie not found',
											data: null,
										});
									}
								})
								.catch((err) => {
									throw err;
								});
						})
						.catch((err) => {
							throw err;
						});
				} else {
					return res.status(404).json({
						flag: 'error',
						message: 'User not found',
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
	} else {
		return res.status(404).json({
			flag: 'error',
			message: 'Token invalid',
			data: null,
		});
	}
};

exports.followMovie = (req, res, next) => {
	const userID = req.userID;
	const accessToken = req.accessToken;
	const { movieID } = req.body;
	User.findOne({ _id: userID })
		.then((user) => {
			if (user) {
				Movie.findOne({ _id: movieID })
					.then(async (found) => {
						if (found) {
							const findIndex = user.movieFollowed.findIndex((movie) => {
								return movie.toString() === movieID;
							});
							if (findIndex !== -1) {
								user.movieFollowed.splice(findIndex, 1);
								await user
									.save()
									.then((updatedUser) => {
										return res.status(200).json({
											flag: 'success',
											message: 'Unfollow movie success',
											data: updatedUser,
											meta: {
												accessToken,
											},
										});
									})
									.catch((err) => {
										throw err;
									});
							} else {
								user.movieFollowed.push(movieID);
								await user
									.save()
									.then((updatedUser) => {
										return res.status(200).json({
											flag: 'success',
											message: 'Follow movie success',
											data: updatedUser,
											meta: {
												accessToken,
											},
										});
									})
									.catch((err) => {
										throw err;
									});
							}
						} else {
							return res.status(404).json({
								flag: 'error',
								message: 'Movie not found',
								data: null,
							});
						}
					})
					.catch((err) => {
						throw err;
					});
			} else {
				return res.status(404).json({
					flag: 'error',
					message: 'User not found',
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

exports.rateMovie = (req, res, next) => {
	const { movieID } = req.params;
	const userID = req.userID;
	const accessToken = req.accessToken;
	const { stars } = req.body;
	if (stars <= 5) {
		User.findOne({ _id: userID })
			.then((user) => {
				if (user) {
					let alreadyRated;
					for (const movies of Object.values(user.movieRated)) {
						alreadyRated = movies.find((mov) => mov.toString() === movieID);
						if (alreadyRated) {
							break;
						}
					}
					if (!alreadyRated) {
						Movie.findOne({ _id: movieID })
							.then(async (movie) => {
								if (movie) {
									movie.rating.totalUser += 1;
									movie.rating.totalStar += stars;
									await movie
										.save()
										.then(async (updatedMovie) => {
											switch (stars) {
												case 1: {
													user.movieRated.oneStar.push(movieID);
													break;
												}
												case 2: {
													user.movieRated.twoStars.push(movieID);
													break;
												}
												case 3: {
													user.movieRated.threeStars.push(movieID);
													break;
												}
												case 4: {
													user.movieRated.fourStars.push(movieID);
													break;
												}
												default: {
													user.movieRated.fiveStars.push(movieID);
												}
											}
											await user
												.save()
												.then((updatedUser) => {
													return res.status(200).json({
														flag: 'success',
														message: 'Rated was successfully',
														data: { updatedMovie, updatedUser },
														meta: {
															accessToken,
														},
													});
												})
												.catch((err) => {
													throw err;
												});
										})
										.catch((err) => {
											throw err;
										});
								} else {
									return res.status(404).json({
										flag: 'error',
										message: 'Movie not found',
										data: null,
										meta: {
											accessToken,
										},
									});
								}
							})
							.catch((err) => {
								throw err;
							});
					} else {
						return res.status(403).json({
							flag: 'error',
							message: "You've already rated this movie",
							data: null,
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
						meta: {
							accessToken,
						},
					});
				}
			})
			.catch((err) => {
				return res.status(500).json({
					flag: 'error',
					message: err.message,
					data: null,
					meta: {
						accessToken,
					},
				});
			});
	} else {
		return res.status(403).json({
			message: 'Invalid rate',
			data: null,
			flag: 'error',
			meta: {
				accessToken,
			},
		});
	}
};

exports.topRanking = (req, res, next) => {
	User.find({})
		.populate('role')
		.populate('movieFollowed')
		.populate({
			path: 'movieRated',
			populate: [
				{
					path: 'fiveStars',
					model: 'Movie',
				},
				{
					path: 'fourStars',
					model: 'Movie',
				},
				{
					path: 'oneStar',
					model: 'Movie',
				},
				{
					path: 'threeStars',
					model: 'Movie',
				},
				{
					path: 'twoStars',
					model: 'Movie',
				},
			],
		})
		.populate({
			path: 'movieWatched',
			populate: {
				path: 'watched',
				model: 'Episode',
				populate: { path: 'movie', model: 'Movie' },
			},
		})
		.populate({ path: 'level', model: Level })
		.sort({ power: -1 })
		.limit(10)
		.exec()
		.then((users) => {
			return res.status(200).json({
				data: users,
				length: users.length,
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

const maskValue = (value, propName) => {
	console.log(value);
	switch (propName) {
		case 'mail':
			return value.replace(
				/^(.)[^@]*/g,
				'$1'.concat('*'.repeat(value.slice(1).indexOf('@')))
			);
		case 'phone':
			return value.replace(/^[0-9]{7}/, '*******');
		default:
			console.log('error masking');
			return value;
	}
};

// Recursive masking function
const maskSensitiveData = (data, fieldsToMask) => {
	Object.keys(data).forEach((key) => {
		if (fieldsToMask.includes(key)) {
			data[key] = maskValue(data[key], key);
			console.log('this is key', key);
			console.log('this is data', data[key]);
		}
	});
};
