import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat, Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import { ArrowLeft, Search, Plus, Send, Phone, Video, Info } from 'lucide-react';

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
        ring ? 'ring-2 ring-[color:var(--color-primary)] ring-offset-2 ring-offset-white' : 'ring-1 ring-slate-200'
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
  active: boolean;
  onClick: () => void;
}> = ({ info, active, onClick }) => {
  const hasUnread = info.unreadCount > 0;

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
          <Avatar name={info.patientName} image={info.patientImage} size={44} ring={active || hasUnread} />
          {hasUnread ? (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[color:var(--color-primary)] ring-2 ring-white" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{info.patientName}</p>
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
        <Card className="h-[calc(100vh-88px)] min-h-[640px] overflow-hidden">
          <div className="h-full grid sm:grid-cols-[360px_1fr]">
            {/* LIST */}
            <aside
              className={cx(
                'h-full border-r border-[color:var(--color-border)] bg-white',
                mobileMode === 'chat' ? 'hidden sm:block' : 'block'
              )}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-[color:var(--color-border)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">Inbox</p>
                      <p className="text-xs text-slate-500 truncate">All patient conversations</p>
                    </div>
                    <IconButton aria-label="New conversation" title="New">
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
                  {channels.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
                      <p className="text-sm font-semibold text-slate-900">No conversations yet</p>
                      <p className="mt-1 text-sm text-slate-600">
                        When a patient sends a message, it will appear here.
                      </p>
                    </div>
                  ) : (
                    channels.map((info) => (
                      <ChatListItem
                        key={info.channel.id}
                        info={info}
                        active={activeChannel?.id === info.channel.id}
                        onClick={() => selectChannel(info.channel)}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* CHAT */}
            <section className={cx('h-full flex flex-col bg-[color:var(--color-bg)]', mobileMode === 'list' ? 'hidden sm:flex' : 'flex')}>
              {activeChannel ? (
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
                        <Avatar
                          name={activeInfo?.patientName || 'Patient'}
                          image={activeInfo?.patientImage}
                          size={42}
                          ring
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{activeInfo?.patientName || 'Patient'}</p>
                          <p className="text-xs text-slate-500 truncate">Online</p>
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

                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.user?.id === currentUser.id;
                        return (
                          <div key={msg.id} className={cx('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                            {!isOwn ? (
                              <Avatar
                                name={msg.user?.name || 'Patient'}
                                image={(msg.user?.image as string | undefined) || undefined}
                                size={28}
                              />
                            ) : null}

                            <div className={cx('max-w-[78%]', isOwn ? 'text-right' : 'text-left')}>
                              <div
                                className={cx(
                                  'inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                  isOwn
                                    ? 'bg-[color:var(--color-primary)] text-white'
                                    : 'bg-white border border-[color:var(--color-border)] text-slate-900'
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

                  <div className="p-4 bg-white border-t border-[color:var(--color-border)]">
                    <form onSubmit={sendMessage} className="flex items-end gap-3">
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
