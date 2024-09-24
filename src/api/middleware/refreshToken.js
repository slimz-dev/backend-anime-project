const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
	try {
		if (req.userID) {
			next();
		} else {
			const { refreshToken } = req.body;
			jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
				if (err) {
					if (err instanceof jwt.TokenExpiredError) {
						return res.status(401).json({
							flag: 'error',
							data: null,
							message: 'Refresh token expired',
						});
					}
					return res.status(403).json({
						flag: 'error',
						data: null,
						message: 'Forbidden access, logout user',
					});
				}
				const accessToken = jwt.sign(
					{
						userID: decoded.userID,
					},
					process.env.ACCESS_TOKEN_SECRET,
					{
						expiresIn: '30s',
					}
				);
				req.userID = decoded.userID;
				req.accessToken = accessToken;
				next();
			});
		}
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
