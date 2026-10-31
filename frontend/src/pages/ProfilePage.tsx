import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold">Личный кабинет</h1>
      <p className="mt-2 text-ink-600">{user?.email}</p>
    </div>
  );
}