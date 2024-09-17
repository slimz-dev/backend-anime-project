const mongoose = require('mongoose');
const levelSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	name: { type: String, required: true },
	index: { type: Number, required: true },
	required: { type: Number, required: true },
});

module.exports = mongoose.model('Lever', levelSchema);
