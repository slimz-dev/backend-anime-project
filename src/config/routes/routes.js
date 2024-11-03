const paymentRoutes = require('../../api/routes/Payment');
const groupRoutes = require('../../api/routes/UserGroup');
const userRoutes = require('../../api/routes/User');
const movieRoutes = require('../../api/routes/Movie');
const typeRoutes = require('../../api/routes/Type');
const categoryRoutes = require('../../api/routes/Category');
const episodeRoutes = require('../../api/routes/Episode');
const seasonRoutes = require('../../api/routes/Season');
const levelRoutes = require('../../api/routes/Level');
const commentRoutes = require('../../api/routes/Comment');
const notificationRoutes = require('../../api/routes/Notification');

const routesConfig = (app) => {
	app.use('/api/users', userRoutes);
	app.use('/api/movies', movieRoutes);
	app.use('/api/types', typeRoutes);
	app.use('/api/groups', groupRoutes);
	app.use('/api/categories', categoryRoutes);
	app.use('/api/episodes', episodeRoutes);
	app.use('/api/seasons', seasonRoutes);
	app.use('/api/levels', levelRoutes);
	app.use('/api/comments', commentRoutes);
	app.use('/api/payment', paymentRoutes);
	app.use('/api/notifications', notificationRoutes);
};

module.exports = routesConfig;
