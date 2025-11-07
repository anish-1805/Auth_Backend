import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JWTPayload, DecodedToken, CookieOptions } from '../types/index.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  try {
    const options = {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'auth-backend',
      audience: 'auth-frontend',
    } as SignOptions;
    return jwt.sign(payload, JWT_SECRET!, options);
  } catch (error) {
    throw new Error('Failed to generate JWT token');
  }
};

// Verify JWT token
export const verifyToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, JWT_SECRET!, {
      issuer: 'auth-backend',
      audience: 'auth-frontend',
    }) as DecodedToken;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active');
      }
    }
    throw new Error('Token verification failed');
  }
};

// Decode JWT token without verification (for debugging)
export const decodeToken = (token: string): jwt.JwtPayload | null => {
  try {
    return jwt.decode(token, { complete: true }) as jwt.JwtPayload | null;
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};

// Generate refresh token (longer expiry)
export const generateRefreshToken = (payload: JWTPayload): string => {
  try {
    const options = {
      expiresIn: '30d', // Refresh tokens last longer
      issuer: 'auth-backend',
      audience: 'auth-frontend',
    } as SignOptions;
    return jwt.sign(payload, JWT_SECRET!, options);
  } catch (error) {
    throw new Error('Failed to generate refresh token');
  }
};

// Cookie options for JWT
export const getCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieExpiresIn = parseInt(process.env.COOKIE_EXPIRES_IN || '7');

  return {
    expires: new Date(Date.now() + cookieExpiresIn * 24 * 60 * 60 * 1000), // Convert days to milliseconds
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // Use secure cookies in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    path: '/', // Cookie available for all routes
  };
};

// Clear cookie options
export const getClearCookieOptions = (): Omit<CookieOptions, 'expires'> => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  };
};
