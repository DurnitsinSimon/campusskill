import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellOff, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { getErrorMessage } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { formatRelative } from '../../lib/format';
import { cn } from '../../lib/cn';

export function NotificationsTab() {
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate });

  if (isPending) return <Spinner />;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;
  if (data.items.length === 0) {
    return <EmptyState icon={BellOff} title="Уведомлений пока нет" description="Здесь появятся подтверждения записей, напоминания и ответы менторов." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-600">
          {data.unreadCount > 0 ? `Непрочитанных: ${data.unreadCount}` : 'Все уведомления прочитаны'}
        </p>
        {data.unreadCount > 0 && (
          <Button variant="secondary" size="sm" isLoading={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
            <CheckCheck className="size-4" /> Прочитать все
          </Button>
        )}
      </div>

      <ul className="flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        {data.items.map((item) => (
          <li key={item.id} className={cn('border-b border-slate-100 last:border-0', !item.isRead && 'bg-brand-50/40')}>
            <div className="flex gap-3 px-5 py-4">
              <span className={cn('mt-2 size-2 shrink-0 rounded-full', item.isRead ? 'bg-slate-200' : 'bg-brand-500')} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="font-semibold">{item.title}</p>
                  <span className="text-xs text-ink-400">{formatRelative(item.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-600">{item.body}</p>
                <div className="mt-2 flex gap-4 text-xs font-semibold">
                  {item.workshop && (
                    <Link to={`/workshops/${item.workshop.slug}`} className="text-brand-600 hover:text-brand-700">
                      Открыть воркшоп
                    </Link>
                  )}
                  {!item.isRead && (
                    <button type="button" onClick={() => markRead.mutate(item.id)} className="text-ink-400 hover:text-ink-900">
                      Отметить прочитанным
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}