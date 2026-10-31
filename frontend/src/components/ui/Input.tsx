import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink-900">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          'h-11 rounded-xl border bg-white px-3.5 text-sm text-ink-900 transition-colors placeholder:text-ink-400',
          'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100',
          error ? 'border-red-400' : 'border-slate-300',
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
}