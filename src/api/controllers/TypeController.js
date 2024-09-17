const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const Type = require('../models/Type');
require('dotenv').config();

exports.createType = (req, res, next) => {
	const { typeName } = req.body;
	Type.find({ typeName })
		.then((type) => {
			if (type.length === 0 && typeName) {
				const newType = new Type({
					_id: new mongoose.Types.ObjectId().toString(),
					typeName,
				});
				newType.save();
				return res.status(200).json({
					data: newType,
				});
			} else if (!typeName) {
				return res.status(422).json({
					error: {
						message: 'Type name required',
					},
				});
			} else {
				return res.status(403).json({
					error: {
						message: 'This movie type has already existed',
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

exports.getTotalTypes = (req, res, next) => {
	Type.find({})
		.then((types) => {
			if (types.length !== 0) {
				return res.status(200).json({
					data: types,
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Not found any type',
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
