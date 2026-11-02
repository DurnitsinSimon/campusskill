import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/cn';

const hints = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'];

interface StarInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function StarInput({ label, value, onChange }: StarInputProps) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              className="p-0.5"
              aria-label={`${star} из 5`}
              aria-pressed={value === star}
            >
              <Star
                className={cn(
                  'size-8 transition-colors',
                  star <= shown ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300',
                )}
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-ink-600">{hints[shown]}</span>
      </div>
    </fieldset>
  );
}