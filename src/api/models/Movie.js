const mongoose = require('mongoose');
const movieSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	movieName: { type: String, required: true },
	otherName: { type: String, required: true },
	poster: { type: String, required: true },
	picture: { type: String, required: true },
	nameImg: { type: String, required: true },
	description: [{ type: String, required: true }],
	categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
	type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
	newEpisode: { type: mongoose.Schema.Types.ObjectId, ref: 'Episode' },
	update: [{ type: Number }],
	otherInfo: {
		release: { type: Number, required: true },
		total: { type: Number },
		imdb: { type: Number },
		timeEstimate: { type: Number },
	},
	rating: { totalUser: { type: Number, default: 0 }, totalStar: { type: Number, default: 0 } },
	releasedDate: { type: Date, default: Date.now },
	isReleased: { type: Boolean, default: false },
	watchTime: { type: Number, default: 0 },
	isCompleted: { type: Boolean, default: false },
});

module.exports = mongoose.model('Movie', movieSchema);
