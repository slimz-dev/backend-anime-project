const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Level = require('../models/Level');
exports.getTotalComments = (req, res, next) => {
	Comment.find({})
		.select()
		.exec()
		.then((comments) => {
			return res.status(200).json({
				data: comments,
				message: 'Fetch comments successfully',
				flag: 'success',
			});
		})
		.catch((err) => {
			return res.status(500).json({
				data: null,
				message: err.message,
				flag: 'error',
			});
		});
};

exports.getMovieComments = (req, res, next) => {
	const { movieID } = req.params;
	Movie.findOne({ _id: movieID })
		.then((movie) => {
			if (movie) {
				Comment.find({ $and: [{ movieID }, { replyTo: { $exists: false } }] })
					.populate({
						path: 'createdBy',
						select: {
							loginDevices: 0,
						},
						populate: { path: 'level', model: Level },
					})
					.populate({
						path: 'commentsReply',
						populate: [
							{
								path: 'createdBy',
								model: 'User',
								select: {
									loginDevices: 0,
								},
								populate: { path: 'level', model: Level },
							},
							{
								path: 'replyTo',
								model: 'Comment',
								populate: {
									path: 'createdBy',
									model: 'User',
									select: {
										loginDevices: 0,
									},
								},
							},
							{
								path: 'commentsReply',
								model: 'Comment',
								populate: [
									{
										path: 'createdBy',
										model: 'User',
										select: {
											loginDevices: 0,
										},
										populate: { path: 'level', model: Level },
									},
									{
										path: 'replyTo',
										model: 'Comment',
										populate: {
											path: 'createdBy',
											model: 'User',
											select: {
												loginDevices: 0,
											},
										},
									},
								],
							},
						],
					})
					.then((comments) => {
						return res.status(200).json({
							flag: 'success',
							message: 'Fetch comments successfully',
							data: comments,
						});
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
					message: 'Movie not found',
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

exports.createComment = (req, res, next) => {
	const { movieID } = req.params;
	const { replyTo, createdBy, content } = req.body;
	if (createdBy && content) {
		Movie.findOne({ _id: movieID })
			.then((movie) => {
				if (movie) {
					User.findOne({ _id: createdBy })
						.then((user) => {
							if (user) {
								if (replyTo) {
									Comment.findOne({ $and: [{ _id: replyTo }, { movieID }] })
										.then((comment) => {
											if (comment) {
												const newComment = new Comment({
													_id: new mongoose.Types.ObjectId().toString(),
													movieID,
													createdBy,
													replyTo,
													content,
												});
												newComment.save().then((newCommentCreated) => {
													comment.commentsReply.push(newCommentCreated);
													comment.save().then((commentUpdated) => {
														return res.status(201).json({
															data: {
																newComment: newCommentCreated,
																replyTo: commentUpdated,
															},
															message: 'comment created',
															flag: 'success',
														});
													});
												});
											} else {
												return res.status(500).json({
													data: null,
													flag: 'error',
													message: 'Comment you try to reply not existed',
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
									const newComment = new Comment({
										_id: new mongoose.Types.ObjectId().toString(),
										movieID,
										createdBy,
										content,
									});
									newComment.save().then((comment) => {
										return res.status(201).json({
											data: comment,
											message: 'comment created',
											flag: 'success',
										});
									});
								}
							} else {
								return res.status(404).json({
									flag: 'error',
									message: 'User created this comment not found',
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
						message: 'The movie u try to create comment not found',
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
			data: null,
			message: 'missing some fields',
			flag: 'error',
		});
	}
};

exports.deleteComments = (req, res, next) => {
	Comment.deleteMany({})
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

exports.likeComment = (req, res, next) => {
	const { userID, commentID } = req.body;
	Comment.findOne({ _id: commentID })
		.then((comment) => {
			if (comment) {
				const userIndex = comment.findIndex((item) => {
					return item === userID;
				});
				if (userIndex !== -1) {
					comment.splice(userIndex, 1);
					comment
						.save()
						.then((updatedComment) => {
							return res.status(200).json({
								flag: 'error',
								message: 'Unlike comment successfully',
								data: updatedComment,
							});
						})
						.catch((err) => {
							throw err;
						});
				} else {
					comment.push(userID);
					comment
						.save()
						.then((updatedComment) => {
							return res.status(200).json({
								flag: 'error',
								message: 'Like comment successfully',
								data: updatedComment,
							});
						})
						.catch((err) => {
							throw err;
						});
				}
			} else {
				return res.status(404).json({
					flag: 'error',
					message: 'comment not found',
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
