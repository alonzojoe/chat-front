import type { User } from '../../../shared/types/chat';
import { Card, Container } from '../../../shared/ui/Ui';
import { cn } from '../../../lib/utils';

import type { ChatMessage } from '../../../shared/api/chatApi';

import { Avatar } from './components/Avatar';
import { PatientInfoPanel } from './components/PatientInfoPanel';
import { ChatHeader } from './components/ChatHeader';
import { MessageBubble } from './components/MessageBubble';
import { Composer } from './components/Composer';
import { InboxPanel } from './components/InboxPanel';

import { useTherapistChatController } from './hooks/useTherapistChatController';
import { formatClock } from './hooks/formatClock';

type TherapistChatProps = {
  currentUser: User; // kept for later auth integration
  actorId: string;
};

export const TherapistChatPage = ({ actorId }: TherapistChatProps) => {
  const {
    threads,
    active,
    activeAppointmentId,
    messages,
    isLoading,
    error,
    messageText,
    setMessageText,
    send,
    onPickFile,
    openThread,
    mobileMode,
    backToListMobile,
    messagesEndRef,
    sendDisabled,
  } = useTherapistChatController({ actorId });

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
          <p className="text-sm font-semibold text-slate-900">Therapist chat failed to load</p>
          <p className="mt-2 text-sm text-slate-600 break-words">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Container className="h-full py-4 sm:py-6">
        <Card className="h-[calc(100vh-88px)] min-h-[640px] overflow-hidden">
          <div className="h-full min-h-0 grid sm:grid-cols-[320px_1fr_360px]">


            <InboxPanel
              threads={threads}
              activeAppointmentId={activeAppointmentId}
              onOpenThread={openThread}
              formatClock={formatClock}
              hidden={mobileMode === 'chat'}
            />

            <section className={cn('h-full min-h-0 flex flex-col bg-bg', mobileMode === 'list' ? 'hidden sm:flex' : 'flex')}>
              {active ? (
                <>
                  <ChatHeader active={active} onBackMobile={backToListMobile} />

                  <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
                    <div className="space-y-3">
                      {messages.map((msg: ChatMessage) => {
                        const isOwn = msg.senderRole === 'therapist' && msg.senderId === actorId;
                        return (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={isOwn}
                            timeLabel={formatClock(msg.createdAt)}
                            sideAvatar={!isOwn && active ? <Avatar name={active.patientName} size={28} /> : undefined}
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
                  />
                </>
              ) : (
                <div className="h-full grid place-items-center text-sm text-slate-600">Select a conversation</div>
              )}
            </section>

            <PatientInfoPanel active={active} messages={messages} />

          </div>
        </Card>
      </Container>
    </div>
  );
};

export default TherapistChatPage;
