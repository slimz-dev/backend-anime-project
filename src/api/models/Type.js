const mongoose = require('mongoose');
const typeSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	typeName: { type: String },
});

module.exports = mongoose.model('Type', typeSchema);
