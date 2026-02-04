import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat, Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import {
  ArrowLeft,
  Search,
  Plus,
  Send,
  Phone,
  Video,
  Info,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

import type { User } from '../../../shared/types/chat';
import { getStreamApiKey } from '../../../shared/config/stream';
import { fetchStreamToken } from '../../../shared/api/streamToken';
import { Card, Container, IconButton, cx } from '../../../shared/ui/Ui';

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
        ring
          ? 'ring-2 ring-[color:var(--color-primary)] ring-offset-2 ring-offset-white'
          : 'ring-1 ring-white/70'
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
  info: ChannelInfo;
  isActive: boolean;
  onSelect: () => void;
}> = ({ info, isActive, onSelect }) => {
  const hasUnread = info.unreadCount > 0;

  return (
    <button
      onClick={onSelect}
      className={cx(
        'w-full text-left',
        'rounded-3xl border transition',
        'px-3.5 py-3',
        'bg-white/70 backdrop-blur border-slate-200/70',
        'hover:bg-white hover:border-slate-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2',
        isActive && 'bg-white border-slate-200 shadow-[0_12px_35px_rgba(15,23,42,0.10)]'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
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
      </div>
    </button>
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
      <Container className="h-full py-4 sm:py-6">
        <Card className="h-[calc(100vh-7rem)] min-h-[640px] overflow-hidden">
          <div className="h-full grid sm:grid-cols-[380px_1fr]">
            {/* SIDEBAR */}
            <aside
              className={cx(
                'h-full border-r border-slate-200/70 bg-white/50 backdrop-blur',
                mobileMode === 'chat' ? 'hidden sm:block' : 'block'
              )}
            >
              <div className="h-full flex flex-col">
                {/* Sidebar header */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--color-primary)] text-white shadow-sm">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">Inbox</p>
                          <p className="text-xs text-slate-500 truncate">Your patient conversations</p>
                        </div>
                      </div>
                    </div>
                    <IconButton aria-label="New conversation" title="New">
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  </div>

                  {/* Search */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 rounded-2xl bg-white/70 border border-slate-200/70 px-3 py-2.5">
                      <Search className="w-4 h-4 text-slate-500" />
                      <input
                        className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                        placeholder="Search conversations"
                      />
                    </div>
                  </div>

                  {/* Quick avatars */}
                  {channels.length > 0 ? (
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                      {channels.slice(0, 10).map((c) => (
                        <div key={c.channel.id} className="shrink-0">
                          <Avatar name={c.patientName} image={c.patientImage} size={44} ring={c.unreadCount > 0} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  {channels.length === 0 ? (
                    <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white/50 p-6">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--color-surface-3)] text-[color:var(--color-primary)]">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">No conversations yet</p>
                          <p className="mt-1 text-sm text-slate-600">
                            When a patient sends a message, you’ll see it here.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {channels.map((info) => {
                        const isActive = activeChannel?.id === info.channel.id;
                        return (
                          <ChatListItem
                            key={info.channel.id}
                            info={info}
                            isActive={isActive}
                            onSelect={() => selectChannel(info.channel)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* CHAT */}
            <section
              className={cx(
                'h-full bg-[color:var(--color-surface-2)] flex flex-col',
                mobileMode === 'list' ? 'hidden sm:flex' : 'flex'
              )}
            >
              {activeChannel ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          className="sm:hidden grid h-10 w-10 place-items-center rounded-2xl bg-white/70 border border-slate-200/70"
                          onClick={() => setMobileMode('list')}
                          aria-label="Back"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>

                        <Avatar
                          name={activeInfo?.patientName || 'Patient'}
                          image={activeInfo?.patientImage}
                          size={44}
                          ring
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {activeInfo?.patientName || 'Patient'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">Typically replies within a day</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconButton aria-label="Call">
                          <Phone className="w-4 h-4" />
                        </IconButton>
                        <IconButton aria-label="Video">
                          <Video className="w-4 h-4" />
                        </IconButton>
                        <IconButton aria-label="Info">
                          <Info className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.user?.id === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            className={cx('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
                          >
                            {!isOwn ? (
                              <div className="mb-0.5">
                                <Avatar
                                  name={msg.user?.name || 'Patient'}
                                  image={(msg.user?.image as string | undefined) || undefined}
                                  size={28}
                                />
                              </div>
                            ) : null}

                            <div className={cx('max-w-[78%]', isOwn ? 'text-right' : 'text-left')}>
                              <div
                                className={cx(
                                  'inline-block px-4 py-2.5 text-sm leading-relaxed',
                                  'rounded-2xl shadow-sm',
                                  isOwn
                                    ? 'bg-[color:var(--color-primary)] text-white rounded-br-md'
                                    : 'bg-white/90 text-slate-900 border border-slate-200/70 rounded-bl-md'
                                )}
                              >
                                {msg.text}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">{formatClock(msg.created_at)}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Composer */}
                  <div className="p-4 border-t border-slate-200 bg-white">
                    <form onSubmit={sendMessage} className="flex items-end gap-3">
                      <div className="flex-1">
                        <div className="rounded-3xl bg-slate-50 border border-slate-200 px-4 py-3">
                          <input
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Message…"
                            className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                            disabled={isSending}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!messageText.trim() || isSending}
                        className={cx(
                          'grid h-12 w-12 place-items-center rounded-2xl',
                          'bg-[color:var(--color-primary)] text-white shadow-sm',
                          'hover:brightness-95 active:brightness-90',
                          'disabled:opacity-50',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2'
                        )}
                        aria-label="Send"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full grid place-items-center">
                  <div className="text-center px-8">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/70 border border-slate-200/70 text-[color:var(--color-primary)]">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">Select a conversation</p>
                    <p className="mt-1 text-sm text-slate-600">Pick a patient from the left to start chatting.</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Mobile FAB */}
          <button
            className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-3xl bg-[color:var(--color-primary)] text-white shadow-lg grid place-items-center"
            aria-label="New"
            title="New"
          >
            <Plus className="w-6 h-6" />
          </button>
        </Card>
      </Container>
    </div>
  );
};

export default TherapistChatPage;
