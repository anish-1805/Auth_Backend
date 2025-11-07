import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketData } from '../types/socket.js';

interface JWTPayload {
  id: string;
  email: string;
}

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    // Get token from handshake auth or cookies (cookie name is 'jwt')
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.cookie?.split('jwt=')[1]?.split(';')[0];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Attach user data to socket
    (socket.data as SocketData) = {
      userId: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error(
      'Socket authentication failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    if (error instanceof jwt.JsonWebTokenError) {
      next(new Error('Authentication error: Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new Error('Authentication error: Token expired'));
    } else {
      next(new Error('Authentication error: Token verification failed'));
    }
  }
};
