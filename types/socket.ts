export interface ServerToClientEvents {
  'chat:message': (data: ChatMessageResponse) => void;
  'chat:typing': (data: { isTyping: boolean }) => void;
  'chat:error': (data: { error: string }) => void;
  'connection:success': (data: { message: string; userId: string }) => void;
}

export interface ClientToServerEvents {
  'chat:send': (data: ChatMessageRequest) => void;
  'chat:typing': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  email: string;
}

export interface ChatMessageRequest {
  message: string;
  timestamp: string;
}

export interface ChatMessageResponse {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface AuthenticatedSocket {
  userId: string;
  email: string;
}
