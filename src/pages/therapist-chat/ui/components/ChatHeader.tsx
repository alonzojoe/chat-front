import { ArrowLeft } from 'lucide-react';

import type { AppointmentSummary } from '../../../../shared/api/chatApi';
import { IconButton } from '../../../../shared/ui/Ui';
import { Avatar } from './Avatar';

type ChatHeaderProps = {
  active: AppointmentSummary;
  onBackMobile: () => void;
};

export const ChatHeader = ({ active, onBackMobile }: ChatHeaderProps) => {
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
          <Avatar name={active.patientName} size={42} ring />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{active.patientName}</p>
            <p className="text-xs text-slate-500 truncate">Appt #{active.appointmentId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
