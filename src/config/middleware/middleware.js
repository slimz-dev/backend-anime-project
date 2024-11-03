const bodyParser = require('body-parser');

module.exports = (app) => {
	app.use(bodyParser.urlencoded({ limit: '2gb', extended: true }));
	app.use(bodyParser.json({ limit: '2gb' }));
	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', '*');
		if (req.method === 'OPTIONS') {
			res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
			return res.status(200).json({});
		}
		next();
	});
};
