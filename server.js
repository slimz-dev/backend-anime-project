require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const multer = require('multer');
const server = http.createServer(app);
const { Server } = require('socket.io');
const middlewareConfig = require('./src/config/middleware/middleware');
const mongoose = require('./src/config/db');

app.set('trust proxy', 1);
const storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

const upload = multer({ storage: storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });
exports.upload = upload;
const io = new Server(server);
exports.io = io;
const socketHandler = require('./socket');

// connect db
mongoose.connect();

//Parser
middlewareConfig(app);

const routesConfig = require('./src/config/routes/routes');
routesConfig(app);

app.get('/', (req, res, next) => {
	res.status(200);
	res.json({
		message: 'Back-end server connected successfully !!',
	});
	next();
});
app.use(express.static(path.join(__dirname, 'public')));
io.on('connection', socketHandler);
server.listen(process.env.PORT || 3001, () => {
	console.log(`Example app listening on port ${process.env.PORT || 3001}`);
});

module.exports = app;
