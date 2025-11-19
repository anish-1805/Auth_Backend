import express, { Request, Response, RequestHandler } from 'express';
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
  resetPassword,
  getAllUsers,
} from '../controllers/authController.js';
import {
  googleAuth,
  googleCallback,
  oauthError,
} from '../controllers/oauthController.js';
import {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  otpVerificationSchema,
  emailOnlySchema,
  resetPasswordSchema,
  validateRequest,
} from '../validations/authValidation.js';
import { authenticateToken, rateLimit } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post(
  '/signup',
  rateLimit as RequestHandler,
  validateRequest(signupSchema) as RequestHandler,
  signup as RequestHandler
);

router.post(
  '/login',
  rateLimit as RequestHandler,
  validateRequest(loginSchema) as RequestHandler,
  login as RequestHandler
);

// OTP verification routes
router.post(
  '/verify-signup-otp',
  rateLimit as RequestHandler,
  validateRequest(otpVerificationSchema) as RequestHandler,
  verifySignupOTP as RequestHandler
);

router.post(
  '/resend-signup-otp',
  rateLimit as RequestHandler,
  validateRequest(emailOnlySchema) as RequestHandler,
  resendSignupOTP as RequestHandler
);

router.post(
  '/forgot-password',
  rateLimit as RequestHandler,
  validateRequest(emailOnlySchema) as RequestHandler,
  forgotPassword as RequestHandler
);

router.post(
  '/verify-password-reset-otp',
  rateLimit as RequestHandler,
  validateRequest(otpVerificationSchema) as RequestHandler,
  verifyPasswordResetOTP as RequestHandler
);

router.post(
  '/reset-password',
  rateLimit as RequestHandler,
  validateRequest(resetPasswordSchema) as RequestHandler,
  resetPassword as RequestHandler
);

// OAuth routes
router.get('/google', rateLimit as RequestHandler, googleAuth);

router.get('/google/callback', googleCallback);

router.get('/oauth/error', oauthError);

// Protected routes (authentication required)
router.post(
  '/logout',
  authenticateToken as RequestHandler,
  logout as RequestHandler
);

router.get(
  '/me',
  authenticateToken as RequestHandler,
  getCurrentUser as RequestHandler
);

router.post(
  '/refresh',
  authenticateToken as RequestHandler,
  refreshToken as RequestHandler
);

router.put(
  '/change-password',
  authenticateToken as RequestHandler,
  validateRequest(changePasswordSchema) as RequestHandler,
  changePassword as RequestHandler
);

router.put(
  '/profile',
  authenticateToken as RequestHandler,
  validateRequest(updateProfileSchema) as RequestHandler,
  updateProfile as RequestHandler
);

// Get all users (protected route)
router.get(
  '/users',
  authenticateToken as RequestHandler,
  getAllUsers as RequestHandler
);

// Socket token route (for Socket.IO authentication)
router.get(
  '/socket-token',
  authenticateToken as RequestHandler,
  (req: Request, res: Response) => {
    const token = req.cookies.jwt;
    if (token) {
      res.status(200).json({
        success: true,
        token,
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'No token available',
      });
    }
  }
);

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
