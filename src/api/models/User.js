const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	role: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },
	name: { type: String },
	username: { type: String },
	password: { type: String },
	quote: { type: String },
	dob: { type: Date },
	avatar: {
		type: String,
		default: 'https://res.cloudinary.com/dwdjj1kvh/image/upload/v1726507535/user_bhhnje.png',
	},
	level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
	mail: { type: String, default: '' },
	phone: { type: String, default: '' },
	movieFollowed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
	movieWatched: [
		{
			currentTime: { type: Number },
			watched: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
		},
	],
	movieRated: {
		fiveStars: {
			type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			default: [],
		},
		fourStars: {
			type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			default: [],
		},
		threeStars: {
			type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			default: [],
		},
		twoStars: {
			type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			default: [],
		},
		oneStar: {
			type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			default: [],
		},
	},
	watchTime: { type: Number, default: 0 },
	balance: { type: Number, default: 0 },
	power: { type: Number, default: 0 },
	loginDevices: {
		type: [
			{
				deviceID: { type: String },
				deviceName: { type: String },
				refreshToken: { type: String },
			},
		],
		select: true,
	},
	vipExpired: { type: Date },
});

module.exports = mongoose.model('User', userSchema);
