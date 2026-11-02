import { Star } from 'lucide-react';
import { pluralize } from '../../lib/format';

interface RatingProps {
  value: number;
  count: number;
}

export function Rating({ value, count }: RatingProps) {
  if (count === 0) {
    return <span className="text-xs font-semibold text-ink-400">Новый</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold">
      <Star className="size-4 fill-amber-400 text-amber-400" />
      {value.toFixed(1)}
      <span className="text-xs font-medium text-ink-400">
        ({count} {pluralize(count, ['отзыв', 'отзыва', 'отзывов'])})
      </span>
    </span>
  );
}