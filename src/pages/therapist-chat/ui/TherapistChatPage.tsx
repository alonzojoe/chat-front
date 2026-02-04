import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StreamChat,
  Channel as StreamChannel,
  Event,
  MessageResponse,
} from 'stream-chat';
import { ArrowLeft, Search, Send } from 'lucide-react';

import type { User } from '../../../shared/types/chat';
import { getStreamApiKey } from '../../../shared/config/stream';
import { fetchStreamToken } from '../../../shared/api/streamToken';

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

const Avatar: React.FC<{ name: string; image?: string; size?: number }> = ({ name, image, size = 40 }) => {
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

  // init
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

        const channelList = await refreshChannels(chatClient);

        if (channelList.length > 0) {
          await selectChannel(channelList[0]);
        }

        if (!mounted) return;
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing therapist chat:', err);
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to initialize therapist chat');
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      mounted = false;
      if (client) client.disconnectUser().catch(console.error);
    };
  }, [currentUser.id, currentUser.name, currentUser.role, currentUser.avatar]);

  // active channel listener
  useEffect(() => {
    if (!activeChannel) return;

    const handleNewMessage = async (event: Event) => {
      if (event.message) {
        setMessages((prev) => [...prev, event.message as MessageResponse]);
        // keep sidebar fresh
        if (client) {
          try {
            await refreshChannels(client);
          } catch {}
        }
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

  const selectChannel = async (channel: StreamChannel) => {
    setActiveChannel(channel);
    const state = await channel.query({ messages: { limit: 50 } });
    setMessages(state.messages || []);
    await channel.markRead();
    setMobileMode('chat');
  };

  const activeInfo = useMemo(() => channels.find((c) => c.channel.id === activeChannel?.id), [channels, activeChannel]);

  const seenText = useMemo(() => {
    if (!activeChannel || messages.length === 0) return '';

    const lastOwn = [...messages].reverse().find((m) => m.user?.id === currentUser.id);
    if (!lastOwn?.created_at) return '';

    const readMap = (activeChannel.state.read as unknown as Record<string, any>) || undefined;
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
  }, [activeChannel, messages, currentUser.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await activeChannel.sendMessage({ text: messageText });
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-neutral-900 border-r-transparent" />
          <p className="mt-3 text-sm text-neutral-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">Therapist chat failed to connect</p>
          <p className="mt-2 text-sm text-neutral-600 break-words">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-neutral-50">
      <div className="h-full w-full max-w-6xl mx-auto bg-white flex sm:rounded-2xl sm:my-6 sm:border sm:border-neutral-200 sm:shadow-sm overflow-hidden">
        {/* LIST */}
        <div className={`${mobileMode === 'chat' ? 'hidden' : 'flex'} sm:flex flex-col w-full sm:w-[360px] border-r border-neutral-200`}>
          <div className="safe-top sticky top-0 z-10 bg-white border-b border-neutral-200">
            <div className="px-4 py-3">
              <p className="text-lg font-semibold text-neutral-900">Messages</p>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2">
                <Search className="w-4 h-4 text-neutral-500" />
                <input
                  placeholder="Search"
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {channels.length === 0 ? (
              <div className="p-6 text-sm text-neutral-600">No conversations yet.</div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {channels.map((info) => {
                  const isActive = activeChannel?.id === info.channel.id;
                  return (
                    <button
                      key={info.channel.id}
                      onClick={() => selectChannel(info.channel)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-neutral-50 ${isActive ? 'bg-neutral-50' : ''}`}
                    >
                      <Avatar name={info.patientName} image={info.patientImage} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{info.patientName}</p>
                          <p className="text-xs text-neutral-500 shrink-0">{info.lastMessageTime}</p>
                        </div>
                        <p className="text-sm text-neutral-600 truncate">{info.lastMessage}</p>
                      </div>
                      {info.unreadCount > 0 ? (
                        <span className="ml-2 shrink-0 min-w-5 h-5 px-1 rounded-full bg-neutral-900 text-white text-xs grid place-items-center">
                          {info.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CHAT */}
        <div className={`${mobileMode === 'list' ? 'hidden' : 'flex'} sm:flex flex-1 flex-col`}>
          {activeChannel ? (
            <>
              <div className="safe-top sticky top-0 z-10 bg-white border-b border-neutral-200">
                <div className="px-4 py-3 flex items-center gap-3">
                  <button
                    className="sm:hidden h-9 w-9 rounded-full hover:bg-neutral-50 grid place-items-center"
                    onClick={() => setMobileMode('list')}
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Avatar name={activeInfo?.patientName || 'Patient'} image={activeInfo?.patientImage} size={40} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{activeInfo?.patientName || 'Patient'}</p>
                    <p className="text-xs text-neutral-500">Messenger-style demo</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-2">
                  {messages.map((msg, idx) => {
                    const isOwn = msg.user?.id === currentUser.id;
                    const isLast = idx === messages.length - 1;

                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && (
                          <div className="mb-1">
                            <Avatar name={msg.user?.name || 'Patient'} image={(msg.user?.image as string | undefined) || undefined} size={28} />
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
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="safe-bottom border-t border-neutral-200 bg-white px-4 py-3">
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Message…"
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
            </>
          ) : (
            <div className="h-full grid place-items-center text-sm text-neutral-600">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistChatPage;
