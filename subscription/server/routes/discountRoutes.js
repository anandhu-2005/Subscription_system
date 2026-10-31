const express = require('express');
const router = express.Router();
const {
  getDiscounts,
  validateDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} = require('../controllers/discountController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getDiscounts);
router.post('/validate', validateDiscount);
router.post('/', authorizeRoles('admin'), createDiscount);
router.put('/:id', authorizeRoles('admin'), updateDiscount);
router.delete('/:id', authorizeRoles('admin'), deleteDiscount);

module.exports = router;

