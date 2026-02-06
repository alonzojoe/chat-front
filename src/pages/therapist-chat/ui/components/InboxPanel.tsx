import { Search } from 'lucide-react';

import type { AppointmentSummary } from '../../../../shared/api/chatApi';
import { cn } from '../../../../lib/utils';
import { ChatListItem } from './ChatListItem';

type InboxPanelProps = {
  threads: AppointmentSummary[];
  activeAppointmentId: number | null;
  onOpenThread: (appt: AppointmentSummary) => void;
  formatClock: (date: string | undefined) => string;
  hidden?: boolean;
};

export const InboxPanel = ({ threads, activeAppointmentId, onOpenThread, formatClock, hidden }: InboxPanelProps) => {
  return (
    <aside className={cn('h-full min-h-0 border-l border-border bg-white', hidden && 'hidden sm:block')}>
      <div className="h-full min-h-0 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Inbox</p>
              <p className="text-xs text-slate-500 truncate">All messages</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
              placeholder="Search messages"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {threads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-2 p-5">
              <p className="text-sm font-semibold text-slate-900">No conversations yet</p>
              <p className="mt-1 text-sm text-slate-600">When a patient sends a message, it will appear here.</p>
            </div>
          ) : (
            threads.map((t) => (
              <ChatListItem
                key={t.appointmentId}
                info={t}
                active={activeAppointmentId === t.appointmentId}
                onClick={() => onOpenThread(t)}
                formatClock={formatClock}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
