import { Response } from 'express';
import UserModel from '../models/userModel.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateToken,
  getCookieOptions,
  getClearCookieOptions,
} from '../utils/jwt.js';
import { generateOTPWithExpiry, verifyOTP } from '../utils/otp.js';
import {
  sendSignupOTP,
  sendPasswordResetOTP,
  sendPasswordResetSuccess,
} from '../services/emailService.js';
import { AuthRequest } from '../types/index.js';

// Signup controller - Step 1: Create user and send OTP
export const signup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      // Check if user signed up via social login (Google, etc.)
      if (existingUser.isSocialLogin && !existingUser.password) {
        // User exists from social login but has no password
        // Allow them to set a password and convert to hybrid account
        const hashedPassword = await hashPassword(password);

        await UserModel.updateById(existingUser.id, {
          password: hashedPassword,
          provider: 'local', // Change provider to local
          name: name.trim(), // Update name if provided
        });

        // Generate OTP for email verification
        const otpData = generateOTPWithExpiry(5);
        await UserModel.storeSignupOTP(email, otpData);

        // Send OTP email
        sendSignupOTP(email, name, otpData.otp)
          .then((emailSent) => {
            if (emailSent) {
              console.log(
                `✅ Signup OTP email sent to social login user: ${email}`
              );
            }
          })
          .catch((error) => {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            console.error(
              `❌ Error sending OTP to social login user ${email}:`,
              errorMsg
            );
          });

        res.status(200).json({
          success: true,
          message:
            'Password set successfully for your Google account. Please verify your email with the OTP sent.',
          data: {
            email: email,
            otpSent: true,
            expiresIn: '5 minutes',
            accountLinked: true,
          },
        });
        return;
      }

      // User exists with regular signup
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (unverified)
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    };

    await UserModel.create(userData);

    // Generate OTP
    const otpData = generateOTPWithExpiry(5); // 5 minutes expiry

    // Store OTP in user record
    await UserModel.storeSignupOTP(email, otpData);

    // Send OTP email asynchronously (non-blocking)
    sendSignupOTP(email, name, otpData.otp)
      .then((emailSent) => {
        if (emailSent) {
          console.log(`✅ Signup OTP email sent successfully to: ${email}`);
        } else {
          console.error(`❌ Failed to send signup OTP email to: ${email}`);
        }
      })
      .catch((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Error sending signup OTP email to ${email}:`,
          errorMsg
        );
      });

    // Respond immediately without waiting for email
    res.status(201).json({
      success: true,
      message:
        'Account created successfully. Please check your email for the verification code.',
      data: {
        email: email,
        otpSent: true,
        expiresIn: '5 minutes',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Login controller
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user signed up via social login and has no password
    if (user.isSocialLogin && !user.password) {
      res.status(400).json({
        success: false,
        message:
          'This account was created using Google login. Please sign in with Google or set a password by signing up again.',
        isSocialLogin: true,
        provider: user.provider,
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message:
          'Please verify your email before logging in. Check your inbox for the verification code.',
        requiresEmailVerification: true,
        email: user.email,
      });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password!);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Set JWT as httpOnly cookie
    const cookieOptions = getCookieOptions();
    res.cookie('jwt', token, cookieOptions);

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMsg = error instanceof Error ? error.message : undefined;
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
    });
  }
};

// Logout controller
export const logout = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Clear JWT cookie
    const clearOptions = getClearCookieOptions();
    res.clearCookie('jwt', clearOptions);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    const errorMsg = error instanceof Error ? error.message : undefined;
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
    });
  }
};

// Get current user controller
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // User info is already attached by auth middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    const errorMsg = error instanceof Error ? error.message : undefined;
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
    });
  }
};

// Change password controller
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Get user with password
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password!
    );
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Check if new password is different from current
    const isSamePassword = await comparePassword(newPassword, user.password!);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update user password
    await UserModel.updateById(userId, {
      password: hashedNewPassword,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    const errorMsg = error instanceof Error ? error.message : undefined;
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change',
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
    });
  }
};

// Update profile controller
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, email } = req.body;
    const userId = req.user!.id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user!.email) {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        res.status(409).json({
          success: false,
          message: 'Email is already taken by another user',
        });
        return;
      }
    }

    // Prepare update data
    const updateData: { name?: string; email?: string } = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();

    // Update user
    const updatedUser = await UserModel.updateById(userId, updateData);

    // Remove password from response
    const { password: _, ...userResponse } = updatedUser;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    const errorMsg = error instanceof Error ? error.message : undefined;
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update',
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
    });
  }
};

// Refresh token controller
export const refreshToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get current token from cookies
    const currentToken = req.cookies.jwt;

    if (!currentToken) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    // User is already verified by auth middleware
    const userId = req.user!.id;

    // Generate new token
    const newToken = generateToken({
      userId: userId,
      email: req.user!.email,
    });

    // Set new JWT as httpOnly cookie
    const cookieOptions = getCookieOptions();
    res.cookie('jwt', newToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    const errorMsg = error instanceof Error ? error.message : undefined;
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh',
      error: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
    });
  }
};

// Verify signup OTP controller
export const verifySignupOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
      return;
    }

    // Find user with OTP data
    const user = await UserModel.findByEmailWithOTP(email);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Check if OTP exists
    if (!user.signupOTP) {
      res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
      });
      return;
    }

    // Verify OTP
    const signupOTPData = user.signupOTP as {
      otp: string;
      expiryTime: string;
      isUsed: boolean;
    };
    const otpVerification = verifyOTP(
      otp,
      signupOTPData.otp,
      signupOTPData.expiryTime,
      signupOTPData.isUsed
    );

    if (!otpVerification.isValid) {
      res.status(400).json({
        success: false,
        message: otpVerification.error,
      });
      return;
    }

    // Mark OTP as used and verify email
    const updatedUser = await UserModel.verifySignupOTP(email, otp);

    // Generate JWT token for automatic login
    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    // Set JWT as httpOnly cookie
    const cookieOptions = getCookieOptions();
    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to your dashboard.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isEmailVerified: updatedUser.isEmailVerified,
      },
      data: {
        emailVerified: true,
        autoLogin: true,
      },
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Internal server error';
    console.error('Verify signup OTP error:', errorMsg);
    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Resend signup OTP controller
export const resendSignupOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if already verified
    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Generate new OTP
    const otpData = generateOTPWithExpiry(5);

    // Store new OTP
    await UserModel.storeSignupOTP(email, otpData);

    // Send OTP email asynchronously (non-blocking)
    sendSignupOTP(email, user.name, otpData.otp)
      .then((emailSent) => {
        if (emailSent) {
          console.log(
            `✅ Resend signup OTP email sent successfully to: ${email}`
          );
        } else {
          console.error(`❌ Failed to resend signup OTP email to: ${email}`);
        }
      })
      .catch((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Error resending signup OTP email to ${email}:`,
          errorMsg
        );
      });

    // Respond immediately without waiting for email
    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email.',
      data: {
        email: email,
        otpSent: true,
        expiresIn: '5 minutes',
      },
    });
  } catch (error) {
    console.error('Resend signup OTP error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Forgot password controller - Step 1: Send OTP
export const forgotPassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({
        success: true,
        message:
          'If an account with this email exists, you will receive a password reset code.',
        data: {
          email: email,
          otpSent: true,
        },
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Please verify your email first before resetting password.',
      });
      return;
    }

    // Generate OTP
    const otpData = generateOTPWithExpiry(5);

    // Store OTP
    await UserModel.storePasswordResetOTP(email, otpData);

    // Send OTP email asynchronously (non-blocking)
    sendPasswordResetOTP(email, user.name, otpData.otp)
      .then((emailSent) => {
        if (emailSent) {
          console.log(
            `✅ Password reset OTP email sent successfully to: ${email}`
          );
        } else {
          console.error(
            `❌ Failed to send password reset OTP email to: ${email}`
          );
        }
      })
      .catch((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Error sending password reset OTP email to ${email}:`,
          errorMsg
        );
      });

    // Respond immediately without waiting for email
    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email.',
      data: {
        email: email,
        otpSent: true,
        expiresIn: '5 minutes',
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Verify password reset OTP controller
export const verifyPasswordResetOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
      return;
    }

    // Find user with OTP data
    const user = await UserModel.findByEmailWithOTP(email);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if OTP exists
    if (!user.passwordResetOTP) {
      res.status(400).json({
        success: false,
        message: 'No password reset OTP found. Please request a new one.',
      });
      return;
    }

    // Verify OTP
    const passwordResetOTPData = user.passwordResetOTP as {
      otp: string;
      expiryTime: string;
      isUsed: boolean;
    };
    const otpVerification = verifyOTP(
      otp,
      passwordResetOTPData.otp,
      passwordResetOTPData.expiryTime,
      passwordResetOTPData.isUsed
    );

    if (!otpVerification.isValid) {
      res.status(400).json({
        success: false,
        message: otpVerification.error,
      });
      return;
    }

    // Mark OTP as used
    await UserModel.verifyPasswordResetOTP(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        otpVerified: true,
        email: email,
      },
    });
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Reset password controller - Step 2: Reset password after OTP verification
export const resetPassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
      return;
    }

    // Find user with OTP data
    const user = await UserModel.findByEmailWithOTP(email);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if OTP exists and is used (verified)
    const resetOTPData = user.passwordResetOTP as {
      otp: string;
      expiryTime: string;
      isUsed: boolean;
    } | null;
    if (!resetOTPData || !resetOTPData.isUsed) {
      res.status(400).json({
        success: false,
        message: 'Please verify OTP first before resetting password.',
      });
      return;
    }

    // Verify OTP one more time (should be used but not expired)
    const otpVerification = verifyOTP(
      otp,
      resetOTPData.otp,
      resetOTPData.expiryTime,
      false // Check as if not used for expiry validation
    );

    if (!otpVerification.isValid) {
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new password reset.',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await UserModel.updateById(user.id, {
      password: hashedPassword,
    });

    // Clear OTP data
    await UserModel.clearOTPData(email, 'passwordReset');

    // Send success notification asynchronously (non-blocking)
    sendPasswordResetSuccess(email, user.name)
      .then((emailSent) => {
        if (emailSent) {
          console.log(`✅ Password reset success email sent to: ${email}`);
        } else {
          console.error(
            `❌ Failed to send password reset success email to: ${email}`
          );
        }
      })
      .catch((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Error sending password reset success email to ${email}:`,
          errorMsg
        );
      });

    res.status(200).json({
      success: true,
      message:
        'Password reset successfully. You can now log in with your new password.',
      data: {
        passwordReset: true,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
};

// Get all users with pagination (admin/protected endpoint)
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await UserModel.count();

    // Get paginated users
    const users = await UserModel.findAll(skip, limit);

    // Remove sensitive data (password) from response
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      provider: user.provider,
      avatar: user.avatar,
      isSocialLogin: user.isSocialLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    res.status(200).json({
      success: true,
      users: sanitizedUsers,
      total,
      page,
      limit,
      totalPages,
      hasMore,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
};
