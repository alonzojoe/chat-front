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
      'rounded-2xl border border-border bg-surface',
      'shadow-[0_14px_40px_rgba(15,23,42,0.08)]',
      className
    )}
  >
    {children}
  </div>
);

export const Pill: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <span
    className={cx(
      'inline-flex items-center gap-2 rounded-full border border-border',
      'bg-surface px-3 py-1.5 text-xs font-medium text-slate-700',
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
      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
      'bg-primary text-white shadow-sm',
      'hover:bg-primary-dark active:translate-y-[0.5px] active:shadow-none',
      'disabled:opacity-50 disabled:pointer-events-none',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
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
      'grid h-10 w-10 place-items-center rounded-xl',
      'border border-border bg-surface text-slate-700',
      'shadow-sm hover:bg-surface-2 hover:text-primary',
      'active:bg-slate-200/60',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
);
