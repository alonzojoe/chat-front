import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, FileText, Info, Paperclip, Plus, Search, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ModalImage from "react-modal-image";

import type { User } from '../../../shared/types/chat';
import { publicAssetUrl, type AppointmentSummary, type ChatMessage } from '../../../shared/api/chatApi';
import { useAppointments, useMessages, useSendMessage, useUploadFile } from '../../../shared/api/chatQueries';
import { createChatSocket } from '../../../shared/api/chatSocket';
import { Card, Container, IconButton, cx } from '../../../shared/ui/Ui';

interface TherapistChatProps {
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
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-white'
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

const ChatListItem: React.FC<{
  info: AppointmentSummary;
  active: boolean;
  onClick: () => void;
}> = ({ info, active, onClick }) => {
  const last = info.lastMessage || 'No messages yet';

  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full text-left rounded-xl border px-3.5 py-3 transition',
        'border-border bg-white',
        'hover:bg-surface-2',
        active && 'bg-surface-2'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        <Avatar name={info.patientName} size={44} ring={active} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{info.patientName}</p>
              <p className="mt-0.5 text-sm truncate text-slate-600">{last}</p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1">
              <p className="text-[11px] text-slate-500">
                {info.lastMessageAt ? formatClock(info.lastMessageAt) : ' '}
              </p>
              <span className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export const TherapistChatPage: React.FC<TherapistChatProps> = ({ actorId }) => {
  const qc = useQueryClient();

  const [active, setActive] = useState<AppointmentSummary | null>(null);
  const activeAppointmentIdRef = useRef<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [mobileMode, setMobileMode] = useState<'list' | 'chat'>('list');

  const apptsQuery = useAppointments('therapist', actorId);
  const threads = apptsQuery.data ?? [];

  useEffect(() => {
    if (!active && threads.length > 0) {
      activeAppointmentIdRef.current = threads[0].appointmentId;
      setActive(threads[0]);
      setMobileMode('chat');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  const activeAppointmentId = active?.appointmentId ?? null;
  const messagesQuery = useMessages('therapist', actorId, activeAppointmentId);
  const messages = messagesQuery.data ?? [];

  const sendMutation = useSendMessage();
  const uploadMutation = useUploadFile();

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

  const filteredThreads = useMemo(() => threads, [threads]);

  const openThread = (appt: AppointmentSummary) => {
    activeAppointmentIdRef.current = appt.appointmentId;
    setActive(appt);
    setMobileMode('chat');
  };

  const isLoading = apptsQuery.isLoading || (Boolean(activeAppointmentId) && messagesQuery.isLoading);
  const error = (apptsQuery.error || messagesQuery.error) as Error | null;

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

  if (isLoading) {
    return (
      <div className="h-full grid place-items-center px-6">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="mt-3 text-sm text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full grid place-items-center px-6">
        <Card className="p-6 max-w-md w-full">
          <p className="text-sm font-semibold text-slate-900">Therapist chat failed to load</p>
          <p className="mt-2 text-sm text-slate-600 break-words">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Container className="h-full py-4 sm:py-6">
        <Card className="h-[calc(100vh-88px)] min-h-[640px] overflow-hidden">
          <div className="h-full min-h-0 grid sm:grid-cols-[360px_1fr]">
            {/* LIST */}
            <aside
              className={cx(
                'h-full min-h-0 border-r border-border bg-white',
                mobileMode === 'chat' ? 'hidden sm:block' : 'block'
              )}
            >
              <div className="h-full min-h-0 flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">Inbox</p>
                      <p className="text-xs text-slate-500 truncate">All patient conversations</p>
                    </div>
                    <IconButton aria-label="New conversation" title="Prototype">
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                      placeholder="Search (prototype)"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                  {filteredThreads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-surface-2 p-5">
                      <p className="text-sm font-semibold text-slate-900">No conversations yet</p>
                      <p className="mt-1 text-sm text-slate-600">
                        When a patient sends a message, it will appear here.
                      </p>
                    </div>
                  ) : (
                    filteredThreads.map((t) => (
                      <ChatListItem
                        key={t.appointmentId}
                        info={t}
                        active={active?.appointmentId === t.appointmentId}
                        onClick={() => openThread(t)}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* CHAT */}
            <section
              className={cx(
                'h-full min-h-0 flex flex-col bg-bg',
                mobileMode === 'list' ? 'hidden sm:flex' : 'flex'
              )}
            >
              {active ? (
                <>
                  <div className="p-4 bg-white border-b border-border">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          className="sm:hidden grid h-10 w-10 place-items-center rounded-xl border border-border bg-white"
                          onClick={() => setMobileMode('list')}
                          aria-label="Back"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <Avatar name={active.patientName} size={42} ring />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{active.patientName}</p>
                          <p className="text-xs text-slate-500 truncate">Appt #{active.appointmentId}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconButton aria-label="Info">
                          <Info className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.senderRole === 'therapist' && msg.senderId === actorId;
                        return (
                          <div
                            key={msg.id}
                            className={cx('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
                          >
                            {!isOwn ? <Avatar name={active.patientName} size={28} /> : null}

                            <div className={cx('max-w-[78%]', isOwn ? 'text-right' : 'text-left')}>
                              <div
                                className={cx(
                                  'inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                  isOwn
                                    ? 'bg-primary text-white'
                                    : 'bg-light-gray border border-border text-slate-900'
                                )}
                              >
                                {msg.body ? msg.body : null}
                                {msg.fileUrl ? (
                                  <div className={cx('mt-2', isOwn ? 'text-white/90' : 'text-slate-700')}>
                                    {msg.fileType?.startsWith('image/') ? (
                                      <ModalImage
                                        small={publicAssetUrl(msg.fileUrl)}
                                        large={publicAssetUrl(msg.fileUrl)}
                                        className="mt-2 max-w-60 rounded-xl object-cover max-h-60"
                                        hideDownload={false}
                                        hideZoom={true}
                                      />
                                    ) : (
                                      <a
                                        className={cx(
                                          'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                                          isOwn
                                            ? 'border-white/25 bg-white/10 text-white hover:bg-white/15'
                                            : 'border-border bg-light-gray text-dark hover:bg-surface-2'
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
                              <div className="mt-1 text-[11px] text-slate-500">{formatClock(msg.createdAt)}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  <div className="p-4 bg-white border-t border-border">
                    <form onSubmit={send} className="flex items-end gap-3">
                      <label
                        className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-white hover:bg-surface-2 cursor-pointer"
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

                      <div className="flex-1 rounded-2xl border border-border bg-surface-2 px-4 py-3">
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
                          'bg-primary text-white shadow-sm',
                          'hover:bg-primary-dark active:translate-y-[0.5px]',
                          'disabled:opacity-50'
                        )}
                        aria-label="Send"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full grid place-items-center text-sm text-slate-600">Select a conversation</div>
              )}
            </section>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default TherapistChatPage;
