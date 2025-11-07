import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import { EmailConfig } from '../types/index.js';

dotenv.config();

// Email configuration
const EMAIL_CONFIG: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// Create transporter
let transporter: Transporter | null = null;

try {
  transporter = nodemailer.createTransport(EMAIL_CONFIG);
  console.log('✅ Email transporter created successfully');
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error('❌ Failed to create email transporter:', errorMsg);
}

/**
 * Send OTP email for signup verification
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<boolean>} Success status
 */
export const sendSignupOTP = async (
  email: string,
  name: string,
  otp: string
): Promise<boolean> => {
  try {
    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
              <p>Welcome to our platform!</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <p>Your verification code is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This OTP will expire in <strong>5 minutes</strong></li>
                  <li>Do not share this code with anyone</li>
                  <li>This code can only be used once</li>
                </ul>
              </div>
              
              <p>If you didn't request this verification, please ignore this email.</p>
              
              <div class="footer">
                <p>This is an automated message, please do not reply.</p>
                <p>&copy; 2024 Auth System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Signup OTP sent successfully:', result.messageId);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to send signup OTP:', errorMsg);
    return false;
  }
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<boolean>} Success status
 */
export const sendPasswordResetOTP = async (
  email: string,
  name: string,
  otp: string
): Promise<boolean> => {
  try {
    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: #fff; border: 2px dashed #ff6b6b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .security-notice { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Password Reset</h1>
              <p>Secure your account</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>We received a request to reset your password. Use the OTP code below to proceed with password reset:</p>
              
              <div class="otp-box">
                <p>Your password reset code is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This OTP will expire in <strong>5 minutes</strong></li>
                  <li>Do not share this code with anyone</li>
                  <li>This code can only be used once</li>
                </ul>
              </div>
              
              <div class="security-notice">
                <strong>🛡️ Security Notice:</strong>
                <p>If you didn't request a password reset, please ignore this email and consider changing your password for security.</p>
              </div>
              
              <div class="footer">
                <p>This is an automated message, please do not reply.</p>
                <p>&copy; 2024 Auth System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP sent successfully:', result.messageId);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to send password reset OTP:', errorMsg);
    return false;
  }
};

/**
 * Send password reset success notification
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise<boolean>} Success status
 */
export const sendPasswordResetSuccess = async (
  email: string,
  name: string
): Promise<boolean> => {
  try {
    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Reset Successful</h1>
              <p>Your account is secure</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              
              <div class="success-box">
                <h3>🎉 Password Updated Successfully!</h3>
                <p>Your password has been reset successfully. You can now log in with your new password.</p>
              </div>
              
              <p>If you didn't make this change, please contact our support team immediately.</p>
              
              <div class="footer">
                <p>This is an automated message, please do not reply.</p>
                <p>&copy; 2024 Auth System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset success notification sent:', result.messageId);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(
      'Failed to send password reset success notification:',
      errorMsg
    );
    return false;
  }
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} Connection status
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    if (!transporter) {
      return false;
    }

    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Email service connection failed:', errorMsg);
    return false;
  }
};
