import express from 'express';
import { register, login, getMe, logout, activateStaff } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, invitationLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/activate-staff', invitationLimiter, activateStaff);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
