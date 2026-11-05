import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock, MessageSquareText, Sprout, Target, type LucideIcon } from 'lucide-react';
import { usersApi } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import type { SkillLevel } from '../../api/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { ButtonLink } from '../../components/ui/Button';
import { formatDuration, levelLabels, pluralize } from '../../lib/format';
import { cn } from '../../lib/cn';

const levelSteps: Record<SkillLevel, { from: number; to: number | null }> = {
  BEGINNER: { from: 1, to: 2 },
  INTERMEDIATE: { from: 2, to: 3 },
  ADVANCED: { from: 3, to: null },
};

const levelColors: Record<SkillLevel, string> = {
  BEGINNER: 'bg-sky-400',
  INTERMEDIATE: 'bg-brand-500',
  ADVANCED: 'bg-emerald-500',
};

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xl font-extrabold">{value}</p>
        <p className="text-xs font-medium text-ink-600">{label}</p>
      </div>
    </div>
  );
}

export function ProgressTab() {
  const { data, isPending, isError, error } = useQuery({ queryKey: ['progress'], queryFn: usersApi.progress });

  if (isPending) return <Spinner />;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  const { summary, skills } = data;

  if (skills.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="Прогресс появится после первого воркшопа"
        description="Когда ментор отметит ваше посещение, навыки воркшопа добавятся сюда."
        action={<ButtonLink to="/">Выбрать воркшоп</ButtonLink>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          value={String(summary.workshopsAttended)}
          label={pluralize(summary.workshopsAttended, ['воркшоп посещён', 'воркшопа посещено', 'воркшопов посещено'])}
        />
        <StatCard icon={Clock} value={formatDuration(summary.minutesTotal) || '0 мин'} label="в обучении" />
        <StatCard
          icon={Target}
          value={String(summary.skillsCount)}
          label={pluralize(summary.skillsCount, ['навык', 'навыка', 'навыков'])}
        />
        <StatCard
          icon={MessageSquareText}
          value={String(summary.reviewsCount)}
          label={pluralize(summary.reviewsCount, ['отзыв оставлен', 'отзыва оставлено', 'отзывов оставлено'])}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Навыки</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map(({ skill, level, workshopsCompleted, minutesTotal }) => {
            const step = levelSteps[level];
            const percent = step.to ? Math.min(100, (workshopsCompleted / step.to) * 100) : 100;
            const left = step.to ? step.to - workshopsCompleted : 0;

            return (
              <article key={skill.slug} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" aria-hidden>
                      {skill.category.icon}
                    </span>
                    <div>
                      <p className="font-bold">{skill.name}</p>
                      <p className="text-xs text-ink-400">{skill.category.name}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
                    {levelLabels[level]}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full', levelColors[level])} style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-ink-600">
                  {workshopsCompleted} {pluralize(workshopsCompleted, ['воркшоп', 'воркшопа', 'воркшопов'])} ·{' '}
                  {formatDuration(minutesTotal)}
                  {left > 0 && ` · до следующего уровня ещё ${left}`}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}