import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ThumbsUp, AlertTriangle, ShieldAlert, Mail, WifiOff } from 'lucide-react';
import type { CustomerProfile } from '@types';
import type { ScoredMatch } from '@lib/matching';
import { aiScoreMatch, type AIMatchResult } from '@lib/claude';
import { Button } from '@components/ui/Button';
import { EmailPreviewModal } from '@components/features/EmailPreviewModal';
import { cn } from '@utils/cn';

export interface AIScorePanelProps {
  /** The client this match is for. */
  customer: CustomerProfile;
  /** The scored candidate (profile + breakdown + flags). */
  match: ScoredMatch;
  /** Forwarded to the email modal's "Send Match". */
  onSend?: () => void;
  className?: string;
}

/**
 * On-demand AI compatibility analysis for a match, rendered under the MatchCard.
 *
 * Flow: "Get AI Analysis" → pulsing loader → result (label + strengths /
 * cautions / dealbreakers) → "Generate Introduction" opens the email modal.
 * The scorer never throws (it falls back to the rules-engine breakdown), so the
 * user never sees a raw error — at worst a subtle "offline estimate" note.
 */
export function AIScorePanel({ customer, match, onSend, className }: AIScorePanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIMatchResult | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await aiScoreMatch(customer, match, match.score);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('space-y-xs', className)}>
      {/* Idle: CTA */}
      {!result && !loading && (
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          leftIcon={<Sparkles className="h-4 w-4" />}
          onClick={runAnalysis}
        >
          Get AI Analysis
        </Button>
      )}

      {/* Loading: pulsing animation */}
      {loading && (
        <div className="flex items-center justify-center gap-2xs rounded-lg border border-brand-100 bg-brand-50 py-xs">
          <motion.span
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-5 w-5 text-brand-600" aria-hidden />
          </motion.span>
          <span className="animate-pulse text-body-sm font-medium text-brand-600">
            Analysing compatibility…
          </span>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2xs rounded-lg border border-surface-divider bg-surface-bg p-xs"
          >
            {/* Header: label + combined score */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2xs py-0.5 text-body-sm font-semibold text-brand-600">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {result.compatibilityLabel}
              </span>
              <span className="text-body-sm text-text-secondary">
                Combined{' '}
                <span className="font-bold text-text-primary">{result.combinedScore}</span>/100
              </span>
            </div>

            {result.isFallback && (
              <p className="flex items-center gap-1 text-caption text-text-disabled">
                <WifiOff className="h-3 w-3" aria-hidden />
                Manual matching mode — AI unavailable, showing the rules-engine breakdown.
              </p>
            )}

            <InsightRow
              icon={ThumbsUp}
              label="Strengths"
              text={result.strengthsText}
              tone="success"
            />
            <InsightRow
              icon={AlertTriangle}
              label="Cautions"
              text={result.cautionsText}
              tone="warning"
            />
            <InsightRow
              icon={ShieldAlert}
              label="Deal-breakers"
              text={result.dealbreakersText}
              tone="error"
            />

            <Button
              variant="primary"
              size="sm"
              fullWidth
              leftIcon={<Mail className="h-4 w-4" />}
              onClick={() => setEmailOpen(true)}
              className="mt-2xs"
            >
              Generate Introduction
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <EmailPreviewModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        customer={customer}
        match={match}
        score={result?.combinedScore ?? match.score}
        onSend={onSend}
      />
    </div>
  );
}

const TONES = {
  success: { wrap: 'bg-status-success-bg', icon: 'text-status-success-text', label: 'text-status-success-text' },
  warning: { wrap: 'bg-status-warning-bg', icon: 'text-status-warning-text', label: 'text-status-warning-text' },
  error: { wrap: 'bg-status-error-bg', icon: 'text-status-error-text', label: 'text-status-error-text' },
} as const;

function InsightRow({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: typeof ThumbsUp;
  label: string;
  text: string;
  tone: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div className={cn('flex gap-2xs rounded-md p-2xs', t.wrap)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.icon)} aria-hidden />
      <div className="min-w-0">
        <p className={cn('text-caption font-semibold uppercase tracking-wide', t.label)}>{label}</p>
        <p className="text-body-sm text-text-primary">{text}</p>
      </div>
    </div>
  );
}
