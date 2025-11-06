import express, { Request, Response } from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
  changePassword,
  updateProfile,
  refreshToken,
  verifySignupOTP,
  resendSignupOTP,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword
} from '../controllers/authController.js';
import {
  googleAuth,
  googleCallback,
  oauthError
} from '../controllers/oauthController.js';
import {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  otpVerificationSchema,
  emailOnlySchema,
  resetPasswordSchema,
  validateRequest
} from '../validations/authValidation.js';
import { authenticateToken, rateLimit } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', 
  rateLimit as any,
  validateRequest(signupSchema) as any, 
  signup as any
);

router.post('/login', 
  rateLimit as any,
  validateRequest(loginSchema) as any, 
  login as any
);

// OTP verification routes
router.post('/verify-signup-otp',
  rateLimit as any,
  validateRequest(otpVerificationSchema) as any,
  verifySignupOTP as any
);

router.post('/resend-signup-otp',
  rateLimit as any,
  validateRequest(emailOnlySchema) as any,
  resendSignupOTP as any
);

router.post('/forgot-password',
  rateLimit as any,
  validateRequest(emailOnlySchema) as any,
  forgotPassword as any
);

router.post('/verify-password-reset-otp',
  rateLimit as any,
  validateRequest(otpVerificationSchema) as any,
  verifyPasswordResetOTP as any
);

router.post('/reset-password',
  rateLimit as any,
  validateRequest(resetPasswordSchema) as any,
  resetPassword as any
);

// OAuth routes
router.get('/google', 
  rateLimit as any,
  googleAuth
);

router.get('/google/callback', 
  googleCallback
);

router.get('/oauth/error',
  oauthError
);

// Protected routes (authentication required)
router.post('/logout', 
  authenticateToken as any, 
  logout as any
);

router.get('/me', 
  authenticateToken as any, 
  getCurrentUser as any
);

router.post('/refresh', 
  authenticateToken as any, 
  refreshToken as any
);

router.put('/change-password', 
  authenticateToken as any,
  validateRequest(changePasswordSchema) as any,
  changePassword as any
);

router.put('/profile', 
  authenticateToken as any,
  validateRequest(updateProfileSchema) as any,
  updateProfile as any
);

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
