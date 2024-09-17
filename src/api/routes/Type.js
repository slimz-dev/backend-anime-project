const express = require('express');
const router = express.Router();
const Type = require('../controllers/TypeController');

router.get('/', Type.getTotalTypes);
router.post('/', Type.createType);
// router.post('/login', User.loginUser);
// router.delete('/:userID', User.deleteUser);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
