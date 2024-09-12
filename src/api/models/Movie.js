const mongoose = require('mongoose');
const movieSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	name: { type: String },
	otherName: { type: String },
	poster: { type: String },
	picture: { type: String },
	nameImg: { type: String },
	description: { type: String },
	categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
	type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
	newEpisode: { type: mongoose.Schema.Types.ObjectId, ref: 'Episode' },
	update: [{ type: Number }],
	otherInfo: { release: { type: Number }, total: { type: Number } },
	seasons: { type: mongoose.Schema.Types.ObjectId, ref: 'Season' },
	rating: { totalUser: { type: Number }, totalStar: { type: Number } },
	releasedDate: { type: Date, default: Date.now() },
	isReleased: { type: Boolean, default: false },
	watchTime: { type: Number },
});

module.exports = mongoose.model('Movie', movieSchema);
