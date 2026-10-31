const express = require('express');
const router = express.Router();
const { getTaxes, createTax, updateTax, deleteTax } = require('../controllers/taxController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getTaxes);
router.post('/', authorizeRoles('admin'), createTax);
router.put('/:id', authorizeRoles('admin'), updateTax);
router.delete('/:id', authorizeRoles('admin'), deleteTax);

module.exports = router;

