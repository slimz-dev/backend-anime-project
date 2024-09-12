const mongoose = require('mongoose');
const categorySchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	categoryName: { type: String },
});

module.exports = mongoose.model('Category', categorySchema);
