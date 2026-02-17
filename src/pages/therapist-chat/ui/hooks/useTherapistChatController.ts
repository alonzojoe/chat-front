import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { AppointmentSummary, ChatMessage } from '../../../../shared/api/chatApi';
import { useAppointments, useMarkRead, useMessages, useSendMessage, useUploadFile } from '../../../../shared/api/chatQueries';
import { createChatSocket } from '../../../../shared/api/chatSocket';

type UseTherapistChatControllerInput = {
  actorId: string;
};

export const useTherapistChatController = ({ actorId }: UseTherapistChatControllerInput) => {
  const qc = useQueryClient();

  const [active, setActive] = useState<AppointmentSummary | null>(null);
  const activeAppointmentIdRef = useRef<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [mobileMode, setMobileMode] = useState<'list' | 'chat'>('list');

  const apptsQuery = useAppointments('therapist', actorId);
  const threads = apptsQuery.data ?? [];

  const activeAppointmentId = active?.appointmentId ?? null;
  const messagesQuery = useMessages('therapist', actorId, activeAppointmentId);
  const messages = messagesQuery.data ?? [];

  const sendMutation = useSendMessage();
  const uploadMutation = useUploadFile();
  const markReadMutation = useMarkRead();

  // socket
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);

  useEffect(() => {
    if (!socketRef.current) return;
    if (!activeAppointmentId) return;
    socketRef.current.joinAppointment(activeAppointmentId);
  }, [activeAppointmentId]);

  useEffect(() => {
    socketRef.current = createChatSocket({ role: 'therapist', actorId });

    socketRef.current.socket.on('message:new', ({ message }: { message: ChatMessage }) => {
      const activeId = activeAppointmentIdRef.current;
      if (activeId && message.appointmentId === activeId) {
        void messagesQuery.refetch();
      }
      void apptsQuery.refetch();
    });

    socketRef.current.socket.on('read:updated', () => {
      void apptsQuery.refetch();
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
    if (!activeAppointmentId) return;
    if (!messages || messages.length === 0) return;

    const lastId = messages[messages.length - 1]?.id;
    if (!lastId) return;

    const hasUnread = messages.some(
      (msg) => msg.senderRole === 'patient' && !msg.seenAt
    );
    if (!hasUnread) return;
    if (markReadMutation.isPending) return;

    void markReadMutation.mutateAsync({
      role: 'therapist',
      actorId,
      appointmentId: activeAppointmentId,
      lastReadMessageId: lastId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAppointmentId, messages.length]);

  const openThread = (appt: AppointmentSummary) => {
    activeAppointmentIdRef.current = appt.appointmentId;
    setActive(appt.unreadCount && appt.unreadCount > 0 ? { ...appt, unreadCount: 0 } : appt);
    setMobileMode('chat');
  };

  const backToListMobile = () => setMobileMode('list');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !messageText.trim() || sendMutation.isPending) return;

    await sendMutation.mutateAsync({
      role: 'therapist',
      actorId,
      appointmentId: active.appointmentId,
      body: messageText.trim(),
    });

    setMessageText('');
    await qc.invalidateQueries();
  };

  const onPickFile = async (file: File) => {
    if (!active || uploadMutation.isPending) return;
    await uploadMutation.mutateAsync({ role: 'therapist', actorId, appointmentId: active.appointmentId, file });
    await qc.invalidateQueries();
  };

  const isLoading = apptsQuery.isLoading || (Boolean(activeAppointmentId) && messagesQuery.isLoading);
  const error = (apptsQuery.error || messagesQuery.error) as Error | null;

  return useMemo(
    () => ({
      threads,
      active,
      activeAppointmentId,
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
      activeAppointmentId,
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
