import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat, Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import { Phone, Video, Info, Send, Sparkles } from 'lucide-react';

import type { User } from '../../../shared/types/chat';
import { getStreamApiKey } from '../../../shared/config/stream';
import { fetchStreamToken } from '../../../shared/api/streamToken';
import { Card, Container, IconButton, cx } from '../../../shared/ui/Ui';

const API_KEY = getStreamApiKey();

interface UserChatProps {
  currentUser: User;
  therapistId: string;
  therapistName?: string;
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

export const UserChatPage: React.FC<UserChatProps> = ({
  currentUser,
  therapistId,
  therapistName = 'Your Therapist',
}) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        const channelId = `user_${currentUser.id}_therapist_${therapistId}`;
        const ch = chatClient.channel('messaging', channelId, {
          name: 'Chat',
          members: [currentUser.id, therapistId],
          private: true,
          created_by_user: currentUser.id,
          therapist_id: therapistId,
        });

        await ch.watch();
        const state = await ch.query({ messages: { limit: 50 } });

        if (!mounted) return;
        setChannel(ch);
        setMessages(state.messages || []);
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
  }, [currentUser.id, currentUser.name, currentUser.role, currentUser.avatar, therapistId]);

  useEffect(() => {
    if (!channel) return;

    const onNew = (event: Event) => {
      if (event.message) setMessages((prev) => [...prev, event.message as MessageResponse]);
    };

    const onTypingStart = (event: Event) => {
      if (event.user?.id && event.user.id !== currentUser.id) setIsTyping(true);
    };

    const onTypingStop = () => setIsTyping(false);

    channel.on('message.new', onNew);
    channel.on('typing.start', onTypingStart);
    channel.on('typing.stop', onTypingStop);

    return () => {
      channel.off('message.new', onNew);
      channel.off('typing.start', onTypingStart);
      channel.off('typing.stop', onTypingStop);
    };
  }, [channel, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherMember = useMemo(() => {
    if (!channel) return undefined;
    return Object.values(channel.state.members).find((m) => m.user?.id !== currentUser.id)?.user as any;
  }, [channel, currentUser.id]);

  const seenText = useMemo(() => {
    if (!channel || messages.length === 0) return '';
    const lastOwn = [...messages].reverse().find((m) => m.user?.id === currentUser.id);
    if (!lastOwn?.created_at) return '';

    const readMap = (channel.state.read as unknown as Record<string, any>) || undefined;
    if (!readMap) return '';

    const otherRead = Object.entries(readMap)
      .filter(([userId]) => userId !== currentUser.id)
      .map(([, r]) => r as { last_read?: Date | string })
      .sort((a, b) => new Date(b.last_read || 0).getTime() - new Date(a.last_read || 0).getTime())[0];

    if (!otherRead?.last_read) return '';

    const otherLastRead = new Date(otherRead.last_read).getTime();
    const msgTime = new Date(lastOwn.created_at).getTime();
    if (otherLastRead >= msgTime) return `Seen · ${formatClock(otherRead.last_read)}`;
    return '';
  }, [channel, messages, currentUser.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !messageText.trim() || isSending) return;
    setIsSending(true);
    try {
      await channel.sendMessage({ text: messageText });
      setMessageText('');
      await channel.stopTyping();
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = async (text: string) => {
    setMessageText(text);
    if (channel && text.length > 0) await channel.keystroke();
  };

  if (isLoading) {
    return (
      <div className="h-full grid place-items-center px-6">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--color-primary)] border-r-transparent" />
          <p className="mt-3 text-sm text-slate-600">Connecting…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full grid place-items-center px-6">
        <Card className="p-6 max-w-md w-full">
          <p className="text-sm font-semibold text-slate-900">Chat failed to connect</p>
          <p className="mt-2 text-sm text-slate-600 break-words">{error}</p>
        </Card>
      </div>
    );
  }

  const title = therapistName;
  const avatarName = (otherMember?.name as string) || therapistName;
  const avatarImage = (otherMember?.image as string | undefined) || undefined;

  return (
    <div className="h-full w-full">
      <Container className="h-full py-4 sm:py-6">
        <Card className="h-[calc(100vh-7rem)] min-h-[640px] overflow-hidden">
          <div className="h-full flex flex-col bg-[color:var(--color-surface-2)]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--color-primary)] text-white shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
                    <p className="text-xs text-slate-500 truncate">Private & secure</p>
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

              <div className="mt-4 flex items-center gap-3">
                <Avatar name={avatarName} image={avatarImage} size={44} ring />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{avatarName}</p>
                  <p className="text-xs text-slate-500 truncate">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="space-y-3">
                {messages.map((msg, idx) => {
                  const isOwn = msg.user?.id === currentUser.id;
                  const isLast = idx === messages.length - 1;

                  return (
                    <div key={msg.id} className={cx('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                      {!isOwn ? (
                        <div className="mb-0.5">
                          <Avatar
                            name={msg.user?.name || therapistName}
                            image={(msg.user?.image as string | undefined) || undefined}
                            size={28}
                          />
                        </div>
                      ) : null}

                      <div className={cx('max-w-[78%]', isOwn ? 'text-right' : 'text-left')}>
                        <div
                          className={cx(
                            'inline-block px-4 py-2.5 text-sm leading-relaxed rounded-2xl shadow-sm',
                            isOwn
                              ? 'bg-[color:var(--color-primary)] text-white rounded-br-md'
                              : 'bg-white/90 text-slate-900 border border-slate-200/70 rounded-bl-md'
                          )}
                        >
                          {msg.text}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2 justify-end">
                          <span>{formatClock(msg.created_at)}</span>
                          {isOwn && isLast && seenText ? <span>{seenText}</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                    <span>{therapistName} is typing…</span>
                  </div>
                ) : null}

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
                      onChange={(e) => handleTyping(e.target.value)}
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
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default UserChatPage;
