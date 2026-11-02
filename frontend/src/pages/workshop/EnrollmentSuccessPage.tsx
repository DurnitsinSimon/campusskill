import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ExternalLink, Hourglass, MapPin } from 'lucide-react';
import { workshopsApi } from '../../api/workshops';
import { enrollmentsApi } from '../../api/enrollments';
import { ButtonLink } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { formatDateTime, formatDuration } from '../../lib/format';
import { cn } from '../../lib/cn';

export function EnrollmentSuccessPage() {
  const { slug = '' } = useParams();
  const workshopQuery = useQuery({ queryKey: ['workshop', slug], queryFn: () => workshopsApi.bySlug(slug) });
  const workshopId = workshopQuery.data?.id;

  const { data: enrollment, isPending } = useQuery({
    queryKey: ['enrollment', workshopId],
    queryFn: () => enrollmentsApi.forWorkshop(workshopId!),
    enabled: !!workshopId,
  });

  if (workshopQuery.isPending || isPending) return <Spinner />;
  if (!enrollment) return null;

  const { workshop } = enrollment;
  const isConfirmed = enrollment.status === 'CONFIRMED';

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 text-center">
      <span
        className={cn(
          'flex size-20 items-center justify-center rounded-full',
          isConfirmed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600',
        )}
      >
        {isConfirmed ? <CheckCircle2 className="size-10" /> : <Hourglass className="size-10" />}
      </span>

      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {isConfirmed ? 'Вы записаны!' : 'Вы в листе ожидания'}
        </h1>
        <p className="mt-2 text-ink-600">
          {isConfirmed
            ? 'Мы отправили подтверждение в уведомления и напомним о воркшопе за день до начала.'
            : `Ваша позиция в очереди — ${enrollment.waitlistPosition}. Если место освободится, запись подтвердится автоматически.`}
        </p>
      </div>

      <div className="w-full rounded-3xl bg-white p-5 text-left ring-1 ring-slate-200 sm:p-6">
        <p className="text-xs font-bold tracking-wide text-ink-400 uppercase">Воркшоп</p>
        <p className="mt-1 text-lg font-bold">{workshop.title}</p>
        <p className="text-sm text-ink-600">Ментор: {workshop.mentorName}</p>
        <div className="mt-4 flex flex-col gap-2 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 text-brand-600" />
            {formatDateTime(workshop.startsAt)} · {formatDuration(workshop.durationMinutes)}
          </span>
          {workshop.location && (
            <span className="inline-flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {workshop.location}
            </span>
          )}
          {workshop.meetingUrl && (
            <a
              href={workshop.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
            >
              <ExternalLink className="size-4" /> Ссылка на онлайн-встречу
            </a>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <ButtonLink to="/me" size="lg" className="flex-1">
          Мои записи
        </ButtonLink>
        <ButtonLink to="/" variant="secondary" size="lg" className="flex-1">
          Вернуться в каталог
        </ButtonLink>
      </div>
    </div>
  );
}