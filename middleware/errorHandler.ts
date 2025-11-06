import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../types/index.js';

// Global error handling middleware
export const errorHandler = (err: CustomError, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = err.errors as Record<string, { message: string }> | undefined;
    const message = Object.values(errors || {}).map((val) => val.message).join(', ');
    error = {
      success: false,
      message: `Validation Error: ${message}`,
      statusCode: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === '11000') {
    const field = Object.keys(err.keyValue || {})[0];
    error = {
      success: false,
      message: `${field} already exists`,
      statusCode: 409
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      statusCode: 401
    };
  }

  // File system errors
  if (err.code === 'ENOENT') {
    error = {
      success: false,
      message: 'File not found',
      statusCode: 404
    };
  }

  if (err.code === 'EACCES') {
    error = {
      success: false,
      message: 'Permission denied',
      statusCode: 403
    };
  }

  // Send error response
  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error: CustomError = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
