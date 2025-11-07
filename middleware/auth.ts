import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import UserModel from '../models/userModel.js';
import { AuthRequest, RateLimitData } from '../types/index.js';

// Middleware to authenticate JWT token from cookies
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookies
    const token = req.cookies.jwt;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
      });
      return;
    }

    // Add user info to request object (excluding password)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      provider: user.provider,
      providerId: user.providerId,
      avatar: user.avatar,
      isSocialLogin: user.isSocialLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Invalid token';
    res.status(401).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Middleware to check if user is authenticated (optional authentication)
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.jwt;

    if (token) {
      const decoded = verifyToken(token);
      const user = await UserModel.findById(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          provider: user.provider,
          providerId: user.providerId,
          avatar: user.avatar,
          isSocialLogin: user.isSocialLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Middleware to check if user owns the resource
export const checkOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (req.user.id !== resourceUserId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
      });
      return;
    }

    next();
  };
};

// Middleware to validate user exists
export const validateUserExists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId || req.user?.id;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    req.targetUser = user;
    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : undefined;
    res.status(500).json({
      success: false,
      message: 'Error validating user',
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
    });
  }
};

// Rate limiting middleware (simple in-memory implementation)
const requestCounts = new Map<string, RateLimitData>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

export const rateLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const clientId = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Clean up old entries
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      requestCounts.delete(key);
    }
  }

  // Check current client
  const clientData = requestCounts.get(clientId);

  if (!clientData) {
    requestCounts.set(clientId, {
      count: 1,
      firstRequest: now,
    });
    next();
    return;
  }

  if (now - clientData.firstRequest > RATE_LIMIT_WINDOW) {
    // Reset window
    requestCounts.set(clientId, {
      count: 1,
      firstRequest: now,
    });
    next();
    return;
  }

  if (clientData.count >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(
        (RATE_LIMIT_WINDOW - (now - clientData.firstRequest)) / 1000
      ),
    });
    return;
  }

  clientData.count++;
  next();
};
