const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const Notification = require('../models/Notification');
const Movie = require('../models/Movie');
require('dotenv').config();

exports.createUser = (req, res, next) => {
	const { username, password, name } = req.body;
	User.find({ username: username })
		.then((user) => {
			if (user.length === 0 && username && password && name) {
				//ENCODE password
				bcrypt.hash(password, 10, (err, hash) => {
					if (err) {
						return res.status(500).json({
							error: { message: err.message },
						});
					} else {
						UserGroup.find({ name: process.env.DEFAULT_ROLE_NAME }).then((group) => {
							const users = new User({
								_id: new mongoose.Types.ObjectId().toString(),
								name,
								username,
								password: hash,
								role: group[0]._id,
							});
							users.save().then((result) => {
								const notification = new Notification({
									_id: new mongoose.Types.ObjectId().toString(),
									to: result._id,
								});
								notification.save();
								return res.status(201).json({ data: result });
							});
						});
					}
				});
			} else {
				if (user.length === 1) {
					return res.status(409).json({
						error: { message: 'Existed' },
					});
				} else if (!password) {
					return res.status(422).json({
						error: { message: 'Password required' },
					});
				} else if (!name) {
					return res.status(422).json({
						error: { message: 'name required' },
					});
				} else {
					return res.status(422).json({
						error: { message: 'username required' },
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
		.populate('movieWatched')
		.exec()
		.then((users) => {
			return res.status(200).json({
				data: users,
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
	User.find({ _id: userID })
		.then((user) => {
			if (user.length) {
				User.deleteOne({ _id: userID })
					.then(() => {
						return res.status(200).json({
							success: {
								message: 'Delete user successfully',
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
						message: "Can't find any user with that ID",
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

exports.loginUser = (req, res, next) => {
	const { username, password } = req.body;
	User.find({ username })
		.then((user) => {
			if (user.length && username && password) {
				bcrypt.compare(password, user[0].password, (err, result) => {
					if (err) {
						return res.status(401).json({
							error: { message: err.message },
						});
					}
					if (result) {
						return res.status(200).json({
							data: user,
						});
					} else {
						return res.status(401).json({
							error: {
								message: 'Wrong password',
							},
						});
					}
				});
			} else if (!username) {
				return res.status(422).json({
					error: {
						message: 'Username required',
					},
				});
			} else if (!password) {
				return res.status(422).json({
					error: {
						message: 'Password required',
					},
				});
			} else {
				return res.status(401).json({
					error: {
						message: 'User not found',
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
