const express = require('express');
const router = express.Router();
const Season = require('../controllers/SeasonController');

router.get('/', Season.getTotalSeasons);
router.get('/:movieID', Season.getSeason);
router.post('/', Season.createSeason);
router.patch('/:seasonID', Season.removeMovie);
// router.post('/login', User.loginUser);
router.delete('/:seasonID', Season.deleteSeason);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
