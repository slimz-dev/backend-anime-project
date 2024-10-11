require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const ngrok = require('@ngrok/ngrok');
const multer = require('multer');
const server = http.createServer(app);
// const server = https.createServer(app);
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const mongoose = require('./src/config/db');
const storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

const upload = multer({ storage: storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });
exports.upload = upload;
const groupRoutes = require('./src/api/routes/UserGroup');
const userRoutes = require('./src/api/routes/User');
const movieRoutes = require('./src/api/routes/Movie');
const typeRoutes = require('./src/api/routes/Type');
const categoryRoutes = require('./src/api/routes/Category');
const episodeRoutes = require('./src/api/routes/Episode');
const seasonRoutes = require('./src/api/routes/Season');
const levelRoutes = require('./src/api/routes/Level');
const commentRoutes = require('./src/api/routes/Comment');
// const io = new Server(server, {
// 	cors: {
// 		origin: process.env.FE_URL,
// 		credentials: true,
// 	},
// });

// exports.io = io;
// const socketHandler = require('./socket');
// connect db
mongoose.connect();

//HTTP request
// app.use(morgan('combined'));

//Parser
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

app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/types', typeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/episodes', episodeRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res, next) => {
	res.status(200);
	res.json({
		message: 'Back-end server connected successfully !!',
	});
	next();
});

// io.on('connection', socketHandler);
server.listen(process.env.PORT || 3001, () => {
	console.log(`Example app listening on port ${process.env.PORT || 3001}`);
});
// ngrok.connect({ addr: 3001, authtoken_from_env: true })
// 	.then(listener => console.log(`Ingress established at: ${listener.url()}`));

module.exports = app;
