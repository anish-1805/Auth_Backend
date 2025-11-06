import crypto from 'crypto';
import { OTPData, OTPVerificationResult, OTPRemainingTime } from '../types/index.js';

/**
 * Generate a secure 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = (): string => {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

/**
 * Generate OTP with expiry time
 * @param {number} expiryMinutes - OTP expiry time in minutes (default: 5)
 * @returns {OTPData} OTP data with expiry
 */
export const generateOTPWithExpiry = (expiryMinutes: number = 5): OTPData => {
  const otp = generateOTP();
  const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return {
    otp,
    expiryTime: expiryTime.toISOString(),
    createdAt: new Date().toISOString()
  };
};

/**
 * Verify if OTP is valid and not expired
 * @param {string} inputOTP - OTP entered by user
 * @param {string} storedOTP - OTP stored in database
 * @param {string} expiryTime - OTP expiry time (ISO string)
 * @param {boolean} isUsed - Whether OTP has been used
 * @returns {OTPVerificationResult} Validation result
 */
export const verifyOTP = (
  inputOTP: string,
  storedOTP: string,
  expiryTime: string,
  isUsed: boolean = false
): OTPVerificationResult => {
  // Check if OTP has already been used
  if (isUsed) {
    return {
      isValid: false,
      error: 'OTP has already been used'
    };
  }

  // Check if OTP matches
  if (inputOTP !== storedOTP) {
    return {
      isValid: false,
      error: 'Invalid OTP'
    };
  }

  // Check if OTP has expired
  const now = new Date();
  const expiry = new Date(expiryTime);
  
  if (now > expiry) {
    return {
      isValid: false,
      error: 'OTP has expired'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

/**
 * Generate a secure random token for password reset
 * @returns {string} Random token
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Check if OTP is expired
 * @param {string} expiryTime - OTP expiry time (ISO string)
 * @returns {boolean} True if expired
 */
export const isOTPExpired = (expiryTime: string): boolean => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  return now > expiry;
};

/**
 * Get remaining time for OTP expiry
 * @param {string} expiryTime - OTP expiry time (ISO string)
 * @returns {OTPRemainingTime} Remaining time in minutes and seconds
 */
export const getOTPRemainingTime = (expiryTime: string): OTPRemainingTime => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { minutes, seconds, expired: false };
};
