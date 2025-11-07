import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  ChatMessageRequest,
  ChatMessageResponse,
} from '../types/socket.js';
import { socketAuthMiddleware } from '../middleware/socketAuth.js';
import geminiService from './geminiService.js';
import { v4 as uuidv4 } from 'uuid';

class SocketService {
  private io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null;

  initialize(httpServer: HTTPServer, corsOrigin: string[]): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });

    // Apply authentication middleware
    this.io.use(socketAuthMiddleware);

    // Handle connections
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ Socket.IO server initialized');
  }

  private handleConnection(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >
  ): void {
    const { userId } = socket.data;

    // Send connection success message
    socket.emit('connection:success', {
      message: 'Connected to chatbot successfully',
      userId,
    });

    // Handle chat messages
    socket.on('chat:send', async (data: ChatMessageRequest) => {
      await this.handleChatMessage(socket, data);
    });

    // Handle typing indicator
    socket.on('chat:typing', () => {
      // Echo typing indicator back (could be used for multi-user chat)
      socket.emit('chat:typing', { isTyping: true });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Connection closed
    });
  }

  private async handleChatMessage(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    data: ChatMessageRequest
  ): Promise<void> {
    try {
      const { message, timestamp } = data;
      const { email } = socket.data;

      // Echo user message back
      const userMessage: ChatMessageResponse = {
        id: uuidv4(),
        message,
        sender: 'user',
        timestamp,
      };
      socket.emit('chat:message', userMessage);

      // Show typing indicator
      socket.emit('chat:typing', { isTyping: true });

      // Get user name from email (simple extraction)
      const userName = email.split('@')[0];

      // Generate AI response
      const aiResponse = await geminiService.generateResponse(
        message,
        userName
      );

      // Stop typing indicator
      socket.emit('chat:typing', { isTyping: false });

      // Send bot response
      const botMessage: ChatMessageResponse = {
        id: uuidv4(),
        message: aiResponse,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      socket.emit('chat:message', botMessage);
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('chat:error', {
        error: 'Failed to process your message. Please try again.',
      });
    }
  }

  getIO(): Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null {
    return this.io;
  }
}

export default new SocketService();
