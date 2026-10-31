const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  triggerBillingEngine,
  updateInvoiceStatus,
} = require('../controllers/invoiceController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/run-billing', authorizeRoles('admin', 'staff'), triggerBillingEngine);
router.patch('/:id/status', authorizeRoles('admin', 'staff'), updateInvoiceStatus);

module.exports = router;

