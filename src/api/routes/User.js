const express = require('express');
const router = express.Router();
const User = require('../controllers/UserController');
const verifyToken = require('../middleware/tokenVerify');
const refreshToken = require('../middleware/refreshToken');

router.get('/', User.getTotalUser);
router.post('/', User.createUser);
router.post('/login', User.loginUser);
router.post('/my-info', verifyToken, refreshToken, User.getUser);
router.delete('/:userID', User.deleteUser);
router.patch('/:userID', User.changeUser);
router.patch('/remove-devices/:userID', verifyToken, refreshToken, User.removeDevices);
module.exports = router;
