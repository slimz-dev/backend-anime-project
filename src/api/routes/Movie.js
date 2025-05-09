const express = require('express');
const router = express.Router();
const Movie = require('../controllers/MovieController');
const { upload } = require('../../../server');
const tokenVerify = require('../middleware/tokenVerify');
const refreshToken = require('../middleware/refreshToken');
router.post(
	'/',
	upload.fields([
		{ name: 'poster', maxCount: 1 },
		{ name: 'picture', maxCount: 1 },
		{ name: 'nameImg', maxCount: 1 },
	]),
	Movie.createMovie
);
router.get('/', tokenVerify, refreshToken, Movie.getTotalMovies);
router.patch('/', Movie.patchAllMovies);

router.get('/search', Movie.searchMovie);
router.get('/update', tokenVerify, refreshToken, Movie.getMoviesFromUpdate);
router.get('/most-viewed', tokenVerify, refreshToken, Movie.hotestMovie);
router.get('/top-rated', Movie.topRatedMovies);
router.get('/top-watched', Movie.topWatchedMovies);
router.get('/upcoming', Movie.upcomingMovies);
router.delete('/', Movie.deleteTotalMovies);
router.delete('/:movieID', Movie.deleteMovie);
router.patch('/:movieID', Movie.patchMovie);
router.get('/:movieID', Movie.getMovie);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
