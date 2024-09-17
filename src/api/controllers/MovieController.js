const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Season = require('../models/Season');
const Movie = require('../models/Movie');
require('dotenv').config();

exports.createMovie = (req, res, next) => {
	const { movieName, seasonName } = req.body;
	Movie.find({ name: movieName })
		.then((movies) => {
			// Check if movie exists in database
			if (movies.length === 0) {
				// Find season relate to that movie
				Season.findOne({ name: seasonName }).then((season) => {
					// Add new movie
					const newMovie = new Movie({
						_id: new mongoose.Types.ObjectId().toString(),
						...req.body,
					});
					newMovie
						.save()
						.then((movie) => {
							// Check if season exists in database
							if (!season) {
								const newSeason = new Season({
									_id: new mongoose.Types.ObjectId().toString(),
									name: seasonName,
									list: [{ seasonName: movieName, link: movie._id }],
								});
								newSeason
									.save()
									.then((updateNewSeason) => {
										return res.status(200).json({
											data: {
												movie,
												season: updateNewSeason,
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

								//Push new movie if season already exist
							} else {
								console.log(season);
								season.list.push({
									seasonName: movieName,
									link: movie._id,
								});
								season.save();
							}
							return res.status(200).json({
								data: {
									movie,
									season,
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
				});
			} else {
				return res.status(422).json({
					error: {
						message: 'Movies with the same name already existed',
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

exports.getTotalMovies = (req, res, next) => {
	Movie.find({})
		.then((movies) => {
			if (movies.length !== 0) {
				return res.status(200).json({
					data: movies,
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Not found any movie',
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

exports.deleteMovie = (req, res, next) => {
	const { movieID } = req.params;
	Movie.deleteOne({ _id: movieID })
		.then(({ deletedCount }) => {
			if (deletedCount) {
				Season.findOneAndUpdate(
					{ list: [{ link: movieID }] },
					{ $pull: { list: { link: movieID } } },
					{ new: true }
				).then((season) => {
					return res.status(200).json({
						success: {
							message: 'Deleted successfully',
							season,
						},
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
