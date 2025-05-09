const express = require('express');
const router = express.Router();
const Episode = require('../controllers/EpisodeController');
const verifyToken = require('../middleware/tokenVerify');
const refreshToken = require('../middleware/refreshToken');
const { upload } = require('../../../server');

router.post('/', upload.single('episode'), Episode.createEpisode);
router.get('/', Episode.getTotalEpisodes);
router.get('/:movieID', verifyToken, refreshToken, Episode.getEpisodes);
router.get('/admin/:movieID', Episode.getEpisodesFromManager);
// router.post('/login', User.loginUser);
// router.delete('/:userID', User.deleteUser);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
