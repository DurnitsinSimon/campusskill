import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pages, onChange }: PaginationProps) {
  if (pages <= 1) return null;

  const button = 'flex size-10 items-center justify-center rounded-xl text-sm font-bold transition-colors';

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Страницы каталога">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={cn(button, 'text-ink-600 hover:bg-white disabled:opacity-40')}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="size-5" />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
          className={cn(
            button,
            number === page ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-slate-200 hover:bg-slate-50',
          )}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className={cn(button, 'text-ink-600 hover:bg-white disabled:opacity-40')}
        aria-label="Следующая страница"
      >
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}