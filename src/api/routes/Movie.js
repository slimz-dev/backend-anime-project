const express = require('express');
const router = express.Router();
const Movie = require('../controllers/MovieController');
const { upload } = require('../../../server');
router.post(
	'/',
	upload.fields([
		{ name: 'poster', maxCount: 1 },
		{ name: 'picture', maxCount: 1 },
		{ name: 'nameImg', maxCount: 1 },
	]),
	Movie.createMovie
);
router.get('/', Movie.getTotalMovies);
router.delete('/', Movie.deleteTotalMovies);
// router.post('/login', User.loginUser);
router.delete('/:movieID', Movie.deleteMovie);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
