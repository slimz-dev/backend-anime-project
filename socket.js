const mongoose = require('mongoose');
const { io } = require('./server');
const Comment = require('./src/api/models/Comment');
const Movie = require('./src/api/models/Movie');
const Level = require('./src/api/models/Level');
const Notification = require('./src/api/models/Notification');
let userState = [];
let userLoggedIn = {};
let userInApp = {};
const handleComment = (movieID) => {
	Movie.findOne({ _id: movieID })
		.then((movie) => {
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
					io.to(movieID).emit('update-comment', comments);
				})
				.catch((err) => {
					throw err;
				});
		})
		.catch((err) => {
			console.log(err);
		});
};
const handleNotification = (data) => {
	console.log(data);
	Notification.findOne({ to: data.to })
		.then(async (noti) => {
			if (!noti) {
				newNotification = new Notification({
					_id: new mongoose.Types.ObjectId().toString(),
					to: data.to,
					list: [
						{
							_id: new mongoose.Types.ObjectId().toString(),
							content: data.content,
							link: data.link,
						},
					],
				});
				await newNotification
					.save()
					.then((newNoti) => {
						console.log(userInApp);
						for (let [socketID, user] of Object.entries(userInApp)) {
							if (user.localeCompare(replyTo) === 0) {
								io.to(socketID).emit('notification', newNoti.list);
							}
						}
					})
					.catch((err) => {
						throw err;
					});
			} else {
				noti.list.push({
					_id: new mongoose.Types.ObjectId().toString(),
					...data,
				});
				await noti
					.save()
					.then((updatedNoti) => {
						for (let [socketID, user] of Object.entries(userInApp)) {
							if (user.localeCompare(data.to) === 0) {
								io.to(socketID).emit('notification', updatedNoti.list);
							}
						}
					})
					.catch((err) => {
						throw err;
					});
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

const changeNotificationState = (data) => {
	Notification.findOneAndUpdate(
		{ to: data.userID, 'list._id': data.notificationID },
		{ $set: { 'list.$.isSeen': true } },
		{ new: true } // Returns the updated document
	)
		.then((updatedDocument) => {
			for (let [socketID, user] of Object.entries(userInApp)) {
				if (user.localeCompare(data.userID) === 0) {
					io.to(socketID).emit('notification', updatedDocument.list);
				}
			}
		})
		.catch((error) => {
			console.error('Error updating document:', error);
		});
};

const socketHandler = (socket) => {
	console.log('connecting to socket');
	socket.emit('socketID', socket.id);
	socket.on('online', (userID) => {
		console.log('online');
		userInApp[socket.id] = userID;
		console.log(userInApp);
	});
	socket.on('connect_error', () => {
		console.log('error connecting to server');
	});
	socket.on('joinMovieRoom', (movieID) => {
		socket.join(movieID);
		console.log(`User joined room for movie: ${movieID}`);
	});
	socket.on('leaveMovie', (movieID) => {
		socket.leave(movieID); // Leave the room named after the movieID
		console.log(`User ${socket.id} left movie ${movieID}`);
	});
	socket.on('comment', (movieID) => {
		console.log('comment received from client');
		handleComment(movieID);
	});
	socket.on('fetch-user', () => {
		socket.emit('user-info-changed');
	});

	socket.on('send-notification', (data) => handleNotification(data));
	socket.on('press-notification', (data) => changeNotificationState(data));
	socket.on('disconnect', () => {
		delete userInApp[socket.id];
		console.log('disconnected');
	});
};

module.exports = socketHandler;
