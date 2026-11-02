import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { WorkshopFilters, WorkshopSort } from '../api/workshops';
import type { SkillLevel, WorkshopFormat } from '../api/types';


export function useCatalogFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<WorkshopFilters>(
    () => ({
      search: params.get('search') ?? undefined,
      category: params.get('category') ?? undefined,
      skills: params.get('skills')?.split(',').filter(Boolean) ?? [],
      format: (params.get('format') as WorkshopFormat) ?? undefined,
      level: (params.get('level') as SkillLevel) ?? undefined,
      price: (params.get('price') as 'free' | 'paid') ?? undefined,
      dateFrom: params.get('dateFrom') ?? undefined,
      dateTo: params.get('dateTo') ?? undefined,
      minRating: params.get('minRating') ? Number(params.get('minRating')) : undefined,
      hasSeats: params.get('hasSeats') === 'true',
      sort: (params.get('sort') as WorkshopSort) ?? 'date',
      page: Number(params.get('page') ?? 1),
    }),
    [params],
  );

  
  const updateFilters = useCallback(
    (patch: Partial<WorkshopFilters>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            const serialized = Array.isArray(value) ? value.join(',') : value;
            if (serialized === undefined || serialized === '' || serialized === false) next.delete(key);
            else next.set(key, String(serialized));
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: 'search' in patch },
      );
    },
    [setParams],
  );

  const setFilter = useCallback(
    <K extends keyof WorkshopFilters>(key: K, value: WorkshopFilters[K]) => updateFilters({ [key]: value }),
    [updateFilters],
  );

  const resetFilters = useCallback(() => setParams({}), [setParams]);

  const activeCount = [
    filters.category,
    filters.skills?.length,
    filters.format,
    filters.level,
    filters.price,
    filters.dateFrom || filters.dateTo,
    filters.minRating,
    filters.hasSeats,
  ].filter(Boolean).length;

  return { filters, setFilter, updateFilters, resetFilters, activeCount };
}