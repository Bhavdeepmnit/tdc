import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Send, Copy, Check, ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react';
import type { CustomerProfile } from '@types';
import type { ScoredMatch } from '@lib/matching';
import { aiScoreMatch, generateMatchIntro, type AIMatchResult, type IntroEmail } from '@lib/claude';
import { sendMatch } from '@lib/matchActions';
import { celebrate } from '@lib/confetti';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { ScoreRing } from '@components/ui/ScoreRing';
import { Spinner } from '@components/ui/Spinner';
import { usePrefersReducedMotion, useFocusTrap } from '@hooks/index';
import { cn } from '@utils/cn';
import { getAge } from '@utils/date';

export interface SendMatchModalProps {
  open: boolean;
  onClose: () => void;
  /** The client the match is for. */
  customer: CustomerProfile;
  /** The scored candidate being introduced. */
  match: ScoredMatch;
  /** Fired after a successful send (for page-level side effects). */
  onSent?: () => void;
}

type Step = 'review' | 'sending' | 'success';

const TIER_STYLES = {
  HIGH: 'bg-status-success-bg text-status-success-text',
  MEDIUM: 'bg-status-warning-bg text-status-warning-text',
  LOW: 'bg-status-error-bg text-status-error-text',
} as const;

/** First sentence of a block of text (for the 1-line AI summary). */
function firstSentence(text: string): string {
  const m = text.match(/[^.!?]+[.!?]/);
  return (m ? m[0] : text).trim();
}

/**
 * The full "Send Match" flow as a bottom-sheet (mobile) / centered modal (desktop):
 *
 *  1. Review   — side-by-side summaries, combined score + tier + 1-line AI take,
 *                "Customize Email" toggle, expandable email preview + copy.
 *  2. Sending  — spinner + "Sending match introduction…".
 *  3. Success  — confetti + checkmark; email stays previewable/copyable.
 *
 * Sending persists via `sendMatch` (store + Firestore), which also flips the
 * client to MATCHED on the first send. Errors never surface raw — the user sees
 * a friendly toast and stays on the review step.
 */
