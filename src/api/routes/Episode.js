const express = require('express');
const router = express.Router();
const Episode = require('../controllers/EpisodeController');

router.post('/', Episode.createEpisode);
router.get('/', Episode.getTotalEpisodes);
// router.post('/login', User.loginUser);
// router.delete('/:userID', User.deleteUser);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
