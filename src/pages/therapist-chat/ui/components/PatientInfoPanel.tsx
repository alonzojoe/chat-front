import { FileText } from 'lucide-react';
import ModalImage from 'react-modal-image';

import type { AppointmentSummary, ChatMessage } from '../../../../shared/api/chatApi';
import { publicAssetUrl } from '../../../../shared/api/chatApi';
import { cn } from '../../../../lib/utils';
import { Avatar } from './Avatar';

type PatientInfoPanelProps = {
  active: AppointmentSummary | null;
  messages: ChatMessage[];
};

export const PatientInfoPanel = ({ active, messages }: PatientInfoPanelProps) => {
  const media = messages
    .filter((m) => Boolean(m.fileUrl))
    .slice()
    .reverse()
    .slice(0, 12);

  return (
    <aside className="hidden sm:block h-full min-h-0 border-r border-border bg-white">
      <div className="h-full min-h-0 flex flex-col">
        <div className="p-6 border-b border-border flex flex-col items-center">
          <Avatar name={active?.patientName || 'Patient'} size={96} ring />
          <p className="mt-3 text-base font-semibold text-slate-900">
            {active?.patientName || 'Select a conversation'}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-5">
            <p className="text-sm font-semibold text-slate-900">Patient Info</p>
            <div className="mt-3 space-y-1.5 text-sm text-slate-700">
              <p>
                <span className="text-slate-500">Patient number:</span> 826684619
              </p>
              <p>
                <span className="text-slate-500">Mobile number:</span> +63 917 123 4567
              </p>
              <p>
                <span className="text-slate-500">Email:</span> patient@example.com
              </p>
              <p>
                <span className="text-slate-500">Date of birth:</span> July 18, 1982
              </p>
              <p>
                <span className="text-slate-500">Age:</span> 43
              </p>
              <p>
                <span className="text-slate-500">Gender:</span> Male
              </p>
              <p className="pt-1">
                <span className="text-slate-500">Address:</span> 17 Carmel View Street, Apt 4B
              </p>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-sm font-semibold text-slate-900">Media</p>

              {media.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4">
                  <p className="text-sm text-slate-600">No media available</p>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {media.map((m) => {
                    const isImage = Boolean(m.fileType?.startsWith('image/'));
                    const url = m.fileUrl ? publicAssetUrl(m.fileUrl) : '';

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'aspect-square rounded-xl border border-border bg-white overflow-hidden',
                          'hover:bg-surface-2'
                        )}
                        title={m.fileName || (isImage ? 'Image' : 'Attachment')}
                      >
                        {isImage ? (
                          <ModalImage
                            small={url}
                            large={url}
                            className="w-full h-full object-cover"
                            hideDownload={false}
                            hideZoom={true}
                          />
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full h-full p-2 flex flex-col items-center justify-center gap-2 text-center"
                          >
                            <FileText className="w-5 h-5 text-slate-600" />
                            <span className="text-[11px] text-slate-700 font-medium w-full truncate">
                              {m.fileName || 'Document'}
                            </span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
