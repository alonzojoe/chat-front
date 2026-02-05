export type ActorRole = 'patient' | 'therapist';

export type AppointmentSummary = {
  appointmentId: number;
  patientId: number;
  patientName: string;
  therapistId: number;
  therapistName: string;
  startsAt: string;
  status: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  id: number;
  appointmentId: number;
  senderRole: ActorRole;
  senderId: number;
  body: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000';

function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return;
    p.set(k, String(v));
  });
  return p.toString();
}

export async function listAppointments(input: { role: ActorRole; actorId: number }) {
  const url = `${API_BASE}/api/appointments?${qs(input)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load appointments (${r.status})`);
  const data = await r.json();
  return (data.appointments || []) as AppointmentSummary[];
}

export async function listMessages(input: { role: ActorRole; actorId: number; appointmentId: number }) {
  const url = `${API_BASE}/api/chat/messages?${qs(input)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load messages (${r.status})`);
  const data = await r.json();
  return (data.messages || []) as ChatMessage[];
}

export async function sendTextMessage(input: {
  role: ActorRole;
  actorId: number;
  appointmentId: number;
  body: string;
}) {
  const url = `${API_BASE}/api/chat/message`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`Failed to send message (${r.status})`);
  const data = await r.json();
  return data.message as ChatMessage;
}

export async function uploadFile(input: {
  role: ActorRole;
  actorId: number;
  appointmentId: number;
  file: File;
}) {
  const url = `${API_BASE}/api/chat/upload`;
  const fd = new FormData();
  fd.set('role', input.role);
  fd.set('actorId', String(input.actorId));
  fd.set('appointmentId', String(input.appointmentId));
  fd.set('file', input.file);

  const r = await fetch(url, { method: 'POST', body: fd });
  if (!r.ok) throw new Error(`Failed to upload (${r.status})`);
  const data = await r.json();
  return data.message as ChatMessage;
}

export function publicAssetUrl(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE}${pathOrUrl}`;
}
