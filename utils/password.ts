import bcrypt from 'bcryptjs';
import { PasswordValidationResult } from '../types/index.js';

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 12;

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  try {
    if (!password) {
      throw new Error('Password is required');
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
};

// Compare password with hash
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    if (!password || !hashedPassword) {
      throw new Error('Password and hash are required');
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Failed to compare password');
  }
};

// Generate random password (for testing or password reset)
export const generateRandomPassword = (length: number = 12): string => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
  let password = '';

  // Ensure at least one character from each required type
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '@$!%*?&';

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

// Validate password strength
export const validatePasswordStrength = (
  password: string
): PasswordValidationResult => {
  const minLength = 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  const issues: string[] = [];

  if (password.length < minLength) {
    issues.push(`Password must be at least ${minLength} characters long`);
  }

  if (!hasLowercase) {
    issues.push('Password must contain at least one lowercase letter');
  }

  if (!hasUppercase) {
    issues.push('Password must contain at least one uppercase letter');
  }

  if (!hasNumbers) {
    issues.push('Password must contain at least one number');
  }

  if (!hasSpecialChar) {
    issues.push(
      'Password must contain at least one special character (@$!%*?&)'
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    strength: calculatePasswordStrength(password),
  };
};

// Calculate password strength score
const calculatePasswordStrength = (
  password: string
): 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong' => {
  let score = 0;

  // Length bonus
  score += Math.min(password.length * 2, 20);

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password)) score += 5;
  if (/[@$!%*?&]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 5; // Other special chars

  // Complexity bonus
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Return strength level
  if (score >= 70) return 'very-strong';
  if (score >= 50) return 'strong';
  if (score >= 30) return 'medium';
  if (score >= 15) return 'weak';
  return 'very-weak';
};
