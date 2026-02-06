import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, FileText, Info, Paperclip, Plus, Search, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ModalImage from "react-modal-image";

import type { User } from '../../../shared/types/chat';
import { publicAssetUrl, type AppointmentSummary, type ChatMessage } from '../../../shared/api/chatApi';
import { useAppointments, useMessages, useMarkRead, useSendMessage, useUploadFile } from '../../../shared/api/chatQueries';
import { createChatSocket } from '../../../shared/api/chatSocket';
import { Card, Container, IconButton, cx } from '../../../shared/ui/Ui';

interface TherapistChatProps {
  currentUser: User; // not used yet (kept for later auth integration)
  actorId: string; // MongoDB/external id
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
              <p className="mt-0.5 text-sm truncate text-slate-600 text-ellipsis">{last}</p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1">
              <p className="text-[11px] text-slate-500">
                {info.lastMessageAt ? formatClock(info.lastMessageAt) : ' '}
              </p>
              {info.unreadCount && info.unreadCount > 0 ? (
                <span className="min-w-6 h-6 px-2 rounded-full bg-primary text-white text-[11px] font-semibold grid place-items-center">
                  {info.unreadCount}
                </span>
              ) : (
                <span className="h-6" />
              )}
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

  // Do NOT auto-select a conversation on load (therapist starts with no active thread).
  useEffect(() => {
    // when threads load, keep list view on mobile
    if (threads.length > 0 && mobileMode !== 'list' && !active) {
      setMobileMode('list');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  const activeAppointmentId = active?.appointmentId ?? null;
  const messagesQuery = useMessages('therapist', actorId, activeAppointmentId);
  const messages = messagesQuery.data ?? [];

  // Mark as read (therapist) whenever we open a thread / messages load.
  // Simplest behavior: set lastRead to the newest message id we have.
  useEffect(() => {
    if (!activeAppointmentId) return;
    if (!messages || messages.length === 0) return;

    const lastId = messages[messages.length - 1]?.id;
    if (!lastId) return;

    // Only bother if there are unread messages in this thread.
    if (!active?.unreadCount || active.unreadCount <= 0) return;

    if (markReadMutation.isPending) return;

    void markReadMutation.mutateAsync({
      role: 'therapist',
      actorId,
      appointmentId: activeAppointmentId,
      lastReadMessageId: lastId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAppointmentId, messages.length, active?.unreadCount]);

  const sendMutation = useSendMessage();
  const markReadMutation = useMarkRead();
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

    // When therapist marks read, refresh appointments list so unread badges drop.
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
  }, [messages]);

  const filteredThreads = useMemo(() => threads, [threads]);

  const openThread = (appt: AppointmentSummary) => {
    activeAppointmentIdRef.current = appt.appointmentId;
    setActive(appt);
    setMobileMode('chat');

    // Optimistically clear the badge in UI; server will be updated once messages load.
    if (appt.unreadCount && appt.unreadCount > 0) {
      setActive({ ...appt, unreadCount: 0 });
    }
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
          <div className="h-full min-h-0 grid sm:grid-cols-[320px_1fr_360px]">

            {/* INBOX*/}
            <aside
              className={cx(
                'h-full min-h-0 border-l border-border bg-white',
                mobileMode === 'chat' ? 'hidden sm:block' : 'block'
              )}
            >
              <div className="h-full min-h-0 flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">Inbox</p>
                      <p className="text-xs text-slate-500 truncate">All messages</p>
                    </div>
                    <IconButton aria-label="New conversation" title="Prototype">
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                      placeholder="Search messages (prototype)"
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

            {/* PATIENT INFO (mock) */}
            {active && (
              <aside className="hidden sm:block h-full min-h-0 border-r border-border bg-white">
                <div className="h-full min-h-0 flex flex-col">
                  <div className="p-6 border-b border-border flex flex-col items-center">
                    <Avatar name={active?.patientName || 'Patient'} size={96} ring />
                    <p className="mt-3 text-base font-semibold text-slate-900">{active?.patientName || 'Select a chat'}</p>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-5">
                      <p className="text-sm font-semibold text-slate-900">Patient Info</p>
                      <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                        <p><span className="text-slate-500">Patient number:</span> 826684619</p>
                        <p><span className="text-slate-500">Mobile number:</span> +63 917 123 4567</p>
                        <p><span className="text-slate-500">Email:</span> patient@example.com</p>
                        <p><span className="text-slate-500">Date of birth:</span> July 18, 1982</p>
                        <p><span className="text-slate-500">Age:</span> 43</p>
                        <p><span className="text-slate-500">Gender:</span> Male</p>
                        <p className="pt-1"><span className="text-slate-500">Address:</span> 17 Carmel View Street, Apt 4B</p>
                      </div>

                      <div className="mt-6 border-t border-border pt-5">
                        <p className="text-sm font-semibold text-slate-900">Media</p>

                        {messages.filter((m) => Boolean(m.fileUrl)).length === 0 ? (
                          <div className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4">
                            <p className="text-sm text-slate-600">No media available</p>
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {messages
                              .filter((m) => Boolean(m.fileUrl))
                              .slice()
                              .reverse()
                              .slice(0, 12)
                              .map((m) => {
                                const isImage = Boolean(m.fileType?.startsWith('image/'));
                                const url = m.fileUrl ? publicAssetUrl(m.fileUrl) : '';

                                return (
                                  <div
                                    key={m.id}
                                    className={cx(
                                      'aspect-square rounded-xl border border-border bg-white overflow-hidden',
                                      'hover:bg-surface-2'
                                    )}
                                    title={m.fileName || (isImage ? 'Image' : 'Attachment')}
                                  >
                                    {isImage ? (
                                      <ModalImage
                                        small={url}
                                        large={url}
                                        className="w-full h-full object-cover"
                                        hideDownload={false}
                                        hideZoom={true}
                                      />
                                    ) : (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full h-full p-2 flex flex-col items-center justify-center gap-2 text-center"
                                      >
                                        <FileText className="w-5 h-5 text-slate-600" />
                                        <span className="text-[11px] text-slate-700 font-medium w-full truncate">
                                          {m.fileName || 'Document'}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            )}



          </div>
        </Card>
      </Container>
    </div>
  );
};

export default TherapistChatPage;
