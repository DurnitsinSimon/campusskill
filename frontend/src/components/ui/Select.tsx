import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ options, className, ...props }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white pr-10 pl-3.5 text-sm font-semibold text-ink-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}