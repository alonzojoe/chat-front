import React from 'react';

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const Container: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => (
  <div className={cx('max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8', className)}>{children}</div>
);

export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <div
    className={cx(
      'rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur',
      'shadow-[0_12px_40px_rgba(15,23,42,0.10)]',
      className
    )}
  >
    {children}
  </div>
);

export const Pill: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <span
    className={cx(
      'inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1.5',
      'text-xs font-medium text-slate-700 backdrop-blur',
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
      'inline-flex items-center justify-center gap-2 rounded-2xl',
      'bg-[color:var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white',
      'shadow-sm hover:brightness-95 active:brightness-90 disabled:opacity-50',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2',
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
      'grid h-10 w-10 place-items-center rounded-2xl',
      'border border-slate-200/70 bg-white/60 text-slate-700 backdrop-blur',
      'shadow-sm hover:bg-white/80 active:bg-white',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
);
