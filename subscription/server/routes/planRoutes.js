const express = require('express');
const router = express.Router();
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getPlans);
router.get('/:id', getPlanById);
router.post('/', authorizeRoles('admin'), createPlan);
router.put('/:id', authorizeRoles('admin'), updatePlan);
router.delete('/:id', authorizeRoles('admin'), deletePlan);

module.exports = router;

