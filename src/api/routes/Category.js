const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');

router.get('/', CategoryController.getTotalCategories);
router.post('/', CategoryController.createCategory);
// router.delete('/:categoryID', CategoryController.deleteCategory);
// router.patch('/:categoryID', CategoryController.changeCategory);
module.exports = router;
