import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Eye, Pencil, Plus, Presentation, Send, Star, Users, XCircle } from 'lucide-react';
import { mentorApi } from '../../api/mentor';
import { getErrorMessage } from '../../api/client';
import type { MentorWorkshop } from '../../api/types';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { WorkshopStatusBadge } from '../../components/workshops/workshopStatusBadge';
import { formatDateTime } from '../../lib/format';

function MentorWorkshopCard({ workshop }: { workshop: MentorWorkshop }) {
  const queryClient = useQueryClient();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mentor-workshops'] }),
      queryClient.invalidateQueries({ queryKey: ['workshops'] }),
    ]);

  const submit = useMutation({ mutationFn: () => mentorApi.submit(workshop.id), onSuccess: refresh });
  const cancel = useMutation({ mutationFn: () => mentorApi.cancel(workshop.id), onSuccess: refresh });
  const error = submit.error ?? cancel.error;

  const isEditable = workshop.status === 'DRAFT' || workshop.status === 'REJECTED';
  const isUpcoming = new Date(workshop.startsAt) > new Date();
  const isPublic = ['PUBLISHED', 'COMPLETED', 'CANCELLED'].includes(workshop.status);
  const hasParticipants = isPublic && workshop.status !== 'CANCELLED';
  const canCancel = workshop.status === 'PUBLISHED' && isUpcoming;
  const hasActions = isEditable || isPublic;

  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <WorkshopStatusBadge status={workshop.status} />
          <h3 className="text-lg font-bold">{workshop.title}</h3>
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-600">
            <CalendarDays className="size-4 text-ink-400" /> {formatDateTime(workshop.startsAt)}
          </p>
        </div>
        {hasParticipants && (
          <div className="flex shrink-0 gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Users className="size-4 text-brand-600" /> {workshop.confirmedCount}/{workshop.capacity}
            </span>
            {workshop.waitlistCount > 0 && (
              <span className="font-semibold text-amber-700">+{workshop.waitlistCount} в очереди</span>
            )}
            {workshop.reviewsCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="size-4 fill-amber-400 text-amber-400" /> {workshop.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>

      {workshop.status === 'REJECTED' && workshop.rejectionReason && (
        <Alert>
          <span className="font-bold">Причина отклонения:</span> {workshop.rejectionReason}
        </Alert>
      )}
      {workshop.status === 'PENDING_REVIEW' && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Администратор проверяет воркшоп. После публикации он появится в каталоге.
        </p>
      )}
      {error && <Alert>{getErrorMessage(error)}</Alert>}

      {hasActions && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {isEditable && (
            <>
              <ButtonLink to={`/mentor/workshops/${workshop.id}/edit`} variant="secondary" size="sm">
                <Pencil className="size-4" /> Редактировать
              </ButtonLink>
              <Button size="sm" isLoading={submit.isPending} onClick={() => submit.mutate()}>
                <Send className="size-4" /> Отправить на модерацию
              </Button>
            </>
          )}
          {hasParticipants && (
            <ButtonLink to={`/mentor/workshops/${workshop.id}/participants`} size="sm">
              <Users className="size-4" /> Участники
            </ButtonLink>
          )}
          {isPublic && (
            <ButtonLink to={`/workshops/${workshop.slug}`} variant="ghost" size="sm">
              <Eye className="size-4" /> Страница воркшопа
            </ButtonLink>
          )}
          {canCancel && !isConfirmingCancel && (
            <Button variant="danger" size="sm" className="sm:ml-auto" onClick={() => setIsConfirmingCancel(true)}>
              <XCircle className="size-4" /> Отменить
            </Button>
          )}
        </div>
      )}

      {isConfirmingCancel && (
        <div className="flex flex-col gap-3 rounded-2xl bg-red-50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-semibold text-red-800">
            Отменить воркшоп? Все {workshop.confirmedCount + workshop.waitlistCount} записи будут аннулированы,
            участники получат уведомление.
          </p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" isLoading={cancel.isPending} onClick={() => cancel.mutate()}>
              Да, отменить
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsConfirmingCancel(false)}>
              Нет
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

export function MentorWorkshopsTab() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['mentor-workshops'],
    queryFn: mentorApi.workshops,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-600">Черновики, воркшопы на модерации и опубликованные.</p>
        <ButtonLink to="/mentor/workshops/new" size="sm">
          <Plus className="size-4" /> Новый воркшоп
        </ButtonLink>
      </div>

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Presentation}
          title="Вы ещё не создали ни одного воркшопа"
          description="Поделитесь тем, что умеете: от вёрстки до выпечки."
          action={<ButtonLink to="/mentor/workshops/new">Создать воркшоп</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((workshop) => (
            <MentorWorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}
    </div>
  );
}