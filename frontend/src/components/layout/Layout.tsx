import { Link, NavLink, Outlet } from 'react-router';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ButtonLink } from '../ui/Button';
import { UserMenu } from './UserMenu';
import { cn } from '../../lib/cn';

export function Layout() {
  const { user, isLoading } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:text-ink-900',
    );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <GraduationCap className="size-5" />
              </span>
              <span className="hidden sm:inline">CampusSkill</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navClass}>
                Каталог
              </NavLink>
            </nav>
          </div>

          {!isLoading &&
            (user ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex items-center gap-2">
                <ButtonLink to="/login" variant="ghost" size="sm">
                  Войти
                </ButtonLink>
                <span className="hidden sm:block">
                  <ButtonLink to="/register" size="sm">
                    Регистрация
                  </ButtonLink>
                </span>
              </div>
            ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-ink-400">
        CampusSkill — платформа обмена навыками и воркшопов
      </footer>
    </div>
  );
}