const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

const perSecondLimiter = rateLimit({
	windowMs: 1000, // 1 giây
	max: 20, // Tối đa 5 yêu cầu mỗi giây
	message: 'Bạn đã gửi quá nhiều yêu cầu. Thử lại sau 1 giây.',
	standardHeaders: true, // Hiển thị header: RateLimit-Limit, RateLimit-Remaining
	legacyHeaders: false, // Không hiển thị header cũ
});
module.exports = (app) => {
	app.use(perSecondLimiter);
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
