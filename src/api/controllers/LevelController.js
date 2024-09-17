const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const Level = require('../models/Level');
require('dotenv').config();

exports.createLevel = (req, res, next) => {
	const { name, index, required } = req.body;

	Level.findOne({ name })
		.then((level) => {
			if (!level) {
				const newLevel = new Level({
					_id: new mongoose.Types.ObjectId().toString(),
					name,
					index,
					required,
				});
				newLevel.save().then((updateLevel) => {
					return res.status(201).json({
						data: updateLevel,
					});
				});
			} else {
				return res.status(403).json({
					error: {
						message: 'This level name already exists',
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

exports.getTotalLevels = (req, res, next) => {
	Level.find({})
		.then((levels) => {
			if (levels.length !== 0) {
				return res.status(200).json({
					data: levels,
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Not found any level',
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

exports.deleteTotalLevels = (req, res, next) => {
	Level.deleteMany({})
		.then(({ deletedCount }) => {
			return res.status(200).json({
				success: {
					message: 'Deleted succesfully',
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
};
