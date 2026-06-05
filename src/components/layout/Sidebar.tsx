import { NavLink } from 'react-router-dom';
import { HeartHandshake, LogOut } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '@hooks/useAuth';
import { Avatar } from '@components/ui/Avatar';
import { cn } from '@utils/cn';

/**
 * Desktop sidebar navigation (visible lg+; hidden below).
 * Fixed-width rail with brand header, nav links, and the current user + logout.
 */
export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      aria-label="Sidebar"
      className="hidden w-64 shrink-0 flex-col border-r border-surface-divider bg-surface-sidebar lg:flex"
    >
      {/* Brand */}
      <div className="flex items-center gap-2xs px-sm py-md">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-text-inverse">
          <HeartHandshake className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="font-display text-h4 font-semibold text-text-primary">TDC</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2xs">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2xs rounded-lg px-2xs py-2xs text-body transition-colors duration-fast',
                    isActive
                      ? 'bg-brand-50 font-medium text-brand-600'
                      : 'text-text-secondary hover:bg-surface-card hover:text-text-primary',
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-surface-divider p-2xs">
        <div className="flex items-center gap-2xs rounded-lg px-2xs py-2xs">
          <Avatar name={user?.fullName ?? 'User'} src={user?.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-medium text-text-primary">{user?.fullName}</p>
            <p className="truncate text-caption text-text-secondary">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => void logout()}
          className="mt-1 flex w-full items-center gap-2xs rounded-lg px-2xs py-2xs text-body-sm text-text-secondary transition-colors duration-fast hover:bg-surface-card hover:text-status-error-base"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
