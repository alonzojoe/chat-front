import type { AppointmentSummary } from '../../../../shared/api/chatApi';
import { cn } from '../../../../lib/utils';
import { Avatar } from './Avatar';

type ChatListItemProps = {
  info: AppointmentSummary;
  active: boolean;
  onClick: () => void;
  formatClock: (date: string | undefined) => string;
};

export const ChatListItem = ({ info, active, onClick, formatClock }: ChatListItemProps) => {
  const last = info.lastMessage || 'No messages yet';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3.5 py-3 transition',
        'border-border bg-white',
        'hover:bg-surface-2',
        active && 'bg-surface-2'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        <Avatar name={info.patientName} size={44} ring={active} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{info.patientName}</p>
              <p className="mt-0.5 text-sm truncate text-slate-600">{last}</p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1">
              <p className="text-[11px] text-slate-500">
                {info.lastMessageAt ? formatClock(info.lastMessageAt) : ' '}
              </p>
              {info.unreadCount && info.unreadCount > 0 ? (
                <span className="min-w-6 h-6 px-2 rounded-full bg-primary text-white text-[11px] font-semibold grid place-items-center">
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
