const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const Season = require('../models/Season');
require('dotenv').config();

exports.createSeason = (req, res, next) => {
	const { name } = req.body;
	Season.findOne({ name })
		.then((season) => {
			if (!season) {
				const newSeason = new Season({
					_id: new mongoose.Types.ObjectId().toString(),
					name,
				});
				newSeason.save().then((updateSeason) => {
					return res.status(201).json({
						data: updateSeason,
					});
				});
			} else {
				return res.status(403).json({
					error: {
						message: 'This season has already been',
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

exports.getTotalSeasons = (req, res, next) => {
	Season.find({})
		.then((seasons) => {
			if (seasons.length !== 0) {
				return res.status(200).json({
					data: seasons,
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Not found any season',
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

exports.deleteSeason = (req, res, next) => {
	const { seasonID } = req.params;
	Season.deleteOne({ _id: seasonID })
		.then(({ deletedCount }) => {
			if (deletedCount) {
				return res.status(200).json({
					success: {
						message: 'Deleted successfully',
					},
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Not found any season',
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
