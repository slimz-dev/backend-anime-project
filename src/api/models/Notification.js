const mongoose = require('mongoose');
const notificationSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	list: [
		{
			_id: { type: mongoose.Schema.Types.ObjectId },
			content: { type: String },
			link: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
			isSeen: { type: Boolean, default: false },
			createdAt: { type: Date, default: Date.now },
		},
	],
});

module.exports = mongoose.model('Notification', notificationSchema);
