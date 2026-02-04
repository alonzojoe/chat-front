// components/UserChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StreamChat, Channel as StreamChannel, Event, MessageResponse } from 'stream-chat';
import { Lock } from 'lucide-react';
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
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {therapistName.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{therapistName}</h2>
                <p className="text-sm text-gray-500">Therapist</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <span className="text-sm text-gray-600">Online</span>
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
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder={`Message ${therapistName}...`}
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
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserChatPage;
