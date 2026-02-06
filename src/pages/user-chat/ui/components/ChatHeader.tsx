import { Info } from 'lucide-react';

import type { AppointmentSummary } from '../../../../shared/api/chatApi';
import { IconButton } from '../../../../shared/ui/Ui';
import { cn } from '../../../../lib/utils';
import { Avatar } from './Avatar';

type ChatHeaderProps = {
  therapistName: string;
  threads: AppointmentSummary[];
  activeAppointmentId: number | null;
  onPickThread: (appt: AppointmentSummary) => void;
};

export const ChatHeader = ({ therapistName, threads, activeAppointmentId, onPickThread }: ChatHeaderProps) => {
  return (
    <div className="p-4 bg-white border-b border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={therapistName} size={42} ring />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{therapistName}</p>
            <p className="text-xs text-slate-500 truncate">Appointment chat</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton aria-label="Info">
            <Info className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {threads.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {threads.map((t) => (
            <button
              key={t.appointmentId}
              className={cn(
                'shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold',
                t.appointmentId === activeAppointmentId ? 'border-primary bg-surface-2' : 'border-border bg-white'
              )}
              onClick={() => onPickThread(t)}
            >
              Appt #{t.appointmentId}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
