import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function HomePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string }>('/health').then((r) => r.data),
  });

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold">Каркас готов</h1>
      <p className="mt-2 text-ink-600">
        Бэкенд: {isPending ? 'проверяю…' : isError ? 'недоступен' : data?.status}
      </p>
    </div>
  );
}