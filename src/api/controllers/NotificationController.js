const mongoose = require('mongoose');

const Notification = require('../models/Notification');
require('dotenv').config();

exports.getNotification = (req, res, next) => {
	const userID = req.userID;
	const accessToken = req.accessToken;
	Notification.findOne({ to: userID })
		.then((noti) => {
			return res.status(200).json({
				data: noti,
				flag: 'success',
				message: 'Fetch notification successfully',
				meta: {
					accessToken,
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
