import { Link, Outlet } from 'react-router';
import { GraduationCap } from 'lucide-react';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-ink-900">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="size-5" />
            </span>
            CampusSkill
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}