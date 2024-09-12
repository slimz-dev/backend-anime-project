const mongoose = require('mongoose');
const levelSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	name: { type: String },
	index: { type: Number },
});

module.exports = mongoose.model('Lever', levelSchema);
