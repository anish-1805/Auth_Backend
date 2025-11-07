import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../utils/jwt.js';
import { User } from '../types/index.js';

/**
 * Initiate Google OAuth login
 * Redirects user to Google consent screen
 */
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/**
 * Google OAuth callback handler
 * Called after user approves/denies on Google consent screen
 */
export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    'google',
    { session: false },
    (err: Error | null, user: User | false, _info: unknown) => {
      try {
        // Handle authentication errors
        if (err) {
          console.error('Google OAuth Error:', err);
          const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:3000';
          res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed`);
          return;
        }

        // Handle case where user is not authenticated
        if (!user) {
          console.error('Google OAuth: No user returned');
          const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:3000';
          res.redirect(
            `${frontendUrl}/auth/callback?error=authentication_failed`
          );
          return;
        }

        // Debug: Log user object to see its structure
        console.log('Google OAuth User:', JSON.stringify(user, null, 2));

        // Generate JWT token for the user (must match the format expected by auth middleware)
        const token = generateToken({
          userId: user.id, // Changed from 'id' to 'userId' to match auth middleware expectation
          email: user.email,
          name: user.name,
        });

        // Set httpOnly cookie with JWT token (must match the name expected by auth middleware)
        res.cookie('jwt', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
          domain:
            process.env.NODE_ENV === 'production'
              ? process.env.COOKIE_DOMAIN
              : 'localhost',
        });

        // Redirect to frontend with success status
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?auth=success`);
      } catch (error) {
        console.error('Google OAuth Callback Error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?error=server_error`);
      }
    }
  )(req, res, next);
};

/**
 * Handle OAuth errors
 */
export const oauthError = (_req: Request, res: Response): void => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/login?error=oauth_failed`);
};
