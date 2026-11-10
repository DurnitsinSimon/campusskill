import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, MessageSquare, UserX, X } from 'lucide-react';
import { mentorApi } from '../../api/mentor';
import { getErrorMessage } from '../../api/client';
import type { EnrollmentStatus, Participant } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { EnrollmentStatusBadge } from '../../components/workshops/EnrollmentStatusBadge';
import { formatDateTime } from '../../lib/format';

type Action = 'ATTENDED' | 'NO_SHOW' | 'REJECTED';

const groups: { title: string; statuses: EnrollmentStatus[] }[] = [
  { title: 'Участники', statuses: ['CONFIRMED', 'ATTENDED', 'NO_SHOW'] },
  { title: 'Лист ожидания', statuses: ['WAITLISTED'] },
  { title: 'Отменили или отклонены', statuses: ['CANCELLED', 'REJECTED'] },
];

interface RowProps {
  participant: Participant;
  hasStarted: boolean;
  onAction: (enrollmentId: number, action: Action) => void;
  pendingId?: number;
}

function ParticipantRow({ participant, hasStarted, onAction, pendingId }: RowProps) {
  const { user, status } = participant;
  const isPending = pendingId === participant.id;
  const canMark = hasStarted && (status === 'CONFIRMED' || status === 'NO_SHOW');
  const canReject = !hasStarted && (status === 'CONFIRMED' || status === 'WAITLISTED');

  return (
    <li className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} />
        <div className="min-w-0">
          <p className="font-semibold">
            {status === 'WAITLISTED' && <span className="mr-1.5 text-amber-600">#{participant.waitlistPosition}</span>}
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-ink-400">
            {[user.university, user.course && `${user.course} курс`, user.email].filter(Boolean).join(' · ')}
          </p>
          {participant.comment && (
            <p className="mt-1 inline-flex items-start gap-1.5 text-xs text-ink-600">
              <MessageSquare className="mt-0.5 size-3 shrink-0" /> {participant.comment}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <EnrollmentStatusBadge status={status} />
        {canMark && (
          <>
            <Button size="sm" isLoading={isPending} onClick={() => onAction(participant.id, 'ATTENDED')}>
              <Check className="size-4" /> Пришёл
            </Button>
            {status === 'CONFIRMED' && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() => onAction(participant.id, 'NO_SHOW')}
              >
                <X className="size-4" /> Не пришёл
              </Button>
            )}
          </>
        )}
        {canReject && (
          <Button size="sm" variant="danger" isLoading={isPending} onClick={() => onAction(participant.id, 'REJECTED')}>
            <UserX className="size-4" /> Отклонить
          </Button>
        )}
      </div>
    </li>
  );
}

export function ParticipantsPage() {
  const workshopId = Number(useParams().id);
  const queryClient = useQueryClient();

  const workshop = useQuery({
    queryKey: ['mentor-workshop', workshopId],
    queryFn: () => mentorApi.workshop(workshopId),
  });
  const participants = useQuery({
    queryKey: ['mentor-participants', workshopId],
    queryFn: () => mentorApi.participants(workshopId),
  });

  const action = useMutation({
    mutationFn: ({ enrollmentId, status }: { enrollmentId: number; status: Action }) =>
      mentorApi.updateParticipant(workshopId, enrollmentId, status),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mentor-participants', workshopId] }),
        queryClient.invalidateQueries({ queryKey: ['mentor-workshops'] }),
      ]),
  });

  if (workshop.isPending || participants.isPending) return <Spinner />;
  if (workshop.isError) return <Alert>{getErrorMessage(workshop.error)}</Alert>;
  if (participants.isError) return <Alert>{getErrorMessage(participants.error)}</Alert>;

  const hasStarted = new Date(workshop.data.startsAt) <= new Date();
  const list = participants.data;
  const confirmed = list.filter((p) => p.status === 'CONFIRMED' || p.status === 'ATTENDED').length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <ButtonLink to="/me?tab=workshops" variant="ghost" size="sm" className="-ml-3 self-start">
        <ArrowLeft className="size-4" /> Мои воркшопы
      </ButtonLink>

      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{workshop.data.title}</h1>
        <p className="mt-1 text-ink-600">
          {formatDateTime(workshop.data.startsAt)} · участников {confirmed} из {workshop.data.capacity}
        </p>
      </div>

      <p className="rounded-2xl bg-brand-50 px-5 py-4 text-sm text-brand-700">
        {hasStarted
          ? 'Воркшоп начался — отметьте, кто пришёл. Посетившие получат прогресс по навыкам и смогут оставить отзыв.'
          : 'До начала воркшопа можно отклонить заявку. Освободившееся место автоматически получит первый из листа ожидания.'}
      </p>

      {action.isError && <Alert>{getErrorMessage(action.error)}</Alert>}

      {groups.map(({ title, statuses }) => {
        const items = list.filter((p) => statuses.includes(p.status));
        if (items.length === 0) return null;
        return (
          <section key={title} className="flex flex-col gap-3">
            <h2 className="font-bold">
              {title} <span className="text-ink-400">· {items.length}</span>
            </h2>
            <ul className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
              {items.map((participant) => (
                <ParticipantRow
                  key={participant.id}
                  participant={participant}
                  hasStarted={hasStarted}
                  pendingId={action.isPending ? action.variables?.enrollmentId : undefined}
                  onAction={(enrollmentId, status) => action.mutate({ enrollmentId, status })}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {list.length === 0 && <p className="text-ink-600">На воркшоп пока никто не записался.</p>}
    </div>
  );
}