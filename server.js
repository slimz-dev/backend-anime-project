require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
// const server = https.createServer(app);
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const mongoose = require('./src/config/db');
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
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '*');
	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
		return res.status(200).json({});
	}
	next();
});

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

module.exports = app;
