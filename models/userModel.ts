import { getPrismaClient } from '../config/database.js';
import { Prisma } from '@prisma/client';
import {
  User,
  CreateUserData,
  UpdateUserData,
  OAuthUserData,
  OTPData,
} from '../types/index.js';

const prisma = getPrismaClient();

class UserModel {
  // Initialize Prisma client
  static async initialize(): Promise<void> {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  // Disconnect Prisma client
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to find user by email: ${errorMsg}`);
    }
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to find user by ID: ${errorMsg}`);
    }
  }

  // Create new user
  static async create(userData: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: userData.password,
          isEmailVerified: false,
        },
      });

      return newUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create user: ${errorMsg}`);
    }
  }

  // Update user
  static async updateById(
    id: string,
    updateData: UpdateUserData
  ): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      return updatedUser;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new Error('User not found');
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update user: ${errorMsg}`);
    }
  }

  // Delete user
  static async deleteById(id: string): Promise<User> {
    try {
      const deletedUser = await prisma.user.delete({
        where: { id },
      });
      return deletedUser;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new Error('User not found');
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete user: ${errorMsg}`);
    }
  }

  // Get all users (for admin purposes)
  static async findAll(): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch users: ${errorMsg}`);
    }
  }

  // Get user count
  static async count(): Promise<number> {
    try {
      return await prisma.user.count();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to count users: ${errorMsg}`);
    }
  }

  // Store OTP for user (signup verification)
  static async storeSignupOTP(email: string, otpData: OTPData): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          signupOTP: {
            otp: otpData.otp,
            expiryTime: otpData.expiryTime,
            createdAt: otpData.createdAt,
            isUsed: false,
          },
        },
      });
      return updatedUser;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new Error('User not found');
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to store signup OTP: ${errorMsg}`);
    }
  }

  // Store OTP for password reset
  static async storePasswordResetOTP(
    email: string,
    otpData: OTPData
  ): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          passwordResetOTP: {
            otp: otpData.otp,
            expiryTime: otpData.expiryTime,
            createdAt: otpData.createdAt,
            isUsed: false,
          },
        },
      });
      return updatedUser;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new Error('User not found');
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to store password reset OTP: ${errorMsg}`);
    }
  }

  // Verify and mark signup OTP as used
  static async verifySignupOTP(email: string, _otp: string): Promise<User> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.signupOTP) {
        throw new Error('No OTP found for this user');
      }

      // Mark OTP as used and verify email
      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          signupOTP: {
            ...(user.signupOTP as {
              otp: string;
              expiryTime: string;
              createdAt: string;
              isUsed: boolean;
            }),
            isUsed: true,
          },
          isEmailVerified: true,
        },
      });

      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to verify signup OTP: ${errorMsg}`);
    }
  }

  // Verify and mark password reset OTP as used
  static async verifyPasswordResetOTP(
    email: string,
    _otp: string
  ): Promise<User> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.passwordResetOTP) {
        throw new Error('No password reset OTP found for this user');
      }

      // Mark OTP as used
      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          passwordResetOTP: {
            ...(user.passwordResetOTP as {
              otp: string;
              expiryTime: string;
              createdAt: string;
              isUsed: boolean;
            }),
            isUsed: true,
          },
        },
      });

      return updatedUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to verify password reset OTP: ${errorMsg}`);
    }
  }

  // Clear OTP data after successful verification
  static async clearOTPData(
    email: string,
    otpType: 'signup' | 'passwordReset' | 'both' = 'both'
  ): Promise<User> {
    try {
      const updateData: {
        signupOTP?: typeof Prisma.DbNull;
        passwordResetOTP?: typeof Prisma.DbNull;
      } = {};

      if (otpType === 'signup' || otpType === 'both') {
        updateData.signupOTP = Prisma.DbNull;
      }

      if (otpType === 'passwordReset' || otpType === 'both') {
        updateData.passwordResetOTP = Prisma.DbNull;
      }

      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: updateData,
      });

      return updatedUser;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new Error('User not found');
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear OTP data: ${errorMsg}`);
    }
  }

  // Find user by email with OTP data
  static async findByEmailWithOTP(email: string): Promise<User | null> {
    return await this.findByEmail(email);
  }

  // Find user by OAuth provider and provider ID
  static async findByProviderId(
    provider: string,
    providerId: string
  ): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: {
          provider_providerId: {
            provider,
            providerId,
          },
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to find user by provider ID: ${errorMsg}`);
    }
  }

  // Create OAuth user (Google, Facebook, etc.)
  static async createOAuthUser(userData: OAuthUserData): Promise<User> {
    try {
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: null, // OAuth users don't have passwords
          provider: userData.provider,
          providerId: userData.providerId,
          avatar: userData.avatar || null,
          isEmailVerified: userData.isEmailVerified || true, // OAuth emails are verified
          isSocialLogin: true, // Mark as social login
        },
      });

      return newUser;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create OAuth user: ${errorMsg}`);
    }
  }

  // Link OAuth account to existing user
  static async linkOAuthAccount(
    userId: string,
    oauthData: Partial<OAuthUserData>
  ): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          provider: oauthData.provider,
          providerId: oauthData.providerId,
          avatar: oauthData.avatar || null,
          isEmailVerified: true,
          isSocialLogin: true, // Mark as social login when linking
        },
      });

      return updatedUser;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new Error('User not found');
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to link OAuth account: ${errorMsg}`);
    }
  }

  // Find or create OAuth user
  static async findOrCreateOAuthUser(oauthData: OAuthUserData): Promise<User> {
    try {
      // First, try to find by provider and providerId
      let user = await this.findByProviderId(
        oauthData.provider,
        oauthData.providerId
      );

      if (user) {
        return user;
      }

      // If not found, check if user exists with this email
      user = await this.findByEmail(oauthData.email);

      if (user) {
        // Link OAuth account to existing user
        return await this.linkOAuthAccount(user.id, oauthData);
      }

      // Create new OAuth user
      return await this.createOAuthUser(oauthData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to find or create OAuth user: ${errorMsg}`);
    }
  }
}

export default UserModel;
