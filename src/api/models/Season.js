const mongoose = require('mongoose');
const movieSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	name: { type: String },
	list: [
		{
			seasonName: { type: String },
			link: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
		},
	],
});

module.exports = mongoose.model('Movie', movieSchema);
