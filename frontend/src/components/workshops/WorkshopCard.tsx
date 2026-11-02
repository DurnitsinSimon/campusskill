import { Link } from 'react-router';
import { CalendarDays, Clock, MapPin, MonitorPlay, Star, Users } from 'lucide-react';
import type { WorkshopListItem } from '../../api/types';
import { formatDateTime, formatDuration, formatPrice, pluralize } from '../../lib/format';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { WorkshopCover } from './WorkshopCover';

function SeatsInfo({ seatsLeft }: { seatsLeft: number }) {
  if (seatsLeft === 0) {
    return <Badge tone="warning">Мест нет · лист ожидания</Badge>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600">
      <Users className="size-3.5" />
      {seatsLeft <= 3 ? 'Осталось' : 'Свободно'} {seatsLeft} {pluralize(seatsLeft, ['место', 'места', 'мест'])}
    </span>
  );
}

export function WorkshopCard({ workshop }: { workshop: WorkshopListItem }) {
  const { mentor } = workshop;

  return (
    <Link
      to={`/workshops/${workshop.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200"
    >
      <div className="relative">
        <WorkshopCover id={workshop.id} coverUrl={workshop.coverUrl} skills={workshop.skills} className="h-36" />
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Badge tone="dark" icon={workshop.format === 'ONLINE' ? <MonitorPlay className="size-3" /> : <MapPin className="size-3" />}>
            {workshop.format === 'ONLINE' ? 'Онлайн' : 'Офлайн'}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-brand-700">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDateTime(workshop.startsAt)}
          </span>
          <span className="inline-flex items-center gap-1 text-ink-400">
            <Clock className="size-3.5" />
            {formatDuration(workshop.durationMinutes)}
          </span>
        </div>

        <h3 className="line-clamp-2 text-base leading-snug font-bold group-hover:text-brand-700">{workshop.title}</h3>
        <p className="line-clamp-2 text-sm text-ink-600">{workshop.shortDescription}</p>

        <div className="mt-auto flex items-center gap-2.5 pt-2">
          <Avatar firstName={mentor.firstName} lastName={mentor.lastName} src={mentor.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {mentor.firstName} {mentor.lastName}
            </p>
            <p className="truncate text-xs text-ink-400">{mentor.headline}</p>
          </div>
          {mentor.ratingAvg > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold" title="Рейтинг ментора">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {mentor.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <SeatsInfo seatsLeft={workshop.seatsLeft} />
          <span className="shrink-0 text-base font-extrabold">{formatPrice(workshop.price)}</span>
        </div>
      </div>
    </Link>
  );
}