const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscriptionStatus,
  triggerInvoiceGeneration,
  deleteSubscription,
} = require('../controllers/subscriptionController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getSubscriptions);
router.get('/:id', getSubscriptionById);
router.post('/', authorizeRoles('admin', 'staff'), createSubscription);
router.patch('/:id/status', authorizeRoles('admin', 'staff'), updateSubscriptionStatus);
router.post('/:id/generate-invoice', authorizeRoles('admin', 'staff'), triggerInvoiceGeneration);
router.delete('/:id', authorizeRoles('admin'), deleteSubscription);

module.exports = router;

