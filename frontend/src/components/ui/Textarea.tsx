import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function Textarea({ label, hint, className, id, ...props }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={textareaId} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={3}
        className="resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none"
        {...props}
      />
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}