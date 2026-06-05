import { memo, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronRight, MapPin, Phone, Eye, PenLine } from 'lucide-react';
import type { CustomerProfile } from '@types';
import { Avatar } from '@components/ui/Avatar';
import { StatusBadge } from '@components/ui/StatusBadge';
import { cn } from '@utils/cn';
import { getAge } from '@utils/date';

/* ──────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ──────────────────────────────────────────────────────────────────── */

export interface ProfileCardProps {
  profile: CustomerProfile;
  /** Stagger index for entrance animation. */
  index?: number;
  /** Show the "online" dot on the avatar. */
  isOnline?: boolean;
  /** "X matches pending" strip text. */
  pendingMatches?: number;
  className?: string;
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Animation variants                                                 */
/* ──────────────────────────────────────────────────────────────────── */

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.05, 0.4), // cap total stagger at 400ms
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

/* ──────────────────────────────────────────────────────────────────── */
/*  Quick Action Sheet                                                 */
/* ──────────────────────────────────────────────────────────────────── */

interface QuickAction {
  icon: typeof Eye;
  label: string;
  action: () => void;
}

function QuickActionSheet({
  actions,
  onClose,
}: {
  actions: QuickAction[];
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 rounded-t-sheet bg-surface-card',
          'px-xs pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3xs shadow-float',
        )}
      >
        <div className="mx-auto mb-xs h-1.5 w-12 rounded-full bg-surface-divider" />
        <ul className="space-y-1">
          {actions.map((a) => (
            <li key={a.label}>
              <button
                type="button"
                onClick={() => {
                  a.action();
                  onClose();
                }}
                className={cn(
                  'flex w-full items-center gap-3xs rounded-lg px-xs py-2xs text-body',
                  'text-text-primary hover:bg-surface-sidebar transition-colors duration-fast',
                )}
              >
                <a.icon className="h-5 w-5 text-text-secondary" />
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  ProfileCard                                                        */
/* ──────────────────────────────────────────────────────────────────── */

/**
 * Customer summary card for the dashboard roster.
 *
 * **Mobile**: compact horizontal — avatar (with online dot), name/age/city,
 *             designation/company, status badge + chevron, optional pending strip.
 *             Tap → navigate. Long-press → quick-action sheet.
 *
 * **Desktop (lg+)**: wider card with additional fields (education, religion).
 */
function ProfileCardComponent({
  profile,
  index = 0,
  isOnline = false,
  pendingMatches,
  className,
}: ProfileCardProps) {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const age = getAge(profile.dateOfBirth);

  // ── Long-press handlers ──
  const onPointerDown = useCallback(() => {
    wasLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      wasLongPress.current = true;
      // Haptic feedback (mobile only, fails gracefully)
      try {
        navigator.vibrate?.(10);
      } catch {
        /* noop */
      }
      setShowActions(true);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (wasLongPress.current) {
      wasLongPress.current = false;
      return;
    }
    // Haptic feedback
    try {
      navigator.vibrate?.(5);
    } catch {
      /* noop */
    }
    navigate(`/customer/${profile.id}`);
  }, [navigate, profile.id]);

  const quickActions: QuickAction[] = [
    {
      icon: Eye,
      label: 'View Profile',
      action: () => navigate(`/customer/${profile.id}`),
    },
    {
      icon: Phone,
      label: `Call ${profile.firstName}`,
      action: () => window.open(`tel:${profile.phone}`, '_self'),
    },
    {
      icon: PenLine,
      label: 'Edit Status',
      action: () => navigate(`/customer/${profile.id}`),
    },
  ];

  // ── Income formatting ──
  const incomeLPA = (profile.incomeAnnual / 100000).toFixed(1);

  return (
    <>
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileTap={{ scale: 0.97 }}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/customer/${profile.id}`);
          }
        }}
        className={cn(
          'group cursor-pointer rounded-lg border border-surface-divider bg-surface-card',
          'shadow-card transition-shadow duration-fast ease-app hover:shadow-float',
          'select-none',
          className,
        )}
      >
        {/* ── Main row ── */}
        <div className="flex items-center gap-3xs p-xs lg:gap-xs">
          {/* Avatar with online dot */}
          <div className="relative shrink-0">
            <Avatar
              name={fullName}
              src={profile.profilePhoto}
              size="lg"
            />
            {isOnline && (
              <span
                className={cn(
                  'absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full',
                  'border-2 border-surface-card bg-status-success-base',
                )}
                aria-label="Online"
              />
            )}
          </div>

          {/* Centre info */}
          <div className="min-w-0 flex-1">
            {/* Row 1: Name */}
            <h3 className="truncate font-display text-h4 font-semibold text-text-primary">
              {fullName}
            </h3>

            {/* Row 2: Age / City */}
            <p className="mt-0.5 flex items-center gap-1 text-body-sm text-text-secondary">
              <span>{age} yrs</span>
              <span className="text-surface-divider">·</span>
              <MapPin className="inline h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{profile.city}</span>
            </p>

            {/* Row 3: Designation / Company */}
            <p className="mt-0.5 flex items-center gap-1 text-body-sm text-text-secondary">
              <Briefcase className="inline h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">
                {profile.designation}
                {profile.currentCompany && ` · ${profile.currentCompany}`}
              </span>
            </p>

            {/* Desktop extras */}
            <div className="mt-1 hidden flex-wrap items-center gap-x-sm gap-y-0.5 text-caption text-text-secondary lg:flex">
              <span>{profile.degree}</span>
              <span className="text-surface-divider">·</span>
              <span>{profile.religion}</span>
              <span className="text-surface-divider">·</span>
              <span>₹{incomeLPA} LPA</span>
            </div>
          </div>

          {/* Right: Badge + Chevron */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status={profile.status} />
            <ChevronRight
              className="h-4 w-4 text-text-disabled transition-transform duration-fast group-hover:translate-x-0.5"
              aria-hidden
            />
          </div>
        </div>

        {/* ── Pending matches strip ── */}
        {pendingMatches != null && pendingMatches > 0 && (
          <div className="border-t border-surface-divider bg-brand-50/50 px-xs py-1.5">
            <p className="text-caption font-medium text-brand-600">
              {pendingMatches} match{pendingMatches !== 1 ? 'es' : ''} pending
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick action sheet (mobile long-press) */}
      <AnimatePresence>
        {showActions && (
          <QuickActionSheet
            actions={quickActions}
            onClose={() => setShowActions(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** Memoised: list rows re-render only when their own profile/props change. */
export const ProfileCard = memo(ProfileCardComponent);
