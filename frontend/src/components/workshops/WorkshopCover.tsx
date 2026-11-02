import { cn } from '../../lib/cn';
import type { SkillTag } from '../../api/types';

const categoryGradients: Record<string, string> = {
  programming: 'from-indigo-500 to-sky-400',
  design: 'from-pink-500 to-orange-300',
  languages: 'from-emerald-500 to-teal-300',
  music: 'from-violet-600 to-fuchsia-400',
  cooking: 'from-amber-500 to-rose-400',
  career: 'from-sky-600 to-cyan-300',
};

interface WorkshopCoverProps {
  id: number;
  coverUrl: string | null;
  skills: SkillTag[];
  className?: string;
}

export function WorkshopCover({ id, coverUrl, skills, className }: WorkshopCoverProps) {
  if (coverUrl) {
    return <img src={coverUrl} alt="" className={cn('object-cover', className)} />;
  }

  const primary = skills.find((skill) => skill.isPrimary) ?? skills[0];
  const gradient = categoryGradients[primary?.category.slug ?? ''] ?? 'from-slate-500 to-slate-300';
  const shift = (id * 37) % 60;

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', gradient, className)} aria-hidden>
      <span
        className="absolute size-40 rounded-full bg-white/15"
        style={{ top: `${-20 - (shift % 30)}%`, right: `${-10 + (shift % 25)}%` }}
      />
      <span
        className="absolute size-24 rounded-full bg-white/10"
        style={{ bottom: `${-15 + (shift % 20)}%`, left: `${5 + shift}%` }}
      />
      <span className="absolute bottom-4 left-4 text-4xl drop-shadow-sm">{primary?.category.icon}</span>
      <span className="absolute top-4 left-4 rounded-full bg-white/25 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
        {primary?.name}
      </span>
    </div>
  );
}