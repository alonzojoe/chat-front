// components/UserChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StreamChat, Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import { Lock } from 'lucide-react';
import { fetchStreamToken } from '../../../shared/api/streamToken';
import type { User } from '../../../shared/types/chat';
import { getStreamApiKey } from '../../../shared/config/stream';

const API_KEY = getStreamApiKey();

interface UserChatProps {
  currentUser: User;
  therapistId: string;
  therapistName?: string;
}

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

  // Initialize Stream Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const chatClient = StreamChat.getInstance(API_KEY);
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

        // Create/get channel
        const channelId = `user_${currentUser.id}_therapist_${therapistId}`;
        const newChannel = chatClient.channel('messaging', channelId, {
          name: 'Chat with Therapist',
          members: [currentUser.id, therapistId],
          private: true,
          created_by_user: currentUser.id,
          therapist_id: therapistId,
        });

        await newChannel.watch();
        setChannel(newChannel);

        // Load existing messages
        const state = await newChannel.query({ messages: { limit: 50 } });
        setMessages(state.messages || []);

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [currentUser.id, therapistId]);

  // Listen for new messages and events
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (event: Event) => {
      if (event.message) {
        setMessages((prev) => [...prev, event.message as MessageResponse]);
      }
    };

    const handleTypingStart = (event: Event) => {
      if (event.user?.id !== currentUser.id) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = () => {
      setIsTyping(false);
    };

    channel.on('message.new', handleNewMessage);
    channel.on('typing.start', handleTypingStart);
    channel.on('typing.stop', handleTypingStop);

    return () => {
      channel.off('message.new', handleNewMessage);
      channel.off('typing.start', handleTypingStart);
      channel.off('typing.stop', handleTypingStop);
    };
  }, [channel, currentUser.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await channel.sendMessage({
        text: messageText,
      });
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
    if (channel && text.length > 0) {
      await channel.keystroke();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600 font-medium">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900">Chat failed to connect</h2>
          <p className="mt-2 text-sm text-gray-600 break-words">{error}</p>
          <div className="mt-4 text-sm text-gray-700">
            <p className="font-medium">Things to check:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><code className="text-xs">VITE_STREAM_API_KEY</code> is set correctly</li>
              <li>API server is running (token endpoint: <code className="text-xs">/api/stream/token</code>)</li>
              <li>You rotated/replaced the Stream secret after exposure</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-purple-100 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white grid place-items-center font-semibold shadow-sm">
                {therapistName.charAt(0)}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">{therapistName}</h2>
                <p className="text-xs sm:text-sm text-slate-500">Your therapist</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-purple-100 bg-white/60 px-3 py-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-slate-700">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-2">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            <span>This conversation is encrypted and private</span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.user?.id === currentUser.id}
              userName={msg.user?.name || 'Unknown'}
            />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>{therapistName} is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-purple-100 bg-white/70 backdrop-blur px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex items-end gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={messageText}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder={`Message ${therapistName}...`}
                className="w-full px-4 py-3 rounded-2xl border border-purple-100 bg-white/80 shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-200/50 focus:border-purple-200"
                disabled={isSending}
              />
            </div>
            <button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{
  message: MessageResponse;
  isOwn: boolean;
  userName: string;
}> = ({ message, isOwn, userName }) => {
  const formatTime = (date: Date | string | undefined) => {
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
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white'
              : 'bg-white/80 backdrop-blur border border-purple-100 text-slate-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
          <p className={`text-[11px] mt-1 ${isOwn ? 'text-white/80' : 'text-slate-400'}`}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserChatPage;
