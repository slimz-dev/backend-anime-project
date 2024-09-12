const mongoose = require('mongoose');
const commentSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
	replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	createdAt: { type: Date, default: Date.now() },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	likeUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Comment', commentSchema);
