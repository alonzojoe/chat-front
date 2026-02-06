import ModalImage from 'react-modal-image';
import { FileText } from 'lucide-react';

import { cn } from '../../../../lib/utils';
import { publicAssetUrl, type ChatMessage } from '../../../../shared/api/chatApi';

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  sideAvatar?: React.ReactNode;
  timeLabel: string;
};

export const MessageBubble = ({ message, isOwn, sideAvatar, timeLabel }: MessageBubbleProps) => {
  return (
    <div className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn ? sideAvatar : null}

      <div className={cn('max-w-[78%]', isOwn ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isOwn ? 'bg-primary text-white' : 'bg-light-gray border border-border text-slate-900'
          )}
        >
          {message.body ? message.body : null}

          {message.fileUrl ? (
            <div className={cn('mt-2', isOwn ? 'text-white/90' : 'text-slate-700')}>
              {message.fileType?.startsWith('image/') ? (
                <ModalImage
                  small={publicAssetUrl(message.fileUrl)}
                  large={publicAssetUrl(message.fileUrl)}
                  className="mt-2 max-w-60 rounded-xl object-cover max-h-60"
                  hideDownload={false}
                  hideZoom={true}
                />
              ) : (
                <a
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                    isOwn
                      ? 'border-white/25 bg-white/10 text-white hover:bg-white/15'
                      : 'border-border bg-light-gray text-dark hover:bg-surface-2'
                  )}
                  href={publicAssetUrl(message.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[220px]">{message.fileName || 'Download attachment'}</span>
                </a>
              )}
            </div>
          ) : null}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">{timeLabel}</div>
      </div>
    </div>
  );
};
