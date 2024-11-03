const express = require('express');
const router = express.Router();
const Notification = require('../controllers/NotificationController');
const { upload } = require('../../../server');
const verifyToken = require('../middleware/tokenVerify');
const refreshToken = require('../middleware/refreshToken');
router.get('/get-notifications', verifyToken, refreshToken, Notification.getNotification);

module.exports = router;
