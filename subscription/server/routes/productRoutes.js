const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorizeRoles('admin', 'staff'), createProduct);
router.put('/:id', authorizeRoles('admin', 'staff'), updateProduct);
router.delete('/:id', authorizeRoles('admin'), deleteProduct);

module.exports = router;

