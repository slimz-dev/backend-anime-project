const mongoose = require('mongoose');
const notificationSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	list: [
		{
			content: { type: String },
			createdAt: { type: Date, default: Date.now },
		},
	],
});

module.exports = mongoose.model('Notification', notificationSchema);
