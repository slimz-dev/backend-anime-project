const express = require('express');
const router = express.Router();
const Comment = require('../controllers/CommentController');
const { upload } = require('../../../server');
router.get('/', Comment.getTotalComments);
router.delete('/', Comment.deleteComments);
router.delete('/delete-comment', upload.any(), Comment.deleteComment);
router.post('/like-comment', upload.any(), Comment.likeComment);
// router.post('/login', User.loginUser);
router.get('/:movieID', Comment.getMovieComments);
router.post('/:movieID', upload.any(), Comment.createComment);
// router.patch('/:groupID', UserGroupController.changeGroup);
module.exports = router;
