import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, Hourglass, MapPin, MonitorPlay } from 'lucide-react';
import { enrollmentsApi } from '../../api/enrollments';
import { getErrorMessage } from '../../api/client';
import type { WorkshopDetails } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Textarea } from '../../components/ui/Textarea';
import { formatPrice, pluralize } from '../../lib/format';
import { cn } from '../../lib/cn';

export function EnrollPanel({ workshop }: { workshop: WorkshopDetails }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const enrollmentQuery = useQuery({
    queryKey: ['enrollment', workshop.id],
    queryFn: () => enrollmentsApi.forWorkshop(workshop.id),
    enabled: !!user,
  });
  const enrollment = enrollmentQuery.data;

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['enrollment', workshop.id] }),
      queryClient.invalidateQueries({ queryKey: ['workshop', workshop.slug] }),
      queryClient.invalidateQueries({ queryKey: ['workshops'] }),
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);

  const enroll = useMutation({
    mutationFn: () => enrollmentsApi.enroll({ workshopId: workshop.id, comment: comment.trim() || undefined }),
    onSuccess: async () => {
      await refresh();
      navigate(`/workshops/${workshop.slug}/enrolled`);
    },
  });

  const cancel = useMutation({
    mutationFn: () => enrollmentsApi.cancel(enrollment!.id),
    onSuccess: async () => {
      setIsConfirmingCancel(false);
      await refresh();
    },
  });

  const isUpcoming = new Date(workshop.startsAt) > new Date();
  const isOpen = workshop.status === 'PUBLISHED' && isUpcoming;
  const isOwn = user?.mentorProfile?.id === workshop.mentor.id;
  const isActive = enrollment?.status === 'CONFIRMED' || enrollment?.status === 'WAITLISTED';
  const fillPercent = Math.min(100, Math.round((workshop.seatsTaken / workshop.capacity) * 100));

  const renderAction = () => {
    if (!isOpen) {
      const text = workshop.status === 'CANCELLED' ? 'Воркшоп отменён ментором' : 'Воркшоп уже прошёл';
      return <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-ink-600">{text}</p>;
    }
    if (!user) {
      return (
        <ButtonLink to="/login" state={{ from: location }} size="lg" className="w-full">
          Войти и записаться
        </ButtonLink>
      );
    }
    if (isOwn) {
      return <p className="rounded-xl bg-brand-50 px-4 py-3 text-center text-sm font-semibold text-brand-700">Это ваш воркшоп</p>;
    }
    if (enrollmentQuery.isPending) return null;

    if (enrollment?.status === 'REJECTED') {
      return <Alert>Ментор отклонил вашу заявку на этот воркшоп.</Alert>;
    }

    if (isActive) {
      const isConfirmed = enrollment.status === 'CONFIRMED';
      return (
        <div className="flex flex-col gap-3">
          <div
            className={cn(
              'flex items-start gap-3 rounded-2xl p-4',
              isConfirmed ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800',
            )}
          >
            {isConfirmed ? <CheckCircle2 className="size-5 shrink-0" /> : <Hourglass className="size-5 shrink-0" />}
            <div className="text-sm">
              <p className="font-bold">{isConfirmed ? 'Вы записаны' : `Вы в листе ожидания: ${enrollment.waitlistPosition}-й`}</p>
              <p className="mt-0.5">
                {isConfirmed
                  ? 'Напомним о воркшопе за день до начала.'
                  : 'Если кто-то отменит запись, место автоматически перейдёт к вам.'}
              </p>
            </div>
          </div>

          {isConfirmed && enrollment.workshop.meetingUrl && (
            <a
              href={enrollment.workshop.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <ExternalLink className="size-4" /> Ссылка на онлайн-встречу
            </a>
          )}

          {isConfirmingCancel ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-semibold">
                {isConfirmed ? 'Освободить место? Его получит первый из листа ожидания.' : 'Покинуть лист ожидания?'}
              </p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" className="flex-1" isLoading={cancel.isPending} onClick={() => cancel.mutate()}>
                  Да, отменить
                </Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setIsConfirmingCancel(false)}>
                  Нет
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setIsConfirmingCancel(true)}>
              Отменить запись
            </Button>
          )}
          {cancel.isError && <Alert>{getErrorMessage(cancel.error)}</Alert>}
        </div>
      );
    }

    const isFull = workshop.seatsLeft === 0;
    return (
      <div className="flex flex-col gap-3">
        <Textarea
          label="Комментарий для ментора"
          placeholder="Например: возьму свой ноутбук"
          hint="Необязательно"
          maxLength={500}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        {enroll.isError && <Alert>{getErrorMessage(enroll.error)}</Alert>}
        <Button size="lg" isLoading={enroll.isPending} onClick={() => enroll.mutate()}>
          {isFull ? 'Встать в лист ожидания' : 'Записаться'}
        </Button>
        {isFull && (
          <p className="text-center text-xs text-ink-600">Все места заняты — вы встанете в очередь</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-extrabold">{formatPrice(workshop.price)}</span>
        {workshop.price > 0 && <span className="text-xs text-ink-400">оплата на месте</span>}
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm font-semibold">
            <span>
              Занято {workshop.seatsTaken} из {workshop.capacity}
            </span>
            <span className={workshop.seatsLeft === 0 ? 'text-amber-600' : 'text-emerald-600'}>
              {workshop.seatsLeft === 0
                ? 'мест нет'
                : `${workshop.seatsLeft} ${pluralize(workshop.seatsLeft, ['место', 'места', 'мест'])}`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full', workshop.seatsLeft === 0 ? 'bg-amber-400' : 'bg-brand-500')}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 text-sm text-ink-600">
        {workshop.format === 'ONLINE' && (
          <span className="inline-flex items-center gap-2">
            <MonitorPlay className="size-4 text-ink-400" />
            Онлайн, ссылка появится после записи
          </span>
        )}
        {workshop.location && (
          <span className="inline-flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-ink-400" />
            {workshop.location}
          </span>
        )}
      </div>

      {renderAction()}
    </div>
  );
}