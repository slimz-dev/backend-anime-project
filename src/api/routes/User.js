const express = require('express');
const router = express.Router();
const User = require('../controllers/UserController');

router.get('/', User.getTotalUser);
router.post('/', User.createUser);
router.post('/login', User.loginUser);
router.delete('/:userID', User.deleteUser);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
