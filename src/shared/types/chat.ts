// types/chat.types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'therapist';
  avatar?: string;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'read';
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
}

export interface Channel {
  id: string;
  name: string;
  members: string[];
  lastMessage?: Message;
  unreadCount: number;
  therapistId: string;
  userId: string;
  createdAt: Date;
}

export interface ChatState {
  currentUser: User | null;
  activeChannel: Channel | null;
  messages: Message[];
  channels: Channel[];
  isConnected: boolean;
  isTyping: boolean;
}
