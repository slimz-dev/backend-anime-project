const express = require('express');
const router = express.Router();
const UserGroupController = require('../controllers/UserGroupController');

router.get('/', UserGroupController.getTotalGroup);
router.post('/', UserGroupController.createGroup);
router.delete('/:groupID', UserGroupController.deleteGroup);
router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
