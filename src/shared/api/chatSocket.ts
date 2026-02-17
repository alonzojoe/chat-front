import { io, type Socket } from 'socket.io-client';
import type { ActorRole } from './chatApi';

const API_BASE = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000';

export function createChatSocket(input: { role: ActorRole; actorId: string }) {
  // Allow polling fallback in case websocket is blocked by proxy/dev setup.
  const socket: Socket = io(API_BASE, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('[chat-socket] connected', socket.id);
    socket.emit('join:actor', { role: input.role, actorId: input.actorId });
  });
  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[chat-socket] connect_error', err.message);
  });

  return {
    socket,
    joinAppointment(appointmentId: string) {
      socket.emit('join', { appointmentId, role: input.role, actorId: input.actorId });
    },
    close() {
      socket.disconnect();
    },
  };
}
