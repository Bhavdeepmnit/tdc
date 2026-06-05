import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV_ITEMS } from './navItems';
import { cn } from '@utils/cn';

/**
 * Mobile bottom navigation (visible <768px; hidden on md+).
 * Respects the iOS/Android home-indicator safe area via `pb-safe-bottom`.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 md:hidden',
        'border-t border-surface-divider bg-surface-card/95 backdrop-blur',
        'pb-safe-bottom',
      )}
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-0.5 py-2xs text-caption transition-colors duration-fast',
                  isActive ? 'text-brand-600' : 'text-text-secondary hover:text-text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Sliding active indicator — animates between tabs via shared layoutId. */}
                  {isActive && (
                    <motion.span
                      layoutId="bottomNavIndicator"
                      className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand-600"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.4 : 2}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
