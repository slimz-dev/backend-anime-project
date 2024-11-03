const mongoose = require('mongoose');
const episodeSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	episodeName: { type: String, required: true },
	movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
	link: { type: String },
	updateAt: { type: Date, default: Date.now },
	secondLink: { type: String },
});

module.exports = mongoose.model('Episode', episodeSchema);
