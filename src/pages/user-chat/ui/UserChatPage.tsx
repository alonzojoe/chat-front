import React, { useEffect, useRef, useState } from 'react';
import { FileText, Info, Paperclip, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import type { User } from '../../../shared/types/chat';
import { publicAssetUrl, type AppointmentSummary, type ChatMessage } from '../../../shared/api/chatApi';
import { useAppointments, useMessages, useSendMessage, useUploadFile } from '../../../shared/api/chatQueries';
import { createChatSocket } from '../../../shared/api/chatSocket';
import { Card, Container, IconButton, cx } from '../../../shared/ui/Ui';

interface UserChatProps {
  currentUser: User; // not used yet (kept for later auth integration)
  actorId: number; // numeric id used by backend prototype
}

const formatClock = (date: string | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const Avatar: React.FC<{ name: string; image?: string; size?: number; ring?: boolean }> = ({
  name,
  image,
  size = 40,
  ring = false,
}) => {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={cx(
        'shrink-0 rounded-full bg-slate-200 text-slate-700 grid place-items-center overflow-hidden',
        ring
          ? 'ring-2 ring-[color:var(--color-primary)] ring-offset-2 ring-offset-white'
          : 'ring-1 ring-slate-200'
      )}
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </div>
  );
};

export const UserChatPage: React.FC<UserChatProps> = ({ actorId }) => {
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
  }, [messages]);

  const openThread = (appt: AppointmentSummary) => {
    activeAppointmentIdRef.current = appt.appointmentId;
    setActive(appt);
  };

  const therapistName = active?.therapistName || 'Your Therapist';
  const headerTitle = therapistName;

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

    // Optimistic refetch (socket will also handle it)
    await qc.invalidateQueries();
  };

  const onPickFile = async (file: File) => {
    if (!active || uploadMutation.isPending) return;
    await uploadMutation.mutateAsync({ role: 'patient', actorId, appointmentId: active.appointmentId, file });
    await qc.invalidateQueries();
  };

  if (isLoading) {
    return (
      <div className="h-full grid place-items-center px-6">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--color-primary)] border-r-transparent" />
          <p className="mt-3 text-sm text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full grid place-items-center px-6">
        <Card className="p-6 max-w-md w-full">
          <p className="text-sm font-semibold text-slate-900">Chat failed to load</p>
          <p className="mt-2 text-sm text-slate-600 break-words">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Container className="h-full py-4 sm:py-6">
        <Card className="h-[calc(100vh-88px)] min-h-[640px] overflow-hidden">
          <div className="h-full flex flex-col bg-[color:var(--color-bg)]">
            {/* Header */}
            <div className="p-4 bg-white border-b border-[color:var(--color-border)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={headerTitle} size={42} ring />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{headerTitle}</p>
                    <p className="text-xs text-slate-500 truncate">Appointment chat</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <IconButton aria-label="Info">
                    <Info className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>

              {/* Thread picker (simple) */}
              {threads.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {threads.map((t) => (
                    <button
                      key={t.appointmentId}
                      className={cx(
                        'shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold',
                        t.appointmentId === active?.appointmentId
                          ? 'border-[color:var(--color-primary)] bg-[color:var(--color-surface-2)]'
                          : 'border-[color:var(--color-border)] bg-white'
                      )}
                      onClick={() => openThread(t)}
                    >
                      Appt #{t.appointmentId}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.senderRole === 'patient' && msg.senderId === actorId;

                  return (
                    <div
                      key={msg.id}
                      className={cx('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
                    >
                      {!isOwn ? <Avatar name={therapistName} size={28} /> : null}

                      <div className={cx('max-w-[78%]', isOwn ? 'text-right' : 'text-left')}>
                        <div
                          className={cx(
                            'inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            isOwn
                              ? 'bg-[color:var(--color-primary)] text-white'
                              : 'bg-white border border-[color:var(--color-border)] text-slate-900'
                          )}
                        >
                          {msg.body ? msg.body : null}
                          {msg.fileUrl ? (
                            <div className={cx('mt-2', isOwn ? 'text-white/90' : 'text-slate-700')}>
                              {msg.fileType?.startsWith('image/') ? (
                                <img
                                  className="mt-2 max-w-[240px] rounded-xl"
                                  src={publicAssetUrl(msg.fileUrl)}
                                  alt={msg.fileName || 'image'}
                                />
                              ) : (
                                <a
                                  className={cx(
                                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                                    isOwn
                                      ? 'border-white/25 bg-white/10 text-white hover:bg-white/15'
                                      : 'border-[color:var(--color-border)] bg-white text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-2)]'
                                  )}
                                  href={publicAssetUrl(msg.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="truncate max-w-[220px]">{msg.fileName || 'Download attachment'}</span>
                                </a>
                              )}
                            </div>
                          ) : null}
                        </div>
                        <div className={cx('mt-1 text-[11px] text-slate-500')}>{formatClock(msg.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Composer */}
            <div className="p-4 bg-white border-t border-[color:var(--color-border)]">
              <form onSubmit={send} className="flex items-end gap-3">
                <label
                  className="grid h-12 w-12 place-items-center rounded-xl border border-[color:var(--color-border)] bg-white hover:bg-[color:var(--color-surface-2)] cursor-pointer"
                  title="Attach file"
                >
                  <input
                    className="hidden"
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onPickFile(f);
                      e.currentTarget.value = '';
                    }}
                  />
                  <Paperclip className="w-5 h-5 text-slate-700" />
                </label>

                <div className="flex-1 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Message…"
                    className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                    disabled={sendMutation.isPending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageText.trim() || sendMutation.isPending}
                  className={cx(
                    'grid h-12 w-12 place-items-center rounded-xl',
                    'bg-[color:var(--color-primary)] text-white shadow-sm',
                    'hover:bg-[color:var(--color-primary-dark)] active:translate-y-[0.5px]',
                    'disabled:opacity-50'
                  )}
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default UserChatPage;
