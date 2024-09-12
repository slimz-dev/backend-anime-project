const mongoose = require('mongoose');
const episodeSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	episodeName: { type: String },
	movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
	link: { type: String },
});

module.exports = mongoose.model('Episode', episodeSchema);
