import { Link } from 'react-router';
import { ExternalLink, MapPin, MessageSquarePlus, MonitorPlay, Star } from 'lucide-react';
import type { Enrollment } from '../../api/types';
import { EnrollmentStatusBadge } from '../../components/workshops/EnrollmentStatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDuration } from '../../lib/format';
import { cn } from '../../lib/cn';

interface EnrollmentItemProps {
  enrollment: Enrollment;
  onReview: (enrollment: Enrollment) => void;
}

const dayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
const timeFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

export function EnrollmentItem({ enrollment, onReview }: EnrollmentItemProps) {
  const { workshop } = enrollment;
  const date = new Date(workshop.startsAt);
  const isInactive = enrollment.status === 'CANCELLED' || enrollment.status === 'REJECTED';

  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:p-5',
        isInactive && 'opacity-70',
      )}
    >
      <div className="flex gap-4 sm:flex-1">
        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <span className="text-2xl leading-none font-extrabold">{dayFormat.format(date)}</span>
          <span className="text-xs font-semibold">{monthFormat.format(date)}</span>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <EnrollmentStatusBadge status={enrollment.status} />
            {enrollment.status === 'WAITLISTED' && (
              <span className="text-xs font-semibold text-amber-700">позиция {enrollment.waitlistPosition}</span>
            )}
          </div>
          <Link to={`/workshops/${workshop.slug}`} className="font-bold hover:text-brand-700">
            {workshop.title}
          </Link>
          <p className="text-xs text-ink-600">
            {timeFormat.format(date)} · {formatDuration(workshop.durationMinutes)} · {workshop.mentorName}
          </p>
          <p className="inline-flex items-start gap-1.5 text-xs text-ink-400">
            {workshop.format === 'ONLINE' ? (
              <>
                <MonitorPlay className="size-3.5 shrink-0" /> Онлайн
              </>
            ) : (
              <>
                <MapPin className="size-3.5 shrink-0" /> {workshop.location}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        {workshop.meetingUrl && (
          <a
            href={workshop.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ExternalLink className="size-4" /> Подключиться
          </a>
        )}
        {enrollment.canReview && (
          <Button size="sm" onClick={() => onReview(enrollment)}>
            <MessageSquarePlus className="size-4" /> Оставить отзыв
          </Button>
        )}
        {enrollment.review && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-600">
            Ваша оценка <Star className="size-4 fill-amber-400 text-amber-400" /> {enrollment.review.workshopRating}
          </span>
        )}
      </div>
    </article>
  );
}