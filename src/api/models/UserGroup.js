const mongoose = require('mongoose');
const userGroupSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	name: { type: String },
	permission: {
		adminAccess: {
			create: { type: Boolean, default: false },
			read: { type: Boolean, default: false },
			update: { type: Boolean, default: false },
			delete: { type: Boolean, default: false },
		},
		movie: {
			create: { type: Boolean, default: false },
			read: { type: Boolean, default: true },
			update: { type: Boolean, default: false },
			delete: { type: Boolean, default: false },
		},
		user: {
			create: { type: Boolean, default: true },
			read: { type: Boolean, default: true },
			update: { type: Boolean, default: true },
			delete: { type: Boolean, default: true },
		},
		comment: {
			create: { type: Boolean, default: true },
			read: { type: Boolean, default: true },
			update: { type: Boolean, default: true },
			delete: { type: Boolean, default: true },
		},
	},
});

module.exports = mongoose.model('UserGroup', userGroupSchema);
