const express = require('express');
const router = express.Router();
const Movie = require('../controllers/MovieController');

router.post('/', Movie.createMovie);
router.get('/', Movie.getTotalMovies);
router.delete('/', Movie.deleteTotalMovies);
// router.post('/login', User.loginUser);
router.delete('/:movieID', Movie.deleteMovie);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
