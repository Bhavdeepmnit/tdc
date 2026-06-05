import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Briefcase,
  Send,
  X,
  Check,
  ChevronDown,
  AlertTriangle,
  Star,
  ShieldAlert,
  Heart,
} from 'lucide-react';
import type { ScoredMatch, MatchFlag, ScoreDimension } from '@lib/matching';
import type { CustomerProfile } from '@types';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { ScoreRing } from '@components/ui/ScoreRing';
import { AIScorePanel } from '@components/features/AIScorePanel';
import { SendMatchModal } from '@components/features/SendMatchModal';
import { useAppStore } from '@store/useAppStore';
import { rejectMatch } from '@lib/matchActions';
import { useIsMobile, usePrefersReducedMotion } from '@hooks/index';
import { cn } from '@utils/cn';
import { getAge } from '@utils/date';
import { formatIndianIncome } from '@utils/format';

/* ──────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ──────────────────────────────────────────────────────────────────── */

export interface MatchCardProps {
  match: ScoredMatch;
  /** The client this match is for — enables the on-demand AI analysis panel. */
  customer?: CustomerProfile;
  /** Index used to stagger the entrance animation. */
  index?: number;
  /** Called when the "Send Match" CTA is tapped. */
  onSend?: () => void;
  /** Called when "Pass" is tapped. */
  onPass?: () => void;
  className?: string;
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Tier badge colors                                                  */
/* ──────────────────────────────────────────────────────────────────── */

const TIER_STYLES = {
  HIGH: 'bg-status-success-bg text-status-success-text',
  MEDIUM: 'bg-status-warning-bg text-status-warning-text',
  LOW: 'bg-status-error-bg text-status-error-text',
} as const;

const TIER_LABELS = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' } as const;

/* ──────────────────────────────────────────────────────────────────── */
/*  Flag rendering                                                     */
/* ──────────────────────────────────────────────────────────────────── */

const FLAG_STYLES: Record<MatchFlag['type'], { bg: string; icon: typeof Star; text: string }> = {
  DEALBREAKER: { bg: 'bg-red-50 border-red-200 text-red-700', icon: ShieldAlert, text: 'text-red-700' },
  HIGHLIGHT: { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: Star, text: 'text-amber-700' },
  CAUTION: { bg: 'bg-orange-50 border-orange-200 text-orange-600', icon: AlertTriangle, text: 'text-orange-600' },
};

function FlagBanner({ flag }: { flag: MatchFlag }) {
  const style = FLAG_STYLES[flag.type];
  const Icon = style.icon;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2xs py-1 text-caption font-medium',
        style.bg,
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', style.text)} />
      <span>{flag.message}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Score breakdown row                                                */
/* ──────────────────────────────────────────────────────────────────── */

function BreakdownRow({ dim }: { dim: ScoreDimension }) {
  const pct = dim.maxScore > 0 ? (dim.score / dim.maxScore) * 100 : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-body-sm">
        <span className="font-medium text-text-primary">{dim.label}</span>
        <span className="text-text-secondary">
          {dim.score}/{dim.maxScore}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sidebar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'h-full rounded-full',
            pct >= 75 ? 'bg-status-success-base' : pct >= 50 ? 'bg-accent' : 'bg-status-error-base',
          )}
        />
      </div>
      <p className="text-caption text-text-secondary">{dim.reason}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  MatchCard                                                          */
/* ──────────────────────────────────────────────────────────────────── */

/**
 * A scored match card with candidate summary, score ring, tier badge,
 * deal-breaker/highlight flags, and an expandable score breakdown.
 *
 * - Tap to expand → full ScoreBreakdown table + reasons
 * - "Send Match" CTA + "Pass" button in expanded view
 */
function MatchCardComponent({ match, customer, index = 0, onSend, onPass, className }: MatchCardProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const reduceMotion = usePrefersReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const { profile, score, tier, breakdown, flags } = match;
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const age = getAge(profile.dateOfBirth);
  const dealbreakers = flags.filter((f) => f.type === 'DEALBREAKER');
  const highlights = flags.filter((f) => f.type === 'HIGHLIGHT');
  const cautions = flags.filter((f) => f.type === 'CAUTION');

  // Whether this match has already been sent (drives the "Sent" state).
  const isSent = useAppStore((s) =>
    customer ? s.isMatchSent(customer.id, profile.id) : false,
  );

  // ── Actions ──
  const openSend = () => {
    if (customer) setSendOpen(true);
    else onSend?.();
  };
  const handlePass = () => {
    if (customer) void rejectMatch(customer.id, profile.id);
    onPass?.();
  };

  // ── Swipe (mobile): right = Send, left = Pass ──
  const x = useMotionValue(0);
  const sendHint = useTransform(x, [0, 120], [0, 1]);
  const passHint = useTransform(x, [-120, 0], [1, 0]);
  const canSwipe = isMobile && !isSent;

  return (
    <div className="relative">
      {/* Swipe hint backdrops (mobile) */}
      {canSwipe && (
        <>
          <motion.div
            style={{ opacity: sendHint }}
            className="pointer-events-none absolute inset-0 flex items-center justify-start rounded-lg bg-status-success-bg pl-xs"
            aria-hidden
          >
            <span className="flex items-center gap-1.5 font-semibold text-status-success-text">
              <Heart className="h-5 w-5" /> Send
            </span>
          </motion.div>
          <motion.div
            style={{ opacity: passHint }}
            className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-lg bg-status-error-bg pr-xs"
            aria-hidden
          >
            <span className="flex items-center gap-1.5 font-semibold text-status-error-text">
              Pass <X className="h-5 w-5" />
            </span>
          </motion.div>
        </>
      )}

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: Math.min(index * 0.06, 0.5) }}
        style={{ x }}
        drag={canSwipe ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.x > 110) openSend();
          else if (info.offset.x < -110) handlePass();
        }}
      >
      <Card className={cn('overflow-hidden', isSent && 'opacity-90', className)}>
        {/* ── Sent banner ── */}
        {isSent && (
          <div className="flex items-center gap-1.5 border-b border-status-success-base/30 bg-status-success-bg px-xs py-1.5">
            <Check className="h-4 w-4 shrink-0 text-status-success-text" />
            <span className="text-caption font-semibold text-status-success-text">Match Sent</span>
          </div>
        )}
        {/* ── Dealbreaker banner (red strip at top) ── */}
        {dealbreakers.length > 0 && (
          <div className="flex items-center gap-1.5 border-b border-red-200 bg-red-50 px-xs py-1.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
            <span className="text-caption font-semibold text-red-700">
              {dealbreakers.length} Deal-breaker{dealbreakers.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* ── Highlight banner (gold strip) ── */}
        {dealbreakers.length === 0 && highlights.length > 0 && (
          <div className="flex items-center gap-1.5 border-b border-amber-200 bg-amber-50 px-xs py-1.5">
            <Star className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="text-caption font-semibold text-amber-700">
              Top Match
            </span>
          </div>
        )}

        {/* ── Main content ── */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-xs p-xs text-left"
          aria-expanded={expanded}
        >
          <Avatar name={fullName} src={profile.profilePhoto} size="lg" />

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-h4 font-semibold text-text-primary">
              {fullName}
            </p>
            <p className="text-body-sm text-text-secondary">
              {age} yrs · {profile.city}
            </p>
            <div className="mt-0.5 flex items-center gap-x-sm text-body-sm text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" aria-hidden />
                <span className="truncate">{profile.designation}</span>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{formatIndianIncome(profile.incomeAnnual)}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <ScoreRing score={score} size="sm" animateReveal />
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                TIER_STYLES[tier],
              )}
            >
              {TIER_LABELS[tier]}
            </span>
          </div>

          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-text-disabled transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </button>

        {/* ── Expanded: Breakdown + Flags + Actions ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-xs border-t border-surface-divider px-xs pb-xs pt-xs">
                {/* Score breakdown */}
                <div className="space-y-2xs">
                  <h4 className="text-overline uppercase tracking-wider text-text-secondary">
                    Score Breakdown
                  </h4>
                  {Object.values(breakdown).map((dim) => (
                    <BreakdownRow key={dim.label} dim={dim} />
                  ))}
                </div>

                {/* Flags */}
                {flags.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-overline uppercase tracking-wider text-text-secondary">
                      Flags
                    </h4>
                    {dealbreakers.map((f, i) => (
                      <FlagBanner key={`db-${i}`} flag={f} />
                    ))}
                    {highlights.map((f, i) => (
                      <FlagBanner key={`hl-${i}`} flag={f} />
                    ))}
                    {cautions.map((f, i) => (
                      <FlagBanner key={`ca-${i}`} flag={f} />
                    ))}
                  </div>
                )}

                {/* AI Analysis (on-demand) — only when the client profile is available */}
                {customer && (
                  <div className="space-y-2xs">
                    <h4 className="text-overline uppercase tracking-wider text-text-secondary">
                      AI Analysis
                    </h4>
                    <AIScorePanel customer={customer} match={match} onSend={openSend} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2xs pt-2xs">
                  <Button
                    size="sm"
                    variant={isSent ? 'secondary' : 'primary'}
                    leftIcon={
                      isSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />
                    }
                    disabled={isSent}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSend();
                    }}
                    className="flex-1"
                  >
                    {isSent ? 'Sent' : 'Send Match'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<X className="h-4 w-4" />}
                    disabled={isSent}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePass();
                    }}
                  >
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customer/${profile.id}`);
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      </motion.div>

      {/* Send-match flow (needs the client profile) */}
      {customer && (
        <SendMatchModal
          open={sendOpen}
          onClose={() => setSendOpen(false)}
          customer={customer}
          match={match}
          onSent={onSend}
        />
      )}
    </div>
  );
}

/** Memoised: a scored match is stable; avoid re-rendering the whole list on parent updates. */
export const MatchCard = memo(MatchCardComponent);
