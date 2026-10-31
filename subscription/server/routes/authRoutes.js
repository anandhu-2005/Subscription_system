const express = require('express');
const router = express.Router();
const { register, login, getMe, getUsers } = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, authorizeRoles('admin'), getUsers);

module.exports = router;

