import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat, Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import { ArrowLeft, Search, Plus, Send, Phone, Video, Info } from 'lucide-react';

import type { User } from '../../../shared/types/chat';
import { getStreamApiKey } from '../../../shared/config/stream';
import { fetchStreamToken } from '../../../shared/api/streamToken';
import { Card, IconButton, cx } from '../../../shared/ui/Ui';

const API_KEY = getStreamApiKey();

interface TherapistChatProps {
  currentUser: User;
}

interface ChannelInfo {
  channel: StreamChannel;
  patientName: string;
  patientImage?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const formatClock = (date: Date | string | undefined) => {
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
        ring ? 'ring-2 ring-[color:var(--color-primary)] ring-offset-2 ring-offset-white' : 'ring-2 ring-white'
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

export const TherapistChatPage: React.FC<TherapistChatProps> = ({ currentUser }) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [mobileMode, setMobileMode] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshChannels = async (chatClient: StreamChat) => {
    const filter = { type: 'messaging', members: { $in: [currentUser.id] } };
    const sort = [{ last_message_at: -1 as const }];

    const channelList = await chatClient.queryChannels(filter, sort, {
      watch: true,
      state: true,
    });

    const infos: ChannelInfo[] = channelList.map((ch) => {
      const msgs = ch.state.messages;
      const last = msgs[msgs.length - 1];
      const other = Object.values(ch.state.members).find((m) => m.user?.id !== currentUser.id)?.user as any;

      return {
        channel: ch,
        patientName: (other?.name as string) || 'Patient',
        patientImage: (other?.image as string | undefined) || undefined,
        lastMessage: last?.text || 'No messages yet',
        lastMessageTime: last?.created_at ? formatClock(last.created_at) : '',
        unreadCount: ch.countUnread(),
      };
    });

    setChannels(infos);
    return channelList;
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const chatClient = StreamChat.getInstance(API_KEY);
        const token = await fetchStreamToken(currentUser.id);

        await chatClient.connectUser(
          {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
            image: currentUser.avatar,
          },
          token
        );

        if (!mounted) return;
        setClient(chatClient);

        const list = await refreshChannels(chatClient);
        if (list.length > 0) await selectChannel(list[0]);

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
      if (client) client.disconnectUser().catch(console.error);
    };
  }, [currentUser.id, currentUser.name, currentUser.role, currentUser.avatar]);

  useEffect(() => {
    if (!activeChannel) return;

    const handleNewMessage = async (event: Event) => {
      if (!event.message) return;
      setMessages((prev) => [...prev, event.message as MessageResponse]);
      if (client) {
        try {
          await refreshChannels(client);
        } catch {}
      }
    };

    activeChannel.on('message.new', handleNewMessage);
    return () => {
      activeChannel.off('message.new', handleNewMessage);
    };
  }, [activeChannel, client]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectChannel = async (ch: StreamChannel) => {
    setActiveChannel(ch);
    const state = await ch.query({ messages: { limit: 50 } });
    setMessages(state.messages || []);
    await ch.markRead();
    setMobileMode('chat');
  };

  const activeInfo = useMemo(
    () => channels.find((c) => c.channel.id === activeChannel?.id),
    [channels, activeChannel]
  );

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await activeChannel.sendMessage({ text: messageText });
      setMessageText('');
    } finally {
      setIsSending(false);
    }
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
      <div className="h-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Card className="h-full overflow-hidden">
          <div className="h-full grid sm:grid-cols-[360px_1fr]">
            {/* LIST */}
            <div className={cx('border-r border-[color:var(--color-border)] bg-white', mobileMode === 'chat' ? 'hidden sm:block' : 'block')}>
              {/* Header */}
              <div className="bg-[color:var(--color-primary)] text-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-tight">Inbox</p>
                    <p className="text-xs text-white/80 truncate">Patients • Recent conversations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton className="bg-white/15 border-white/15 text-white shadow-none hover:bg-white/20">
                      <Search className="w-4 h-4" />
                    </IconButton>
                    <IconButton className="bg-white/15 border-white/15 text-white shadow-none hover:bg-white/20" aria-label="New">
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>

                {/* Quick avatars */}
                {channels.length > 0 ? (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {channels.slice(0, 8).map((c) => (
                      <div key={c.channel.id} className="shrink-0">
                        <Avatar name={c.patientName} image={c.patientImage} size={44} ring />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b border-[color:var(--color-border)] bg-white">
                <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--color-surface-3)] px-3 py-2.5">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                    placeholder="Search conversations"
                  />
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-600 hover:bg-white/70"
                    aria-label="New conversation"
                    title="New"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Conversations */}
              <div className="overflow-y-auto bg-white">
                {channels.length === 0 ? (
                  <div className="p-6">
                    <p className="text-sm font-semibold text-slate-900">No conversations yet</p>
                    <p className="mt-1 text-sm text-slate-600">When a patient messages you, it’ll show up here.</p>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 space-y-2">
                    {channels.map((info) => {
                      const isActive = activeChannel?.id === info.channel.id;
                      const hasUnread = info.unreadCount > 0;

                      return (
                        <button
                          key={info.channel.id}
                          onClick={() => selectChannel(info.channel)}
                          className={cx(
                            'group w-full text-left flex items-center gap-3 rounded-3xl border px-3.5 py-3 transition',
                            'border-[color:var(--color-border)] bg-white hover:bg-[color:var(--color-surface-2)] hover:border-slate-200',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2',
                            isActive && 'bg-[color:var(--color-surface-2)] border-slate-200 shadow-[0_10px_25px_rgba(15,23,42,0.08)]'
                          )}
                        >
                          <div className="relative">
                            <Avatar name={info.patientName} image={info.patientImage} size={46} ring={isActive || hasUnread} />
                            {hasUnread ? (
                              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[color:var(--color-primary)] ring-2 ring-white" />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={cx('text-sm font-semibold truncate', hasUnread ? 'text-slate-900' : 'text-slate-900')}>
                                  {info.patientName}
                                </p>
                                <p className={cx('mt-0.5 text-sm truncate', hasUnread ? 'text-slate-700' : 'text-slate-600')}>
                                  {info.lastMessage}
                                </p>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-1">
                                <p className="text-[11px] text-slate-500">{info.lastMessageTime || ' '}</p>
                                {hasUnread ? (
                                  <span className="min-w-6 h-6 px-2 rounded-full bg-[color:var(--color-primary)] text-white text-xs grid place-items-center">
                                    {info.unreadCount}
                                  </span>
                                ) : (
                                  <span className="h-6" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating + button (mobile-ish) */}
              <button
                className="hidden sm:hidden" // keep off; reference-only
                aria-label="New"
              />
            </div>

            {/* CHAT */}
            <div className={cx('bg-[color:var(--color-surface-2)] flex flex-col', mobileMode === 'list' ? 'hidden sm:flex' : 'flex')}>
              {activeChannel ? (
                <>
                  {/* Header */}
                  <div className="bg-[color:var(--color-primary)] text-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          className="sm:hidden grid h-10 w-10 place-items-center rounded-2xl bg-white/15"
                          onClick={() => setMobileMode('list')}
                          aria-label="Back"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <Avatar name={activeInfo?.patientName || 'Patient'} image={activeInfo?.patientImage} size={40} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{activeInfo?.patientName || 'Patient'}</p>
                          <p className="text-xs text-white/80">Online</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconButton className="bg-white/15 border-white/15 text-white shadow-none hover:bg-white/20">
                          <Phone className="w-4 h-4" />
                        </IconButton>
                        <IconButton className="bg-white/15 border-white/15 text-white shadow-none hover:bg-white/20">
                          <Video className="w-4 h-4" />
                        </IconButton>
                        <IconButton className="bg-white/15 border-white/15 text-white shadow-none hover:bg-white/20">
                          <Info className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="space-y-2">
                      {messages.map((msg) => {
                        const isOwn = msg.user?.id === currentUser.id;
                        return (
                          <div key={msg.id} className={cx('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                            {!isOwn && (
                              <div className="mb-1">
                                <Avatar name={msg.user?.name || 'Patient'} image={(msg.user?.image as string | undefined) || undefined} size={28} />
                              </div>
                            )}
                            <div className={cx('max-w-[78%]', isOwn ? 'text-right' : 'text-left')}>
                              <div
                                className={cx(
                                  'inline-block px-4 py-2.5 text-sm leading-relaxed shadow-sm rounded-2xl',
                                  isOwn
                                    ? 'bg-[color:var(--color-primary)] text-white rounded-br-md'
                                    : 'bg-white text-slate-900 rounded-bl-md'
                                )}
                              >
                                {msg.text}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                {formatClock(msg.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Input */}
                  <div className="border-t border-[color:var(--color-border)] bg-white p-3">
                    <form onSubmit={sendMessage} className="flex items-end gap-2">
                      <div className="flex-1 rounded-2xl bg-[color:var(--color-surface-3)] px-4 py-3">
                        <input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Enter message…"
                          className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                          disabled={isSending}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!messageText.trim() || isSending}
                        className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--color-primary)] text-white shadow-sm disabled:opacity-50"
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
            </div>
          </div>

          {/* FAB (mobile) */}
          <button
            className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-2xl bg-[color:var(--color-primary)] text-white shadow-lg grid place-items-center"
            aria-label="New"
            title="New"
          >
            <Plus className="w-6 h-6" />
          </button>
        </Card>
      </div>
    </div>
  );
};

export default TherapistChatPage;
