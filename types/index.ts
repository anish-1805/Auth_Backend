import { Request } from 'express';
import { User as PrismaUser } from '@prisma/client';

// User types
export interface User extends PrismaUser {}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  provider?: string | null;
  providerId?: string | null;
  avatar?: string | null;
  isSocialLogin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  provider?: string;
  providerId?: string;
  avatar?: string | null;
  isEmailVerified?: boolean;
  isSocialLogin?: boolean;
}

export interface OAuthUserData {
  name: string;
  email: string;
  provider: string;
  providerId: string;
  avatar?: string | null;
  isEmailVerified?: boolean;
}

// OTP types
export interface OTPData {
  otp: string;
  expiryTime: string;
  createdAt: string;
  isUsed?: boolean;
}

export interface OTPVerificationResult {
  isValid: boolean;
  error: string | null;
}

export interface OTPRemainingTime {
  minutes: number;
  seconds: number;
  expired: boolean;
}

// JWT types
export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
}

export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface CookieOptions {
  expires: Date;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
}

// Request types with user
export interface AuthRequest extends Request {
  user?: UserResponse;
  targetUser?: User;
}

// Password validation types
export interface PasswordValidationResult {
  isValid: boolean;
  issues: string[];
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  user?: UserResponse;
  errors?: Array<{ field: string; message: string }>;
  error?: string;
}

// Auth request body types
export interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequestBody {
  name?: string;
  email?: string;
}

export interface OTPVerificationRequestBody {
  email: string;
  otp: string;
}

export interface EmailOnlyRequestBody {
  email: string;
}

export interface ResetPasswordRequestBody {
  email: string;
  otp: string;
  newPassword: string;
}

// Database health check
export interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy';
  error?: string;
  timestamp: string;
}

// Error types
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

// Email service types
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string | undefined;
    pass: string | undefined;
  };
}

// Passport types
export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
}

// Rate limiting types
export interface RateLimitData {
  count: number;
  firstRequest: number;
}
