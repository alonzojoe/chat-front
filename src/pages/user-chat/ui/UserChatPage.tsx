import type { User } from '../../../shared/types/chat';
import { Card, Container } from '../../../shared/ui/Ui';

import { ChatHeader } from './components/ChatHeader';
import { Avatar } from './components/Avatar';
import { MessageBubble } from './components/MessageBubble';
import { Composer } from './components/Composer';
import { useUserChatController } from './hooks/useUserChatController';

type UserChatProps = {
  currentUser: User; // kept for later auth integration
  actorId: string;
};

export const UserChatPage = ({ actorId }: UserChatProps) => {
  const {
    threads,
    activeAppointmentId,
    messages,
    isLoading,
    error,
    messageText,
    setMessageText,
    send,
    onPickFile,
    openThread,
    therapistName,
    messagesEndRef,
    sendDisabled,
    isSending,
  } = useUserChatController({ actorId });

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
          <p className="text-sm font-semibold text-slate-900">Chat failed to load</p>
          <p className="mt-2 text-sm text-slate-600 break-words">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Container className="h-full py-4 sm:py-6">
        <Card className="h-[calc(100vh-88px)] min-h-[640px] overflow-hidden">
          <div className="h-full flex flex-col bg-bg">
            <ChatHeader
              therapistName={therapistName}
              threads={threads}
              activeAppointmentId={activeAppointmentId}
              onPickThread={openThread}
            />

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.senderRole === 'patient' && msg.senderId === actorId;
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={isOwn}
                      sideAvatar={!isOwn ? <Avatar name={therapistName} size={28} /> : undefined}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <Composer
              value={messageText}
              onChange={setMessageText}
              onSend={send}
              onPickFile={onPickFile}
              disabled={sendDisabled}
              isSending={isSending}
            />
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default UserChatPage;
