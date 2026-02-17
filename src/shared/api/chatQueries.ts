import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listConversations,
  listMessages,
  sendTextMessage,
  uploadFile,
  markRead,
  type ActorRole,
} from './chatApi';

export const chatKeys = {
  conversations: (role: ActorRole, actorId: string) => ['conversations', role, actorId] as const,
  messages: (role: ActorRole, actorId: string, conversationId: string) =>
    ['messages', role, actorId, conversationId] as const,
};

export function useConversations(role: ActorRole, actorId: string) {
  return useQuery({
    queryKey: chatKeys.conversations(role, actorId),
    queryFn: () => listConversations({ role, actorId }),
  });
}

export function useMessages(role: ActorRole, actorId: string, conversationId: string | null) {
  return useQuery({
    queryKey: conversationId ? chatKeys.messages(role, actorId, conversationId) : ['messages', role, actorId, 'none'],
    queryFn: () => {
      if (!conversationId) return Promise.resolve([]);
      return listMessages({ role, actorId, conversationId });
    },
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendTextMessage,
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['messages', msg.senderRole, msg.senderId, msg.conversationId] });
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markRead,
    onSuccess: async () => {
      // unreadCount lives in appointments list
      await qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['messages', msg.senderRole, msg.senderId, msg.conversationId] });
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
