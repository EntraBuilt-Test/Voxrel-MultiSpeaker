import { Router } from 'express';
import * as authController from '@/controllers/auth.controller.js';
import { authenticate } from '@/middleware/authenticate.middleware.js';

const authRouter = Router();

// Public routes
authRouter.post('/register/start', authController.registerStartController);
authRouter.post('/register-admin', authController.registerAdminController);
authRouter.post('/register/verify', authController.registerVerifyController);
authRouter.post('/resend-otp', authController.resendOtpController);
authRouter.post('/login', authController.loginController);
authRouter.post('/forgot-password', authController.forgotPasswordController);
authRouter.post('/reset-password', authController.resetPasswordController);

// Protected routes
authRouter.post('/refresh', authController.refreshTokenController);
authRouter.post('/logout', authenticate, authController.logoutController);
authRouter.post('/change-password', authenticate, authController.changePasswordController);
authRouter.get('/me', authenticate, authController.getMeController);

export default authRouter;
