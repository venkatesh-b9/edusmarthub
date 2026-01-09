import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate, authLimiter } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);
router.post('/refresh', generalLimiter, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

// OAuth routes
router.get('/oauth/:provider', authController.initiateOAuth);
router.get('/oauth/callback', authController.oauthCallback);

// MFA routes (require authentication)
router.post('/mfa/setup', authenticate, authController.setupMFA);
router.post('/mfa/verify', authenticate, authController.verifyMFA);

export default router;
