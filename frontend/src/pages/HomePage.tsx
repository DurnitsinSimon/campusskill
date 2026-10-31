import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { user } = useAuth();
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold">{user ? `Привет, ${user.firstName}!` : 'Каталог появится на следующем шаге'}</h1>
    </div>
  );
}