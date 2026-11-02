import { Star } from 'lucide-react';
import type { WorkshopReview } from '../../api/types';
import { formatDate } from '../../lib/format';
import { Avatar } from '../ui/Avatar';

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Оценка ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={star <= value ? 'size-4 fill-amber-400 text-amber-400' : 'size-4 fill-slate-200 text-slate-200'}
        />
      ))}
    </span>
  );
}

export function ReviewCard({ review, mentorName }: { review: WorkshopReview; mentorName: string }) {
  const [firstName, lastInitial = ''] = review.author.name.split(' ');

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <Avatar firstName={firstName} lastName={lastInitial} src={review.author.avatarUrl} size="sm" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{review.author.name}</p>
          <p className="text-xs text-ink-400">{formatDate(review.createdAt)}</p>
        </div>
        <Stars value={review.workshopRating} />
      </div>
      {review.comment && <p className="text-sm text-ink-900">{review.comment}</p>}
      {review.mentorReply && (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <p className="text-xs font-bold text-brand-700">Ответ ментора · {mentorName}</p>
          <p className="mt-1 text-ink-600">{review.mentorReply}</p>
        </div>
      )}
    </article>
  );
}