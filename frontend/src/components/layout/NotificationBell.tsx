import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff } from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { formatRelative } from '../../lib/format';
import { cn } from '../../lib/cn';

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 60_000,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen]);

  const unread = data?.unreadCount ?? 0;
  const items = data?.items.slice(0, 6) ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-xl p-2 text-ink-600 hover:bg-slate-100 hover:text-ink-900"
        aria-label={unread ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления'}
        aria-expanded={isOpen}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-bold">Уведомления</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Прочитать все
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-sm text-ink-400">
              <BellOff className="size-6" />
              Пока уведомлений нет
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.workshop ? `/workshops/${item.workshop.slug}` : '/me?tab=notifications'}
                    onClick={() => {
                      if (!item.isRead) markRead.mutate(item.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50',
                      !item.isRead && 'bg-brand-50/50',
                    )}
                  >
                    <span
                      className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.isRead ? 'bg-transparent' : 'bg-brand-500')}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="line-clamp-2 text-xs text-ink-600">{item.body}</p>
                      <p className="mt-1 text-xs text-ink-400">{formatRelative(item.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/me?tab=notifications"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-center text-sm font-semibold text-brand-600 hover:bg-slate-50"
          >
            Все уведомления
          </Link>
        </div>
      )}
    </div>
  );
}