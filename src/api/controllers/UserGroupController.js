const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const UserGroup = require('../models/UserGroup');
require('dotenv').config();

exports.createGroup = (req, res, next) => {
	const { name, permission } = req.body;
	UserGroup.find({ name: name })
		.then((group) => {
			if (group.length === 0 && name && permission) {
				const groups = new UserGroup({
					_id: new mongoose.Types.ObjectId().toString(),
					name,
					permission,
				});
				groups.save().then((result) => {
					return res.status(201).json({ data: result });
				});
			} else if (!name) {
				return res.status(403).json({
					error: {
						message: 'Role name is required',
					},
				});
			} else if (!permission) {
				return res.status(403).json({
					error: {
						message: 'Permissions are required',
					},
				});
			} else {
				return res.status(403).json({
					error: {
						message: 'Group already existed',
					},
				});
			}
		})
		.catch((err) => {
			return res.status(500).json({
				error: { message: err.message },
			});
		});
};

exports.getTotalGroup = (req, res, next) => {
	console.log('hi');
	UserGroup.find({})
		.then((group) => {
			return res.status(200).json({ data: group });
		})
		.catch((err) => {
			return res.status(500).json({
				error: { message: err.message },
			});
		});
};

exports.changeGroup = (req, res, next) => {};

exports.deleteGroup = (req, res, next) => {
	const groupID = req.params.groupID;
	UserGroup.find({ _id: groupID })
		.then((group) => {
			if (group.length) {
				UserGroup.deleteOne({ _id: groupID })
					.then(() => {
						return res.status(200).json({
							success: {
								message: 'Delete group successfully',
							},
						});
					})
					.catch((err) => {
						return res.status(403).json({
							error: {
								message: err.message,
							},
						});
					});
			} else {
				return res.status(403).json({
					error: {
						message: "Can't find any group with that ID",
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
