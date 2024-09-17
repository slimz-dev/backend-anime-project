const express = require('express');
const router = express.Router();
const Season = require('../controllers/SeasonController');

router.get('/', Season.getTotalSeasons);
router.post('/', Season.createSeason);
// router.post('/login', User.loginUser);
router.delete('/:seasonID', Season.deleteSeason);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
