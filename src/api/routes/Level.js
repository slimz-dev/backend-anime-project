const express = require('express');
const router = express.Router();
const Level = require('../controllers/LevelController');

router.post('/', Level.createLevel);
router.get('/', Level.getTotalLevels);
router.delete('/', Level.deleteTotalLevels);
// router.post('/login', User.loginUser);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
