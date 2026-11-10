import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { CalendarCheck, GraduationCap, Presentation, Star, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import type { WorkshopStatus } from '../../api/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';

const statusRows: { status: WorkshopStatus; label: string; color: string }[] = [
  { status: 'PUBLISHED', label: 'Опубликованы', color: 'bg-emerald-500' },
  { status: 'PENDING_REVIEW', label: 'На модерации', color: 'bg-amber-400' },
  { status: 'COMPLETED', label: 'Завершены', color: 'bg-brand-500' },
  { status: 'DRAFT', label: 'Черновики', color: 'bg-slate-300' },
  { status: 'REJECTED', label: 'Отклонены', color: 'bg-red-400' },
  { status: 'CANCELLED', label: 'Отменены', color: 'bg-slate-400' },
];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 ring-1 ring-slate-200">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-sm font-semibold text-ink-600">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}

export function StatsTab() {
  const { data, isPending, isError, error } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats });

  if (isPending) return <Spinner />;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  const totalWorkshops = Object.values(data.workshopsByStatus).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={GraduationCap} label="Участников" value={String(data.usersByRole.PARTICIPANT ?? 0)} />
        <StatCard icon={Presentation} label="Менторов" value={String(data.usersByRole.MENTOR ?? 0)} />
        <StatCard icon={CalendarCheck} label="Записей за 30 дней" value={String(data.enrollmentsLast30Days)} />
        <StatCard
          icon={UserCheck}
          label="Явка"
          value={data.attendanceRate === null ? '—' : `${data.attendanceRate}%`}
          hint="Пришли из отмеченных ментором"
        />
        <StatCard
          icon={Star}
          label="Средняя оценка"
          value={data.reviews.count ? data.reviews.avgRating.toFixed(2) : '—'}
          hint={`По ${data.reviews.count} отзывам`}
        />
        <StatCard icon={UserX} label="Заблокировано" value={String(data.blockedUsers)} />
      </div>

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-bold">Воркшопы по статусам · {totalWorkshops}</h2>
        <div className="flex flex-col gap-3">
          {statusRows.map(({ status, label, color }) => {
            const count = data.workshopsByStatus[status] ?? 0;
            return (
              <div key={status} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-sm">
                <span className="font-semibold text-ink-600">{label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: totalWorkshops ? `${(count / totalWorkshops) * 100}%` : 0 }}
                  />
                </div>
                <span className="text-right font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}