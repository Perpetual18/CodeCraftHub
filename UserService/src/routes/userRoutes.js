/*
 * src/routes/userRoutes.js
 * Defines user-related API endpoints.
 */
const express = require('express');
const UserController = require('../controllers/userController');
const validate = require('../middlewares/validateMiddleware');
const auth = require('../middlewares/authMiddleware');
const { registerSchema, loginSchema } = require('../utils/validators');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), UserController.register);
router.post('/login', validate(loginSchema), UserController.login);

// Protected routes
router.get('/profile', auth, UserController.getProfile);
router.put('/profile', auth, UserController.updateProfile);

module.exports = router;