export function SendMatchModal({ open, onClose, customer, match, onSent }: SendMatchModalProps) {
  const reduceMotion = usePrefersReducedMotion();
  const dialogRef = useFocusTrap<HTMLDivElement>(open);
  const [step, setStep] = useState<Step>('review');
  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState<AIMatchResult | null>(null);
  const [email, setEmail] = useState<IntroEmail | null>(null);
  const [customize, setCustomize] = useState(false);
  const [editedBody, setEditedBody] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const candidate = match.profile;
  const candidateName = `${candidate.firstName} ${candidate.lastName}`;
  const combinedScore = ai?.combinedScore ?? match.score;

  // Load AI analysis + draft email when opened; reset on close.
  useEffect(() => {
    if (!open) {
      setStep('review');
      setAi(null);
      setEmail(null);
      setCustomize(false);
      setPreviewOpen(false);
      setCopied(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      aiScoreMatch(customer, match, match.score),
      generateMatchIntro(customer, match, match.score),
    ])
      .then(([scoreRes, emailRes]) => {
        if (cancelled) return;
        setAi(scoreRes);
        setEmail(emailRes);
        setEditedBody(emailRes.body);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customer, match]);

  // Escape closes (except while sending).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && step !== 'sending' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, step]);

  const aiSummary = useMemo(() => {
    if (!ai) return '';
    return firstSentence(ai.strengthsText) || `${ai.compatibilityLabel} for ${customer.firstName}.`;
  }, [ai, customer.firstName]);

  const finalBody = customize ? editedBody : (email?.body ?? '');

  const handleSend = async () => {
    setStep('sending');
    try {
      await sendMatch(customer.id, candidate.id, finalBody, combinedScore, match.tier);
      setStep('success');
      celebrate();
      toast.success(`Match sent to ${candidateName}!`);
      onSent?.();
    } catch {
      toast.error("Couldn't send the match — please try again.");
      setStep('review');
    }
  };

  const handleCopy = async () => {
    const text = email ? `Subject: ${email.subject}\n\n${finalBody}` : finalBody;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — silent */
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => step !== 'sending' && onClose()}
          />

          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Send match to ${candidateName}`}
            className={cn(
              'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden bg-surface-card shadow-float outline-none',
              'rounded-t-sheet sm:max-w-xl sm:rounded-sheet',
            )}
            initial={reduceMotion ? { opacity: 0 } : { y: 48, opacity: 0, scale: 0.98 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 48, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-divider px-xs py-2xs">
              <h3 className="font-display text-h4 font-semibold text-text-primary">
                {step === 'success' ? 'Match Sent' : `Send Match to ${candidate.firstName}?`}
              </h3>
              {step !== 'sending' && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-md p-1 text-text-disabled transition-colors hover:bg-surface-sidebar hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-xs py-xs">
              {/* ── SENDING ── */}
              {step === 'sending' && (
                <div className="flex flex-col items-center justify-center gap-2xs py-xl">
                  <Spinner size="lg" />
                  <p className="animate-pulse text-body font-medium text-text-secondary">
                    Sending match introduction…
                  </p>
                </div>
              )}

              {/* ── SUCCESS ── */}
              {step === 'success' && (
                <div className="flex flex-col items-center gap-xs py-md text-center">
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { scale: 0 }}
                    animate={reduceMotion ? { opacity: 1 } : { scale: 1 }}
                    transition={{ type: reduceMotion ? 'tween' : 'spring', stiffness: 260, damping: 18 }}
                  >
                    <CheckCircle2 className="h-16 w-16 text-status-success-base" />
                  </motion.div>
                  <div>
                    <p className="font-display text-h3 font-semibold text-text-primary">
                      Match sent to {candidate.firstName}!
                    </p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                      {customer.firstName} will be introduced to {candidateName}.
                    </p>
                  </div>
                  <EmailPreview
                    email={email}
                    body={finalBody}
                    open={previewOpen}
                    onToggle={() => setPreviewOpen((o) => !o)}
                    onCopy={handleCopy}
                    copied={copied}
                    className="w-full text-left"
                  />
                </div>
              )}

              {/* ── REVIEW ── */}
              {step === 'review' && (
                <div className="space-y-xs">
                  {/* Side-by-side profiles */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2xs">
                    <ProfileMini profile={customer} label="Client" />
                    <div className="flex flex-col items-center text-text-disabled">
                      <span className="text-h4">↔</span>
                    </div>
                    <ProfileMini profile={candidate} label="Candidate" />
                  </div>

                  {/* Combined score + tier + AI summary */}
                  <div className="flex items-center gap-xs rounded-lg border border-surface-divider bg-surface-bg p-xs">
                    {loading ? (
                      <div className="flex w-full justify-center py-2xs">
                        <Spinner size="md" label="Analysing compatibility…" />
                      </div>
                    ) : (
                      <>
                        <ScoreRing score={combinedScore} size="sm" animateReveal />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2xs">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                TIER_STYLES[match.tier],
                              )}
                            >
                              {match.tier}
                            </span>
                            <span className="inline-flex items-center gap-1 text-caption font-medium text-brand-600">
                              <Sparkles className="h-3 w-3" aria-hidden />
                              {ai?.compatibilityLabel}
                            </span>
                            {ai?.isFallback && (
                              <span className="text-caption text-text-disabled">(offline estimate)</span>
                            )}
                          </div>
                          <p className="text-body-sm text-text-secondary">{aiSummary}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Customize toggle */}
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-surface-divider px-xs py-2xs">
                    <span className="text-body-sm font-medium text-text-primary">Customize email</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={customize}
                      onClick={() => {
                        setCustomize((c) => !c);
                        setPreviewOpen(true);
                      }}
                      disabled={loading}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors duration-fast disabled:opacity-50',
                        customize ? 'bg-brand-600' : 'bg-surface-divider',
                      )}
                    >
                      <motion.span
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm',
                          customize ? 'left-[22px]' : 'left-0.5',
                        )}
                      />
                    </button>
                  </label>

                  {/* Email preview / editor */}
                  <EmailPreview
                    email={email}
                    body={finalBody}
                    editable={customize}
                    onEdit={setEditedBody}
                    open={previewOpen}
                    onToggle={() => setPreviewOpen((o) => !o)}
                    onCopy={handleCopy}
                    copied={copied}
                    loading={loading}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            {step === 'review' && (
              <div className="flex items-center gap-2xs border-t border-surface-divider px-xs py-2xs">
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  leftIcon={<Send className="h-4 w-4" />}
                  onClick={handleSend}
                  disabled={loading}
                  className="flex-1"
                >
                  Send Match
                </Button>
              </div>
            )}
            {step === 'success' && (
              <div className="border-t border-surface-divider px-xs py-2xs">
                <Button fullWidth onClick={onClose}>
                  Done
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function ProfileMini({ profile, label }: { profile: CustomerProfile; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <span className="text-overline uppercase tracking-wider text-text-disabled">{label}</span>
      <Avatar name={`${profile.firstName} ${profile.lastName}`} src={profile.profilePhoto} size="lg" />
      <p className="w-full truncate text-body-sm font-semibold text-text-primary">
        {profile.firstName} {profile.lastName}
      </p>
      <p className="text-caption text-text-secondary">
        {getAge(profile.dateOfBirth)} · {profile.city}
      </p>
      <p className="w-full truncate text-caption text-text-secondary">{profile.designation}</p>
    </div>
  );
}

interface EmailPreviewProps {
  email: IntroEmail | null;
  body: string;
  open: boolean;
  onToggle: () => void;
  onCopy: () => void;
  copied: boolean;
  editable?: boolean;
  onEdit?: (v: string) => void;
  loading?: boolean;
  className?: string;
}

function EmailPreview({
  email,
  body,
  open,
  onToggle,
  onCopy,
  copied,
  editable = false,
  onEdit,
  loading = false,
  className,
}: EmailPreviewProps) {
  return (
    <div className={cn('rounded-lg border border-surface-divider', className)}>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-xs py-2xs text-body-sm font-medium text-text-primary disabled:opacity-50"
      >
        Email Preview
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2xs border-t border-surface-divider px-xs py-2xs">
              {email && (
                <p className="text-caption text-text-secondary">
                  <span className="font-semibold text-text-primary">Subject:</span> {email.subject}
                </p>
              )}
              {editable ? (
                <textarea
                  value={body}
                  onChange={(e) => onEdit?.(e.target.value)}
                  rows={8}
                  className="w-full resize-y rounded-md border border-surface-divider bg-surface-bg p-2xs text-body-sm leading-relaxed text-text-primary focus:border-brand-300 focus:outline-none"
                />
              ) : (
                <p className="whitespace-pre-wrap rounded-md bg-surface-bg p-2xs text-body-sm leading-relaxed text-text-primary">
                  {body}
                </p>
              )}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={onCopy}
              >
                {copied ? 'Copied!' : 'Copy Email'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
