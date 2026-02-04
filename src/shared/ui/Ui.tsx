import React from 'react';

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => (
  <div
    className={cx(
      'rounded-[28px] border border-[color:var(--color-border)] bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]',
      className
    )}
  >
    {children}
  </div>
);

export const Pill: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => (
  <span
    className={cx(
      'inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur',
      className
    )}
  >
    {children}
  </span>
);

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
> = ({ className, ...props }) => (
  <button
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95 active:brightness-90 disabled:opacity-50',
      className
    )}
    {...props}
  />
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
> = ({ className, ...props }) => (
  <button
    className={cx(
      'grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--color-border)] bg-white/80 text-slate-700 shadow-sm hover:bg-white active:bg-slate-50',
      className
    )}
    {...props}
  />
);
