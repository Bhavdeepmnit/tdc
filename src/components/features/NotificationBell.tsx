import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useAppStore } from '@store/useAppStore';
import { ActivityFeed } from '@components/features/ActivityFeed';
import { cn } from '@utils/cn';

/**
 * Header notification bell (mobile). Shows an unread dot when there is recent
 * activity and opens a dropdown with the activity feed. "Read" state is tracked
 * locally — opening the panel clears the dot.
 */
export function NotificationBell() {
  const navigate = useNavigate();
  const count = useAppStore((s) => s.activities.length);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(count);
  const ref = useRef<HTMLDivElement>(null);

  const unread = Math.max(0, count - seen);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) setSeen(count); // mark read on open
      return next;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors duration-fast hover:bg-surface-sidebar hover:text-text-primary"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-surface-bg" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'absolute right-0 top-full z-40 mt-1 w-[min(20rem,calc(100vw-2rem))]',
              'overflow-hidden rounded-lg shadow-float',
            )}
          >
            <ActivityFeed limit={6} className="rounded-b-none border-b-0" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="w-full border-t border-surface-divider bg-surface-card py-2xs text-center text-body-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              View all activity
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
