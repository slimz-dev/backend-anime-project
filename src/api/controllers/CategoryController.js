const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Category = require('../models/Category');
require('dotenv').config();

exports.createCategory = (req, res, next) => {
	const { categoryName } = req.body;
	Category.findOne({ categoryName })
		.then((category) => {
			if (category) {
				return res.status(403).json({
					error: {
						message: 'Category already exists',
					},
				});
			} else {
				const newCategory = new Category({
					_id: new mongoose.Types.ObjectId().toString(),
					categoryName,
				});
				newCategory
					.save()
					.then((category) => {
						return res.status(200).json({
							data: category,
						});
					})
					.catch((err) => {
						return res.status(500).json({
							error: {
								message: err.message,
							},
						});
					});
			}
		})
		.catch((err) => {
			return res.status(500).json({
				error: { message: err.message },
			});
		});
};

exports.getTotalCategories = (req, res, next) => {
	Category.find({})
		.then((categories) => {
			if (categories.length !== 0) {
				return res.status(200).json({
					data: categories,
					length: categories.length,
				});
			} else {
				return res.status(404).json({
					error: {
						message: 'Not found any category',
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
