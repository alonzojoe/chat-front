import { Paperclip, Send } from 'lucide-react';

import { cn } from '../../../../lib/utils';

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  onPickFile: (file: File) => void;
  disabled?: boolean;
};

export const Composer = ({ value, onChange, onSend, onPickFile, disabled }: ComposerProps) => {
  return (
    <div className="p-4 bg-white border-t border-border">
      <form onSubmit={onSend} className="flex items-end gap-3">
        <label
          className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-white hover:bg-surface-2 cursor-pointer"
          title="Attach file"
        >
          <input
            className="hidden"
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.currentTarget.value = '';
            }}
          />
          <Paperclip className="w-5 h-5 text-slate-700" />
        </label>

        <div className="flex-1 rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Message…"
            className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
            disabled={disabled}
          />
        </div>

        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className={cn(
            'grid h-12 w-12 place-items-center rounded-xl',
            'bg-primary text-white shadow-sm',
            'hover:bg-primary-dark active:translate-y-[0.5px]',
            'disabled:opacity-50'
          )}
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
