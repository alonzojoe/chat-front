import { ArrowLeft } from 'lucide-react';

import type { ConversationSummary } from '../../../../shared/api/chatApi';
import { getUserName } from '../../../../shared/data/users';
import { Avatar } from './Avatar';

type ChatHeaderProps = {
  active: ConversationSummary;
  onBackMobile: () => void;
};

export const ChatHeader = ({ active, onBackMobile }: ChatHeaderProps) => {
  const clientName = getUserName(active.clientId, 'Patient');

  return (
    <div className="p-4 bg-white border-b border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="sm:hidden grid h-10 w-10 place-items-center rounded-xl border border-border bg-white"
            onClick={onBackMobile}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar name={clientName} size={42} ring />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{clientName}</p>
            <p className="text-xs text-slate-500 truncate">Thread #{active.conversationId.slice(-6)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
