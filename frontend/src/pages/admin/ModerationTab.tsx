import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarDays, Check, Eye, Inbox, MapPin, Sparkles, Star, Users, Video, X } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import type { AdminWorkshop, WorkshopStatus } from '../../api/types';
import { Badge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { WorkshopStatusBadge } from '../../components/workshops/workshopStatusBadge';
import { formatDateTime, formatDuration, formatLabels, formatPrice, levelLabels } from '../../lib/format';
import { ReasonModal } from './ReasonModal';

const statusFilters: { status: WorkshopStatus; label: string }[] = [
  { status: 'PENDING_REVIEW', label: 'На модерации' },
  { status: 'PUBLISHED', label: 'Опубликованные' },
  { status: 'REJECTED', label: 'Отклонённые' },
  { status: 'CANCELLED', label: 'Отменённые' },
  { status: 'COMPLETED', label: 'Завершённые' },
];

type Dialog = 'reject' | 'cancel' | null;

function AdminWorkshopCard({ workshop }: { workshop: AdminWorkshop }) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['workshops'] }),
    ]);

  const approve = useMutation({ mutationFn: () => adminApi.approve(workshop.id), onSuccess: refresh });
  const reject = useMutation({
    mutationFn: (reason: string) => adminApi.reject(workshop.id, reason),
    onSuccess: () => refresh().then(() => setDialog(null)),
  });
  const cancel = useMutation({
    mutationFn: (reason: string) => adminApi.cancel(workshop.id, reason),
    onSuccess: () => refresh().then(() => setDialog(null)),
  });

  const { mentor } = workshop;
  const isPending = workshop.status === 'PENDING_REVIEW';
  const canCancel = workshop.status === 'PUBLISHED' && new Date(workshop.startsAt) > new Date();
  const isPublic = ['PUBLISHED', 'COMPLETED', 'CANCELLED'].includes(workshop.status);
  const programMinutes = workshop.programItems.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0);

  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <WorkshopStatusBadge status={workshop.status} />
        {workshop.isFirstWorkshop && (
          <Badge tone="brand" icon={<Sparkles className="size-3" />}>
            Первый воркшоп ментора
          </Badge>
        )}
        {mentor.isBlocked && <Badge tone="danger">Ментор заблокирован</Badge>}
      </div>

      <div>
        <h3 className="text-lg font-bold">{workshop.title}</h3>
        <p className="mt-1 text-sm text-ink-600">{workshop.shortDescription}</p>
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-ink-400" />
          {formatDateTime(workshop.startsAt)} · {formatDuration(workshop.durationMinutes)}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {workshop.format === 'ONLINE' ? (
            <Video className="size-4 shrink-0 text-ink-400" />
          ) : (
            <MapPin className="size-4 shrink-0 text-ink-400" />
          )}
          <span className="truncate">
            {formatLabels[workshop.format]}: {workshop.format === 'ONLINE' ? workshop.meetingUrl : workshop.location}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0 text-ink-400" />
          {isPublic ? `${workshop.seatsTaken} из ${workshop.capacity}` : `до ${workshop.capacity}`} участников ·{' '}
          {formatPrice(workshop.price)}
        </div>
        <div className="text-ink-600">{levelLabels[workshop.level]}</div>
      </dl>

      <div className="flex flex-wrap gap-1.5">
        {workshop.skills.map((skill) => (
          <Badge key={skill.slug} tone={skill.isPrimary ? 'brand' : 'neutral'}>
            {skill.name}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {mentor.firstName} {mentor.lastName}
          </p>
          <p className="truncate text-xs text-ink-400">
            {mentor.headline} · {mentor.email}
          </p>
        </div>
        {mentor.reviewsCount > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
            <Star className="size-4 fill-amber-400 text-amber-400" /> {mentor.ratingAvg.toFixed(1)}
            <span className="font-normal text-ink-400">({mentor.reviewsCount})</span>
          </span>
        ) : (
          <span className="shrink-0 text-xs text-ink-400">нет отзывов</span>
        )}
      </div>

      <details className="group rounded-2xl ring-1 ring-slate-200">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-brand-600 hover:text-brand-700">
          <span className="group-open:hidden">Показать описание и программу</span>
          <span className="hidden group-open:inline">Скрыть подробности</span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 text-sm">
          <p className="whitespace-pre-line">{workshop.description}</p>
          {workshop.requirements && (
            <p>
              <span className="font-semibold">Что понадобится:</span> {workshop.requirements}
            </p>
          )}
          <div>
            <p className="font-semibold">
              Программа{programMinutes > 0 && ` · ${programMinutes} из ${workshop.durationMinutes} мин`}
            </p>
            <ol className="mt-2 flex flex-col gap-1">
              {workshop.programItems.map((item) => (
                <li key={item.position} className="flex gap-2">
                  <span className="text-ink-400">{item.position}.</span>
                  <span className="flex-1">{item.title}</span>
                  {item.durationMinutes && <span className="text-ink-400">{item.durationMinutes} мин</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </details>

      {workshop.status === 'REJECTED' && workshop.rejectionReason && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-bold">Причина отклонения:</span> {workshop.rejectionReason}
        </p>
      )}
      {approve.isError && <Alert>{getErrorMessage(approve.error)}</Alert>}

      {(isPending || canCancel || isPublic) && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {isPending && (
            <>
              <Button size="sm" isLoading={approve.isPending} onClick={() => approve.mutate()}>
                <Check className="size-4" /> Опубликовать
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDialog('reject')}>
                <X className="size-4" /> Отклонить
              </Button>
            </>
          )}
          {isPublic && (
            <ButtonLink to={`/workshops/${workshop.slug}`} size="sm" variant="ghost">
              <Eye className="size-4" /> Страница воркшопа
            </ButtonLink>
          )}
          {canCancel && (
            <Button size="sm" variant="danger" className="sm:ml-auto" onClick={() => setDialog('cancel')}>
              <Ban className="size-4" /> Снять с публикации
            </Button>
          )}
        </div>
      )}

      {/* окно монтируется только когда открыто — так поле причины каждый раз пустое */}
      {dialog === 'reject' && (
        <ReasonModal
          isOpen
          onClose={() => setDialog(null)}
          title="Отклонить воркшоп"
          description="Ментор увидит причину в уведомлении и в карточке воркшопа. Напишите, что именно исправить."
          confirmLabel="Отклонить"
          isPending={reject.isPending}
          error={reject.isError ? getErrorMessage(reject.error) : undefined}
          onSubmit={(reason) => reject.mutate(reason)}
        />
      )}
      {dialog === 'cancel' && (
        <ReasonModal
          isOpen
          onClose={() => setDialog(null)}
          title="Снять воркшоп с публикации"
          description={`Воркшоп будет отменён, ${workshop.seatsTaken} записей аннулируются. Участники и ментор получат уведомление с причиной.`}
          confirmLabel="Снять с публикации"
          isPending={cancel.isPending}
          error={cancel.isError ? getErrorMessage(cancel.error) : undefined}
          onSubmit={(reason) => cancel.mutate(reason)}
        />
      )}
    </article>
  );
}

export function ModerationTab() {
  const [status, setStatus] = useState<WorkshopStatus>('PENDING_REVIEW');
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['admin-workshops', status],
    queryFn: () => adminApi.workshops(status),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2">
          {statusFilters.map((filter) => (
            <Chip key={filter.status} isActive={status === filter.status} onClick={() => setStatus(filter.status)}>
              {filter.label}
            </Chip>
          ))}
        </div>
      </div>

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status === 'PENDING_REVIEW' ? 'Очередь пуста' : 'Здесь пока ничего нет'}
          description={status === 'PENDING_REVIEW' ? 'Все воркшопы проверены.' : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((workshop) => (
            <AdminWorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}
    </div>
  );
}