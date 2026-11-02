import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workshopsApi, type WorkshopFilters } from '../../api/workshops';
import type { SkillLevel, WorkshopFormat } from '../../api/types';
import { Chip } from '../../components/ui/Chip';
import { Toggle } from '../../components/ui/Toggle';
import { formatLabels, levelLabels } from '../../lib/format';

interface CatalogFiltersProps {
  filters: WorkshopFilters;
  setFilter: <K extends keyof WorkshopFilters>(key: K, value: WorkshopFilters[K]) => void;
  updateFilters: (patch: Partial<WorkshopFilters>) => void;
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-xs font-bold tracking-wide text-ink-400 uppercase">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

const dateInputClass =
  'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none';

export function CatalogFilters({ filters, setFilter, updateFilters }: CatalogFiltersProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: workshopsApi.categories,
    staleTime: 5 * 60_000,
  });

  const visibleSkills =
    categories
      .find((category) => category.slug === filters.category)
      ?.skills.filter((skill) => skill.workshopsCount > 0) ?? [];

  const toggleSkill = (slug: string) => {
    const current = filters.skills ?? [];
    setFilter('skills', current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]);
  };

  return (
    <div className="flex flex-col gap-6">
      <FilterGroup title="Категория">
        <Chip isActive={!filters.category} onClick={() => updateFilters({ category: undefined, skills: [] })}>
          Все
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.slug}
            isActive={filters.category === category.slug}
            onClick={() => updateFilters({ category: category.slug, skills: [] })}
          >
            <span aria-hidden>{category.icon}</span> {category.name}
          </Chip>
        ))}
      </FilterGroup>

      {visibleSkills.length > 0 && (
        <FilterGroup title="Навыки">
          {visibleSkills.map((skill) => (
            <Chip key={skill.slug} isActive={!!filters.skills?.includes(skill.slug)} onClick={() => toggleSkill(skill.slug)}>
              {skill.name}
              <span className="text-xs opacity-60">{skill.workshopsCount}</span>
            </Chip>
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Формат">
        <Chip isActive={!filters.format} onClick={() => setFilter('format', undefined)}>
          Любой
        </Chip>
        {(Object.keys(formatLabels) as WorkshopFormat[]).map((format) => (
          <Chip key={format} isActive={filters.format === format} onClick={() => setFilter('format', format)}>
            {formatLabels[format]}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Стоимость">
        <Chip isActive={!filters.price} onClick={() => setFilter('price', undefined)}>
          Любая
        </Chip>
        <Chip isActive={filters.price === 'free'} onClick={() => setFilter('price', 'free')}>
          Бесплатно
        </Chip>
        <Chip isActive={filters.price === 'paid'} onClick={() => setFilter('price', 'paid')}>
          Платно
        </Chip>
      </FilterGroup>

      <FilterGroup title="Уровень">
        <Chip isActive={!filters.level} onClick={() => setFilter('level', undefined)}>
          Любой
        </Chip>
        {(Object.keys(levelLabels) as SkillLevel[]).map((level) => (
          <Chip key={level} isActive={filters.level === level} onClick={() => setFilter('level', level)}>
            {levelLabels[level]}
          </Chip>
        ))}
      </FilterGroup>

      <section className="flex flex-col gap-2.5">
        <h3 className="text-xs font-bold tracking-wide text-ink-400 uppercase">Даты</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-600">
            С
            <input
              type="date"
              className={dateInputClass}
              value={filters.dateFrom ?? ''}
              onChange={(event) => setFilter('dateFrom', event.target.value || undefined)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-600">
            По
            <input
              type="date"
              className={dateInputClass}
              value={filters.dateTo ?? ''}
              min={filters.dateFrom}
              onChange={(event) => setFilter('dateTo', event.target.value || undefined)}
            />
          </label>
        </div>
      </section>

      <FilterGroup title="Рейтинг">
        <Chip isActive={!filters.minRating} onClick={() => setFilter('minRating', undefined)}>
          Любой
        </Chip>
        {[4, 4.5].map((rating) => (
          <Chip key={rating} isActive={filters.minRating === rating} onClick={() => setFilter('minRating', rating)}>
            от {rating} ★
          </Chip>
        ))}
      </FilterGroup>

      <Toggle
        label="Только со свободными местами"
        checked={!!filters.hasSeats}
        onChange={(checked) => setFilter('hasSeats', checked)}
      />
    </div>
  );
}