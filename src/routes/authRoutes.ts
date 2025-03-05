import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);

export default router; 