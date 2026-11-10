import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { cn } from '../../lib/cn';
import { ModerationTab } from './ModerationTab';
import { StatsTab } from './StatsTab';
import { UsersTab } from './UsersTab';

type TabId = 'moderation' | 'stats' | 'users';

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'moderation', label: 'Модерация', icon: ShieldCheck },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
  { id: 'users', label: 'Пользователи', icon: Users },
];

export function AdminPage() {
  const [params, setParams] = useSearchParams();
  const active = (params.get('tab') as TabId) ?? 'moderation';

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats });
  const pendingCount = stats?.workshopsByStatus.PENDING_REVIEW ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Панель администратора</h1>
        <p className="mt-1 text-ink-600">Проверка воркшопов, пользователи и состояние платформы.</p>
      </div>

      <nav className="-mx-4 overflow-x-auto px-4" aria-label="Разделы панели администратора">
        <div className="flex w-max gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setParams({ tab: id })}
              aria-current={active === id ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
                active === id ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-slate-100',
              )}
            >
              <Icon className="size-4" />
              {label}
              {id === 'moderation' && pendingCount > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs',
                    active === id ? 'bg-white/25' : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {active === 'moderation' && <ModerationTab />}
      {active === 'stats' && <StatsTab />}
      {active === 'users' && <UsersTab />}
    </div>
  );
}