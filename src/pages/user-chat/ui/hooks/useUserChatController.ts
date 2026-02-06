import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { AppointmentSummary, ChatMessage } from '../../../../shared/api/chatApi';
import { useAppointments, useMessages, useSendMessage, useUploadFile } from '../../../../shared/api/chatQueries';
import { createChatSocket } from '../../../../shared/api/chatSocket';

type UseUserChatControllerInput = {
  actorId: string;
};

export const useUserChatController = ({ actorId }: UseUserChatControllerInput) => {
  const qc = useQueryClient();

  const [active, setActive] = useState<AppointmentSummary | null>(null);
  const activeAppointmentIdRef = useRef<number | null>(null);
  const [messageText, setMessageText] = useState('');

  const apptsQuery = useAppointments('patient', actorId);
  const threads = apptsQuery.data ?? [];

  // ensure we always have an active thread when threads load
  useEffect(() => {
    if (!active && threads.length > 0) {
      activeAppointmentIdRef.current = threads[0].appointmentId;
      setActive(threads[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  const activeAppointmentId = active?.appointmentId ?? null;
  const messagesQuery = useMessages('patient', actorId, activeAppointmentId);
  const messages = messagesQuery.data ?? [];

  const sendMutation = useSendMessage();
  const uploadMutation = useUploadFile();

  // socket
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);

  // join socket room when active thread changes
  useEffect(() => {
    if (!socketRef.current) return;
    if (!activeAppointmentId) return;
    socketRef.current.joinAppointment(activeAppointmentId);
  }, [activeAppointmentId]);

  // init socket once
  useEffect(() => {
    socketRef.current = createChatSocket({ role: 'patient', actorId });

    socketRef.current.socket.on('message:new', ({ message }: { message: ChatMessage }) => {
      const activeId = activeAppointmentIdRef.current;
      if (activeId && message.appointmentId === activeId) {
        void messagesQuery.refetch();
      }
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

  const openThread = (appt: AppointmentSummary) => {
    activeAppointmentIdRef.current = appt.appointmentId;
    setActive(appt);
  };

  const therapistName = active?.therapistName || 'Your Therapist';

  const isLoading = apptsQuery.isLoading || (Boolean(activeAppointmentId) && messagesQuery.isLoading);
  const error = (apptsQuery.error || messagesQuery.error) as Error | null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !messageText.trim() || sendMutation.isPending) return;

    await sendMutation.mutateAsync({
      role: 'patient',
      actorId,
      appointmentId: active.appointmentId,
      body: messageText.trim(),
    });

    setMessageText('');
    await qc.invalidateQueries();
  };

  const onPickFile = async (file: File) => {
    if (!active || uploadMutation.isPending) return;
    await uploadMutation.mutateAsync({ role: 'patient', actorId, appointmentId: active.appointmentId, file });
    await qc.invalidateQueries();
  };

  return useMemo(
    () => ({
      threads,
      active,
      activeAppointmentId,
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
      sendDisabled: sendMutation.isPending,
    }),
    [
      threads,
      active,
      activeAppointmentId,
      messages,
      isLoading,
      error,
      messageText,
      sendMutation.isPending,
    ]
  );
};
