import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { ConversationSummary, ChatMessage } from '../../../../shared/api/chatApi';
import { useConversations, useMarkRead, useMessages, useSendMessage, useUploadFile } from '../../../../shared/api/chatQueries';
import { createChatSocket } from '../../../../shared/api/chatSocket';
import { getUserName } from '../../../../shared/data/users';

type UseUserChatControllerInput = {
  actorId: string;
};

export const useUserChatController = ({ actorId }: UseUserChatControllerInput) => {
  const qc = useQueryClient();

  const [active, setActive] = useState<ConversationSummary | null>(null);
  const activeAppointmentIdRef = useRef<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const convosQuery = useConversations('patient', actorId);
  const threads = convosQuery.data ?? [];

  // ensure we always have an active thread when threads load
  useEffect(() => {
    if (!active && threads.length > 0) {
      activeAppointmentIdRef.current = threads[0].conversationId;
      setActive(threads[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  const activeConversationId = active?.conversationId ?? null;
  const messagesQuery = useMessages('patient', actorId, activeConversationId);
  const messages = messagesQuery.data ?? [];

  const sendMutation = useSendMessage();
  const uploadMutation = useUploadFile();
  const markReadMutation = useMarkRead();

  // socket
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);

  // join socket room when active thread changes
  useEffect(() => {
    if (!socketRef.current) return;
    if (!activeConversationId) return;
    socketRef.current.joinConversation(activeConversationId);
  }, [activeConversationId]);

  // init socket once
  useEffect(() => {
    socketRef.current = createChatSocket({ role: 'patient', actorId });

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

  // Mark as read (patient) whenever we open a thread / messages load.
  useEffect(() => {
    if (!activeConversationId) return;
    if (!messages || messages.length === 0) return;

    const lastId = messages[messages.length - 1]?.id;
    if (!lastId) return;

    const hasUnread = messages.some((msg) => msg.senderRole === 'therapist' && !msg.seenAt);
    if (!hasUnread) return;
    if (markReadMutation.isPending) return;

    void markReadMutation.mutateAsync({
      role: 'patient',
      actorId,
      conversationId: activeConversationId,
      lastReadMessageId: lastId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, messages.length]);

  const openThread = (convo: ConversationSummary) => {
    activeAppointmentIdRef.current = convo.conversationId;
    setActive(convo);
  };

  const therapistName = getUserName(active?.therapistId, 'Your Therapist');

  const isLoading = convosQuery.isLoading || (Boolean(activeConversationId) && messagesQuery.isLoading);
  const error = (convosQuery.error || messagesQuery.error) as Error | null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !messageText.trim() || sendMutation.isPending) return;

    await sendMutation.mutateAsync({
      role: 'patient',
      actorId,
      conversationId: active.conversationId,
      body: messageText.trim(),
    });

    setMessageText('');
    await qc.invalidateQueries();
  };

  const onPickFile = async (file: File) => {
    if (!active || uploadMutation.isPending) return;
    await uploadMutation.mutateAsync({ role: 'patient', actorId, conversationId: active.conversationId, file });
    await qc.invalidateQueries();
  };

  return useMemo(
    () => ({
      threads,
      active,
      activeConversationId,
      setActive,
      messages,
      isLoading,
      error,
      messageText,
      setMessageText,
      send,
      onPickFile,
      openThread,
      therapistName,
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
      sendMutation.isPending,
      uploadMutation.isPending,
    ]
  );
};
