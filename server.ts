import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import passport from './config/passport.js';
import { configureGoogleStrategy } from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import UserModel from './models/userModel.js';
import socketService from './services/socketService.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration
const corsOptions = {
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // For legacy browser support
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());
configureGoogleStrategy();

// Initialize Socket.IO
const corsOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
socketService.initialize(httpServer, corsOrigins);

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await UserModel.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await UserModel.disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await UserModel.initialize();

    // Start server
    httpServer.listen(PORT, () => {
      console.log('\n🚀 Auth Backend Server Started!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
      console.log(`💬 Socket.IO: Enabled`);
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      console.log('\n📋 Available endpoints:');
      console.log('   GET  /                     - Health check');
      console.log('   GET  /api/auth/health      - Auth service health');
      console.log('   POST /api/auth/signup      - User registration');
      console.log('   POST /api/auth/login       - User login');
      console.log('   POST /api/auth/logout      - User logout');
      console.log('   GET  /api/auth/me          - Get current user');
      console.log('   POST /api/auth/refresh     - Refresh JWT token');
      console.log('   PUT  /api/auth/change-password - Change password');
      console.log('   PUT  /api/auth/profile     - Update profile');
      console.log('   GET  /api/auth/google      - Google OAuth login');
      console.log('   GET  /api/auth/google/callback - Google OAuth callback');
      console.log('\n💬 Socket.IO Features:');
      console.log('   - Real-time chatbot with Gemini AI');
      console.log('   - Authenticated connections only');
      console.log('\n✅ Server is ready to accept connections!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
