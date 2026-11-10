import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, LockOpen, Users } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import type { AdminUser, Role } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../catalog/SearchInput';
import { formatDate, pluralize } from '../../lib/format';

const roleLabels: Record<Role, string> = { PARTICIPANT: 'Участник', MENTOR: 'Ментор', ADMIN: 'Администратор' };

const roleFilter = [
  { value: '', label: 'Все роли' },
  { value: 'PARTICIPANT', label: 'Участники' },
  { value: 'MENTOR', label: 'Менторы' },
  { value: 'ADMIN', label: 'Администраторы' },
];

function UserRow({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
    ]);

  const block = useMutation({
    mutationFn: () => adminApi.setBlocked(user.id, !user.isBlocked),
    onSuccess: async (data) => {
      setIsConfirming(false);
      const parts = [
        data.cancelledEnrollments &&
          `${data.cancelledEnrollments} ${pluralize(data.cancelledEnrollments, ['запись', 'записи', 'записей'])}`,
        data.cancelledWorkshops &&
          `${data.cancelledWorkshops} ${pluralize(data.cancelledWorkshops, ['воркшоп', 'воркшопа', 'воркшопов'])}`,
      ].filter(Boolean);
      setResult(
        data.isBlocked ? `Заблокирован${parts.length ? `. Отменено: ${parts.join(', ')}` : ''}` : 'Разблокирован',
      );
      await refresh();
    },
  });

  const role = useMutation({
    mutationFn: (next: Role) => adminApi.changeRole(user.id, next),
    onSuccess: () => {
      setResult(null);
      return refresh();
    },
  });

  const error = block.error ?? role.error;
  const isAdmin = user.role === 'ADMIN';

  return (
    <li className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {user.firstName} {user.lastName}
              {user.isBlocked && <Badge tone="danger">Заблокирован</Badge>}
            </p>
            <p className="truncate text-xs text-ink-400">
              {[user.email, user.university, `с ${formatDate(user.createdAt)}`].filter(Boolean).join(' · ')}
            </p>
            <p className="text-xs text-ink-600">
              {user.role === 'MENTOR'
                ? `Воркшопов: ${user.workshopsCount}${user.mentorRating ? ` · рейтинг ${user.mentorRating.toFixed(1)}` : ''}`
                : `Записей: ${user.enrollmentsCount}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isAdmin ? (
            <Badge tone="brand">{roleLabels.ADMIN}</Badge>
          ) : (
            <>
              <Select
                aria-label="Роль"
                className="w-36"
                value={user.role}
                disabled={role.isPending}
                onChange={(e) => role.mutate(e.target.value as Role)}
                options={[
                  { value: 'PARTICIPANT', label: roleLabels.PARTICIPANT },
                  { value: 'MENTOR', label: roleLabels.MENTOR },
                ]}
              />
              {!isConfirming && (
                <Button
                  size="sm"
                  variant={user.isBlocked ? 'secondary' : 'danger'}
                  isLoading={block.isPending}
                  onClick={() => (user.isBlocked ? block.mutate() : setIsConfirming(true))}
                >
                  {user.isBlocked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
                  {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isConfirming && (
        <div className="flex flex-col gap-3 rounded-2xl bg-red-50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-semibold text-red-800">
            {user.role === 'MENTOR'
              ? 'Ментор не сможет войти. Его предстоящие воркшопы будут отменены, участники получат уведомление.'
              : 'Пользователь не сможет войти. Его записи на предстоящие воркшопы будут отменены, места перейдут к листу ожидания.'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="danger" isLoading={block.isPending} onClick={() => block.mutate()}>
              Заблокировать
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsConfirming(false)}>
              Отмена
            </Button>
          </div>
        </div>
      )}
      {result && <Alert tone="success">{result}</Alert>}
      {error && <Alert>{getErrorMessage(error)}</Alert>}
    </li>
  );
}

export function UsersTab() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [page, setPage] = useState(1);

  const { data, isPending, isError, error, isPlaceholderData } = useQuery({
    queryKey: ['admin-users', { search, role, page }],
    queryFn: () => adminApi.users({ search, role: role || undefined, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          placeholder="Имя, фамилия или email"
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Роль"
          className="sm:w-48"
          value={role}
          options={roleFilter}
          onChange={(e) => {
            setRole(e.target.value as Role | '');
            setPage(1);
          }}
        />
      </div>

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : data.items.length === 0 ? (
        <EmptyState icon={Users} title="Никого не нашли" description="Попробуйте изменить запрос или роль." />
      ) : (
        <>
          <p className="text-sm font-semibold text-ink-600">
            Найдено: {data.total} {pluralize(data.total, ['пользователь', 'пользователя', 'пользователей'])}
          </p>
          <ul
            className={`overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {data.items.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </ul>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}