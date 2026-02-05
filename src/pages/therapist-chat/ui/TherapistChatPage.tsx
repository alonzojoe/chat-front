import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, Plus, Send, Info, Paperclip, FileText } from 'lucide-react';

import type { User } from '../../../shared/types/chat';
import {
  listAppointments,
  listMessages,
  publicAssetUrl,
  sendTextMessage,
  uploadFile,
  type AppointmentSummary,
  type ChatMessage,
} from '../../../shared/api/chatApi';
import { createChatSocket } from '../../../shared/api/chatSocket';
import { Card, Container, IconButton, cx } from '../../../shared/ui/Ui';

interface TherapistChatProps {
  currentUser: User;
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
        'border-[color:var(--color-border)] bg-white',
        'hover:bg-[color:var(--color-surface-2)]',
        active && 'bg-[color:var(--color-surface-2)]'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar name={info.patientName} size={44} ring={active} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{info.patientName}</p>
              <p className="mt-0.5 text-sm truncate text-slate-600">{last}</p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1">
              <p className="text-[11px] text-slate-500">{info.lastMessageAt ? formatClock(info.lastMessageAt) : ' '}</p>
              <span className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export const TherapistChatPage: React.FC<TherapistChatProps> = ({ actorId }) => {
  const [threads, setThreads] = useState<AppointmentSummary[]>([]);
  const [active, setActive] = useState<AppointmentSummary | null>(null);
  const activeAppointmentIdRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [mobileMode, setMobileMode] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);

  const refreshThreads = async () => {
    const appts = await listAppointments({ role: 'therapist', actorId });
    setThreads(appts);
    return appts;
  };

  const openThread = async (appt: AppointmentSummary) => {
    activeAppointmentIdRef.current = appt.appointmentId;
    setActive(appt);
    const msgs = await listMessages({ role: 'therapist', actorId, appointmentId: appt.appointmentId });
    setMessages(msgs);
    socketRef.current?.joinAppointment(appt.appointmentId);
    setMobileMode('chat');
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setError(null);
        setIsLoading(true);

        socketRef.current = createChatSocket({ role: 'therapist', actorId });
        socketRef.current.socket.on('message:new', ({ message }: { message: ChatMessage }) => {
          const activeId = activeAppointmentIdRef.current;

          setMessages((prev) => {
            if (!activeId || message.appointmentId !== activeId) return prev;
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });

          refreshThreads().catch(() => { });
        });

        const appts = await refreshThreads();
        if (!mounted) return;

        if (appts.length > 0) {
          await openThread(appts[0]);
        }

        if (!mounted) return;
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredThreads = useMemo(() => threads, [threads]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendTextMessage({
        role: 'therapist',
        actorId,
        appointmentId: active.appointmentId,
        body: messageText.trim(),
      });
      setMessageText('');
    } finally {
      setIsSending(false);
    }
  };

  const onPickFile = async (file: File) => {
    if (!active) return;
    await uploadFile({ role: 'therapist', actorId, appointmentId: active.appointmentId, file });
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
          <p className="text-sm font-semibold text-slate-900">Therapist chat failed to connect</p>
          <p className="mt-2 text-sm text-slate-600 break-words">{error}</p>
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
                'h-full min-h-0 border-r border-[color:var(--color-border)] bg-white',
                mobileMode === 'chat' ? 'hidden sm:block' : 'block'
              )}
            >
              <div className="h-full min-h-0 flex flex-col">
                <div className="p-4 border-b border-[color:var(--color-border)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">Inbox</p>
                      <p className="text-xs text-slate-500 truncate">All patient conversations</p>
                    </div>
                    <IconButton aria-label="New conversation" title="Prototype">
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                      placeholder="Search"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredThreads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
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
                'h-full min-h-0 flex flex-col bg-[color:var(--color-bg)]',
                mobileMode === 'list' ? 'hidden sm:flex' : 'flex'
              )}
            >
              {active ? (
                <>
                  <div className="p-4 bg-white border-b border-[color:var(--color-border)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          className="sm:hidden grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--color-border)] bg-white"
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
                              <div className="mt-1 text-[11px] text-slate-500">{formatClock(msg.createdAt)}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

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
                          disabled={isSending}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!messageText.trim() || isSending}
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
