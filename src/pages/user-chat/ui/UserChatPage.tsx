import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StreamChat,
  Channel as StreamChannel,
  Event,
  MessageResponse,
} from 'stream-chat';
import { Lock, Send } from 'lucide-react';

import type { User } from '../../../shared/types/chat';
import { getStreamApiKey } from '../../../shared/config/stream';
import { fetchStreamToken } from '../../../shared/api/streamToken';

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

const Avatar: React.FC<{ name: string; image?: string; size?: number }> = ({ name, image, size = 36 }) => {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div
      className="shrink-0 rounded-full bg-neutral-200 text-neutral-700 grid place-items-center overflow-hidden"
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

  // Connect + create/watch channel
  useEffect(() => {
    let mounted = true;

    const initChat = async () => {
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
        console.error('Error initializing chat:', err);
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      mounted = false;
      if (client) client.disconnectUser().catch(console.error);
    };
  }, [currentUser.id, currentUser.name, currentUser.role, currentUser.avatar, therapistId]);

  // Events
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (event: Event) => {
      if (event.message) {
        setMessages((prev) => [...prev, event.message as MessageResponse]);
      }
    };

    const handleTypingStart = (event: Event) => {
      if (event.user?.id && event.user.id !== currentUser.id) setIsTyping(true);
    };

    const handleTypingStop = () => setIsTyping(false);

    channel.on('message.new', handleNewMessage);
    channel.on('typing.start', handleTypingStart);
    channel.on('typing.stop', handleTypingStop);

    return () => {
      channel.off('message.new', handleNewMessage);
      channel.off('typing.start', handleTypingStart);
      channel.off('typing.stop', handleTypingStop);
    };
  }, [channel, currentUser.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherMember = useMemo(() => {
    if (!channel) return undefined;
    const members = Object.values(channel.state.members);
    return members.find((m) => m.user?.id !== currentUser.id)?.user as any;
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
    } catch (err) {
      console.error('Error sending message:', err);
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
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-neutral-900 border-r-transparent" />
          <p className="mt-3 text-sm text-neutral-600">Connecting…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">Chat failed to connect</p>
          <p className="mt-2 text-sm text-neutral-600 break-words">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <div className="h-full w-full max-w-3xl mx-auto flex flex-col border-x border-neutral-200 bg-white">
        {/* Header */}
        <div className="safe-top sticky top-0 z-10 bg-white border-b border-neutral-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={(otherMember?.name as string) || therapistName} image={(otherMember?.image as string | undefined) || undefined} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">{therapistName}</p>
                <p className="text-xs text-neutral-500">Active now</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Encrypted</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {messages.map((msg, idx) => {
              const isOwn = msg.user?.id === currentUser.id;
              const showAvatar = !isOwn; // messenger-style: show avatar on the left
              const isLast = idx === messages.length - 1;

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && (
                    <div className={`${showAvatar ? '' : 'opacity-0'} mb-1`}>
                      <Avatar name={msg.user?.name || therapistName} image={(msg.user?.image as string | undefined) || undefined} size={28} />
                    </div>
                  )}

                  <div className={`max-w-[78%] ${isOwn ? 'text-right' : 'text-left'}`}>
                    <div
                      className={
                        isOwn
                          ? 'inline-block rounded-2xl rounded-br-md bg-neutral-900 text-white px-4 py-2'
                          : 'inline-block rounded-2xl rounded-bl-md bg-neutral-100 text-neutral-900 px-4 py-2'
                      }
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>

                    <div className="mt-1 text-[11px] text-neutral-500 flex items-center gap-2">
                      <span>{formatClock(msg.created_at)}</span>
                      {isOwn && isLast && seenText ? <span>{seenText}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>{therapistName} is typing…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="safe-bottom border-t border-neutral-200 bg-white px-4 py-3">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder={`Message ${therapistName}…`}
              className="flex-1 px-4 py-3 rounded-full border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="shrink-0 h-11 w-11 rounded-full bg-neutral-900 text-white grid place-items-center disabled:opacity-50"
              aria-label="Send"
              title="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserChatPage;
