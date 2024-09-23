const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId },
	role: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },
	name: { type: String },
	username: { type: String },
	password: { type: String },
	avatar: {
		type: String,
		default: 'https://res.cloudinary.com/dwdjj1kvh/image/upload/v1726507535/user_bhhnje.png',
	},
	level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
	mail: { type: String, default: '' },
	phone: { type: String, default: '' },
	movieFollowed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
	movieWatched: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Episode' }],
	rated: [
		{
			fiveStar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			fourStar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			threeStar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			twoStar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
			oneStar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
		},
	],
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
});

module.exports = mongoose.model('User', userSchema);
