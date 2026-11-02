import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { workshopsApi, type WorkshopSort } from '../../api/workshops';
import { getErrorMessage } from '../../api/client';
import { useCatalogFilters } from '../../hooks/useCatalogFilters';
import { WorkshopCard } from '../../components/workshops/WorkshopCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { pluralize } from '../../lib/format';
import { cn } from '../../lib/cn';
import { CatalogFilters } from './CatalogFilters';
import { SearchInput } from './SearchInput';

const sortOptions: { value: WorkshopSort; label: string }[] = [
  { value: 'date', label: 'Сначала ближайшие' },
  { value: 'popular', label: 'Популярные' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Сначала дешёвые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
];

export function CatalogPage() {
  const { filters, setFilter, updateFilters, resetFilters, activeCount } = useCatalogFilters();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data, isPending, isError, error, isPlaceholderData } = useQuery({
    queryKey: ['workshops', filters],
    queryFn: () => workshopsApi.list(filters),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    document.body.style.overflow = isFiltersOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFiltersOpen]);

  const handlePageChange = (page: number) => {
    setFilter('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">Воркшопы от студентов</h1>
        <p className="mt-1.5 text-ink-600">Учитесь у однокурсников: программирование, дизайн, языки, музыка и кулинария.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={filters.search ?? ''} onSearch={(value) => setFilter('search', value)} />
        <div className="flex gap-3">
          <Button variant="secondary" className="h-12 lg:hidden" onClick={() => setIsFiltersOpen(true)}>
            <SlidersHorizontal className="size-4" />
            Фильтры
            {activeCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                {activeCount}
              </span>
            )}
          </Button>
          <Select
            className="flex-1 sm:w-52 [&_select]:h-12"
            options={sortOptions}
            value={filters.sort}
            onChange={(event) => setFilter('sort', event.target.value as WorkshopSort)}
            aria-label="Сортировка"
          />
        </div>
      </div>

      <div className="flex gap-8">
        <aside
          className={cn(
            'lg:sticky lg:top-24 lg:block lg:h-fit lg:w-72 lg:shrink-0',
            isFiltersOpen ? 'fixed inset-0 z-40 flex' : 'hidden',
          )}
        >
          <div className="absolute inset-0 bg-ink-900/40 lg:hidden" onClick={() => setIsFiltersOpen(false)} />
          <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white lg:h-auto lg:max-w-none lg:rounded-3xl lg:ring-1 lg:ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold">Фильтры</h2>
              <div className="flex items-center gap-1">
                {activeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Сбросить
                  </Button>
                )}
                <button
                  type="button"
                  className="rounded-lg p-2 text-ink-400 hover:bg-slate-100 lg:hidden"
                  onClick={() => setIsFiltersOpen(false)}
                  aria-label="Закрыть фильтры"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <CatalogFilters filters={filters} setFilter={setFilter} updateFilters={updateFilters} />
            </div>
            <div className="border-t border-slate-100 p-4 lg:hidden">
              <Button className="w-full" size="lg" onClick={() => setIsFiltersOpen(false)}>
                Показать {data?.total ?? ''} {pluralize(data?.total ?? 0, ['воркшоп', 'воркшопа', 'воркшопов'])}
              </Button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1" aria-live="polite">
          {isPending ? (
            <Spinner label="Загружаем воркшопы…" />
          ) : isError ? (
            <Alert>{getErrorMessage(error)}</Alert>
          ) : data.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Ничего не нашлось"
              description="Попробуйте изменить запрос или убрать часть фильтров."
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              }
            />
          ) : (
            <div className={cn('flex flex-col gap-6 transition-opacity', isPlaceholderData && 'opacity-60')}>
              <p className="text-sm font-semibold text-ink-600">
                Найдено {data.total} {pluralize(data.total, ['воркшоп', 'воркшопа', 'воркшопов'])}
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {data.items.map((workshop) => (
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={handlePageChange} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}