import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAppointments,
  listMessages,
  sendTextMessage,
  uploadFile,
  type ActorRole,
} from './chatApi';

export const chatKeys = {
  appointments: (role: ActorRole, actorId: string) => ['appointments', role, actorId] as const,
  messages: (role: ActorRole, actorId: string, appointmentId: number) =>
    ['messages', role, actorId, appointmentId] as const,
};

export function useAppointments(role: ActorRole, actorId: string) {
  return useQuery({
    queryKey: chatKeys.appointments(role, actorId),
    queryFn: () => listAppointments({ role, actorId }),
  });
}

export function useMessages(role: ActorRole, actorId: string, appointmentId: number | null) {
  return useQuery({
    queryKey: appointmentId ? chatKeys.messages(role, actorId, appointmentId) : ['messages', role, actorId, 'none'],
    queryFn: () => {
      if (!appointmentId) return Promise.resolve([]);
      return listMessages({ role, actorId, appointmentId });
    },
    enabled: Boolean(appointmentId),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendTextMessage,
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['messages', msg.senderRole, msg.senderId, msg.appointmentId] });
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['messages', msg.senderRole, msg.senderId, msg.appointmentId] });
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
