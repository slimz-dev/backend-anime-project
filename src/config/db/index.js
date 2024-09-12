const mongoose = require('mongoose');
require('dotenv').config();
async function connect() {
	try {
		await mongoose.connect(process.env.DB, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('success');
	} catch (error) {}
}

module.exports = { connect };
