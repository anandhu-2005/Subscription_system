const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', authorizeRoles('admin', 'staff'), getCustomers);
router.get('/:id', getCustomerById); // role checked inside controller
router.post('/', authorizeRoles('admin', 'staff'), createCustomer);
router.put('/:id', authorizeRoles('admin', 'staff'), updateCustomer);
router.delete('/:id', authorizeRoles('admin'), deleteCustomer);

module.exports = router;

