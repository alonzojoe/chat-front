// components/TherapistChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StreamChat, Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import type { User } from '../../../shared/types/chat';
import { getStreamApiKey } from '../../../shared/config/stream';

const API_KEY = getStreamApiKey();

interface TherapistChatProps {
  currentUser: User;
}

interface ChannelInfo {
  channel: StreamChannel;
  patientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const TherapistChatPage: React.FC<TherapistChatProps> = ({ currentUser }) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Stream Chat and load channels
  useEffect(() => {
    const initChat = async () => {
      try {
        const chatClient = StreamChat.getInstance(API_KEY);
        const { fetchStreamToken } = await import('../../../shared/api/streamToken');
        const token = await fetchStreamToken(currentUser.id);

        await chatClient.connectUser(
          {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
          },
          token
        );

        setClient(chatClient);

        // Query all channels where therapist is a member
        const filter = {
          type: 'messaging',
          members: { $in: [currentUser.id] },
        };

        const sort = [{ last_message_at: -1 as const }];

        const channelList = await chatClient.queryChannels(filter, sort, {
          watch: true,
          state: true,
        });

        // Map channels to info format
        const channelInfos: ChannelInfo[] = channelList.map((ch) => {
          const messages = ch.state.messages;
          const lastMessage = messages[messages.length - 1];
          const otherMembers = Object.values(ch.state.members).filter(
            (m) => m.user?.id !== currentUser.id
          );
          const patientName = otherMembers[0]?.user?.name || 'Patient';

          return {
            channel: ch,
            patientName,
            lastMessage: lastMessage?.text || 'No messages yet',
            lastMessageTime: lastMessage?.created_at
              ? formatTime(new Date(lastMessage.created_at))
              : '',
            unreadCount: ch.countUnread(),
          };
        });

        setChannels(channelInfos);

        // Auto-select first channel
        if (channelList.length > 0) {
          await selectChannel(channelList[0]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing therapist chat:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize therapist chat');
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [currentUser]);

  // Listen for new messages on active channel
  useEffect(() => {
    if (!activeChannel) return;

    const handleNewMessage = (event: Event) => {
      if (event.message) {
        setMessages((prev) => [...prev, event.message as MessageResponse]);
      }
    };

    activeChannel.on('message.new', handleNewMessage);

    return () => {
      activeChannel.off('message.new', handleNewMessage);
    };
  }, [activeChannel]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectChannel = async (channel: StreamChannel) => {
    setActiveChannel(channel);
    
    // Load messages
    const state = await channel.query({ messages: { limit: 50 } });
    setMessages(state.messages || []);

    // Mark as read
    await channel.markRead();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await activeChannel.sendMessage({
        text: messageText,
      });
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900">Therapist chat failed to connect</h2>
          <p className="mt-2 text-sm text-gray-600 break-words">{error}</p>
          <div className="mt-4 text-sm text-gray-700">
            <p className="font-medium">Things to check:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><code className="text-xs">STREAM_API_SECRET</code> is set (server only)</li>
              <li>API server is running (token endpoint: <code className="text-xs">/api/stream/token</code>)</li>
              <li>Your Stream app key matches the secret</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Patient Messages</h1>
            <p className="text-sm text-gray-600 mt-1">
              {channels.length} active conversation{channels.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-sm text-green-700 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Channel List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="divide-y divide-gray-100">
            {channels.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No conversations yet</p>
                <p className="text-gray-400 text-sm mt-1">Patient messages will appear here</p>
              </div>
            ) : (
              channels.map((info) => (
                <ChannelPreviewItem
                  key={info.channel.id}
                  info={info}
                  isActive={activeChannel?.id === info.channel.id}
                  onClick={() => selectChannel(info.channel)}
                />
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeChannel ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {channels.find(c => c.channel.id === activeChannel.id)?.patientName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {channels.find(c => c.channel.id === activeChannel.id)?.patientName}
                    </h2>
                    <p className="text-sm text-gray-500">Patient</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.user?.id === currentUser.id}
                      userName={msg.user?.name || 'Unknown'}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your response..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || isSending}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-300 mb-4">
                  <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600">Select a conversation</h3>
                <p className="text-gray-400 mt-2">Choose a patient from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Channel Preview Item Component
const ChannelPreviewItem: React.FC<{
  info: ChannelInfo;
  isActive: boolean;
  onClick: () => void;
}> = ({ info, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-4 text-left transition-colors ${
        isActive
          ? 'bg-blue-50 border-l-4 border-blue-600'
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {info.patientName.charAt(0)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-800 truncate">{info.patientName}</h4>
            {info.lastMessageTime && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{info.lastMessageTime}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">{info.lastMessage}</p>
        </div>

        {info.unreadCount > 0 && (
          <div className="flex-shrink-0 ml-2">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
              {info.unreadCount}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{
  message: MessageResponse;
  isOwn: boolean;
  userName: string;
}> = ({ message, isOwn, userName }) => {
  const formatMessageTime = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <p className="text-xs text-gray-500 mb-1 ml-3">{userName}</p>
        )}
        <div
          className={`px-4 py-3 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          <p
            className={`text-xs mt-1 ${
              isOwn ? 'text-blue-100' : 'text-gray-400'
            }`}
          >
            {formatMessageTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default TherapistChatPage;
