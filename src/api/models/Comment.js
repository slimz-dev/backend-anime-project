const mongoose = require('mongoose');
const commentSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	movieID: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
	replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	content: { type: String },
	createdAt: { type: Date, default: Date.now },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	likeUsers: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
	commentsReply: {
		type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
		default: [],
	},
});

module.exports = mongoose.model('Comment', commentSchema);
