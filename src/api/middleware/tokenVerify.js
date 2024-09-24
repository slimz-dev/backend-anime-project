const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
	try {
		const token = req.headers.authorization.split(' ')[1];
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
			if (err) {
				if (err instanceof jwt.TokenExpiredError) {
					next();
				} else {
					return res.status(403).json({
						flag: 'error',
						data: null,
						message: 'Forbidden access',
					});
				}
			} else {
				req.userID = decoded.userID;
				req.accessToken = token;
				next();
			}
		});
	} catch {
		(err) => {
			return res.status(500).json({
				flag: 'error',
				data: null,
				message: err.message,
			});
		};
	}
};
