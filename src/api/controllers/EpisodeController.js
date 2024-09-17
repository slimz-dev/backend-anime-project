const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Movie = require('../models/Movie');
const Episode = require('../models/Episode');
require('dotenv').config();

exports.createEpisode = (req, res, next) => {
	const { movieID, episodeName } = req.body;
	Episode.findOne({ $and: [{ movie, episodeName }] })
		.then((episode) => {
			Movie.findOne({ _id: movieID }).then((movie) => {
				if (movie) {
					if (!episode) {
						const newEpisode = new Episode({
							_id: new mongoose.Types.ObjectId().toString(),
							episodeName,
							movie: movieID,
						});
						newEpisode.save().then((updateEpisode) => {
							return res.status(200).json({
								data: updateEpisode,
							});
						});
					} else {
						return res.status(403).json({
							error: {
								message: 'This episode already exists',
							},
						});
					}
				} else {
					return res.status(404).json({
						error: {
							message: 'Movie not exists',
						},
					});
				}
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
