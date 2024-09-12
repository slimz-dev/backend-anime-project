const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	name: { type: String },
	avatar: { type: String },
	level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
	mail: { type: String },
	phone: { type: String },
	movieFollowed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
	watchTime: { type: Number },
});

module.exports = mongoose.model('User', userSchema);
