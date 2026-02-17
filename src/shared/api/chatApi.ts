import { http, API_BASE_URL } from './http';

export type ActorRole = 'patient' | 'therapist';

export type ConversationSummary = {
  conversationId: string;
  clientId: string;
  clientName: string;
  therapistId: string;
  therapistName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount?: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderRole: ActorRole;
  senderId: string;
  body: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: string;
  seenAt?: string | null;
};

export async function listConversations(input: { role: ActorRole; actorId: string }) {
  const { data } = await http.get<{ conversations: ConversationSummary[] }>('/api/conversations', {
    params: input,
  });
  return data.conversations || [];
}

export async function listMessages(input: { role: ActorRole; actorId: string; conversationId: string }) {
  const { data } = await http.get<{ messages: ChatMessage[] }>('/api/chat/messages', {
    params: input,
  });
  return data.messages || [];
}

export async function sendTextMessage(input: {
  role: ActorRole;
  actorId: string;
  conversationId: string;
  body: string;
}) {
  const { data } = await http.post<{ message: ChatMessage }>('/api/chat/message', input);
  return data.message;
}

export async function uploadFile(input: {
  role: ActorRole;
  actorId: string;
  conversationId: string;
  file: File;
}) {
  const fd = new FormData();
  fd.set('role', input.role);
  fd.set('actorId', String(input.actorId));
  fd.set('conversationId', String(input.conversationId));
  fd.set('file', input.file);

  const { data } = await http.post<{ message: ChatMessage }>('/api/chat/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.message;
}

export async function markRead(input: {
  role: ActorRole;
  actorId: string;
  conversationId: string;
  lastReadMessageId?: string;
}) {
  const { data } = await http.post<{ ok: boolean }>('/api/chat/read', input);
  return data;
}

export function publicAssetUrl(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl}`;
}
