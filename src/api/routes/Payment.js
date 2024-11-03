const express = require('express');
const router = express.Router();
const Payment = require('../controllers/PaymentController');
const verifyToken = require('../middleware/tokenVerify');
const refreshToken = require('../middleware/refreshToken');
router.post('/create-payment', Payment.createPayment);
router.post('/return-payment', Payment.returnPayment);
router.post('/result-payment', Payment.resultPayment);

module.exports = router;
