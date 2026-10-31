import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import type { User } from '../../api/types';

const roleLabels: Record<User['role'], string> = {
  PARTICIPANT: 'Участник',
  MENTOR: 'Ментор',
  ADMIN: 'Администратор',
};

export function UserMenu({ user }: { user: User }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const itemClass =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="sm" />
        <span className="hidden text-sm font-semibold sm:block">{user.firstName}</span>
        <ChevronDown className="size-4 text-ink-400" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200"
        >
          <div className="border-b border-slate-100 px-3 pb-3 pt-1">
            <p className="font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
            <p className="mt-1 text-xs font-semibold text-brand-600">{roleLabels[user.role]}</p>
          </div>
          <div className="pt-2">
            <Link to="/me" className={itemClass} onClick={() => setIsOpen(false)} role="menuitem">
              <LayoutDashboard className="size-4" /> Личный кабинет
            </Link>
            {user.role === 'ADMIN' && (
              <Link to="/admin" className={itemClass} onClick={() => setIsOpen(false)} role="menuitem">
                <ShieldCheck className="size-4" /> Модерация
              </Link>
            )}
            <button type="button" onClick={handleSignOut} className={itemClass} role="menuitem">
              <LogOut className="size-4" /> Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}