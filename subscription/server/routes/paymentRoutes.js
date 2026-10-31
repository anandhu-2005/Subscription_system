const express = require('express');
const router = express.Router();
const { getPayments, recordPayment } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getPayments);
router.post('/', recordPayment);

module.exports = router;

