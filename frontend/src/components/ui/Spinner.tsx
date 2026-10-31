import { Loader2 } from 'lucide-react';

export function Spinner({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ink-400" role="status">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}