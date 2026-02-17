import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { ConversationSummary, ChatMessage } from '../../../../shared/api/chatApi';
import { useConversations, useMarkRead, useMessages, useSendMessage, useUploadFile } from '../../../../shared/api/chatQueries';
import { createChatSocket } from '../../../../shared/api/chatSocket';

type UseTherapistChatControllerInput = {
  actorId: string;
};

export const useTherapistChatController = ({ actorId }: UseTherapistChatControllerInput) => {
  const qc = useQueryClient();

  const [active, setActive] = useState<ConversationSummary | null>(null);
  const activeAppointmentIdRef = useRef<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [mobileMode, setMobileMode] = useState<'list' | 'chat'>('list');

  const convosQuery = useConversations('therapist', actorId);
  const threads = convosQuery.data ?? [];

  const activeConversationId = active?.conversationId ?? null;
  const messagesQuery = useMessages('therapist', actorId, activeConversationId);
  const messages = messagesQuery.data ?? [];

  const sendMutation = useSendMessage();
  const uploadMutation = useUploadFile();
  const markReadMutation = useMarkRead();

  // socket
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);

  useEffect(() => {
    if (!socketRef.current) return;
    if (!activeConversationId) return;
    socketRef.current.joinConversation(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    socketRef.current = createChatSocket({ role: 'therapist', actorId });

    socketRef.current.socket.on('message:new', ({ message }: { message: ChatMessage }) => {
      const activeId = activeAppointmentIdRef.current;
      if (activeId && message.conversationId === activeId) {
        void messagesQuery.refetch();
      }
      void convosQuery.refetch();
    });

    socketRef.current.socket.on('read:updated', () => {
      void convosQuery.refetch();
    });

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read (therapist) whenever we open a thread / messages load.
  useEffect(() => {
    if (!activeConversationId) return;
    if (!messages || messages.length === 0) return;

    const lastId = messages[messages.length - 1]?.id;
    if (!lastId) return;

    const hasUnread = messages.some((msg) => msg.senderRole === 'patient' && !msg.seenAt);
    if (!hasUnread) return;
    if (markReadMutation.isPending) return;

    void markReadMutation.mutateAsync({
      role: 'therapist',
      actorId,
      conversationId: activeConversationId,
      lastReadMessageId: lastId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, messages.length]);

  const openThread = (convo: ConversationSummary) => {
    activeAppointmentIdRef.current = convo.conversationId;
    setActive(convo.unreadCount && convo.unreadCount > 0 ? { ...convo, unreadCount: 0 } : convo);
    setMobileMode('chat');
  };

  const backToListMobile = () => setMobileMode('list');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !messageText.trim() || sendMutation.isPending) return;

    await sendMutation.mutateAsync({
      role: 'therapist',
      actorId,
      conversationId: active.conversationId,
      body: messageText.trim(),
    });

    setMessageText('');
    await qc.invalidateQueries();
  };

  const onPickFile = async (file: File) => {
    if (!active || uploadMutation.isPending) return;
    await uploadMutation.mutateAsync({ role: 'therapist', actorId, conversationId: active.conversationId, file });
    await qc.invalidateQueries();
  };

  const isLoading = convosQuery.isLoading || (Boolean(activeConversationId) && messagesQuery.isLoading);
  const error = (convosQuery.error || messagesQuery.error) as Error | null;

  return useMemo(
    () => ({
      threads,
      active,
      activeConversationId,
      messages,
      isLoading,
      error,
      messageText,
      setMessageText,
      send,
      onPickFile,
      openThread,
      mobileMode,
      setMobileMode,
      backToListMobile,
      messagesEndRef,
      sendDisabled: sendMutation.isPending || uploadMutation.isPending,
      isSending: sendMutation.isPending || uploadMutation.isPending,
    }),
    [
      threads,
      active,
      activeConversationId,
      messages,
      isLoading,
      error,
      messageText,
      mobileMode,
      sendMutation.isPending,
      uploadMutation.isPending,
    ]
  );
};
