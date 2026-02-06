import { http, API_BASE_URL } from './http';

export type ActorRole = 'patient' | 'therapist';

export type AppointmentSummary = {
  appointmentId: number;
  mongoAppointmentId?: string | null;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  startsAt: string;
  status: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount?: number;
};

export type ChatMessage = {
  id: number;
  appointmentId: number;
  senderRole: ActorRole;
  senderId: string;
  body: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: string;
};

export async function listAppointments(input: { role: ActorRole; actorId: string }) {
  const { data } = await http.get<{ appointments: AppointmentSummary[] }>('/api/appointments', {
    params: input,
  });
  return data.appointments || [];
}

export async function listMessages(input: { role: ActorRole; actorId: string; appointmentId: number }) {
  const { data } = await http.get<{ messages: ChatMessage[] }>('/api/chat/messages', {
    params: input,
  });
  return data.messages || [];
}

export async function sendTextMessage(input: {
  role: ActorRole;
  actorId: string;
  appointmentId: number;
  body: string;
}) {
  const { data } = await http.post<{ message: ChatMessage }>('/api/chat/message', input);
  return data.message;
}

export async function uploadFile(input: {
  role: ActorRole;
  actorId: string;
  appointmentId: number;
  file: File;
}) {
  const fd = new FormData();
  fd.set('role', input.role);
  fd.set('actorId', String(input.actorId));
  fd.set('appointmentId', String(input.appointmentId));
  fd.set('file', input.file);

  const { data } = await http.post<{ message: ChatMessage }>('/api/chat/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.message;
}

export function publicAssetUrl(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl}`;
}
