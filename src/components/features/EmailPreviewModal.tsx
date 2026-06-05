import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Send, Mail, MessageCircle } from 'lucide-react';
import type { CustomerProfile } from '@types';
import type { ScoredMatch } from '@lib/matching';
import { generateMatchIntro, type IntroEmail } from '@lib/claude';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useFocusTrap } from '@hooks/index';
import { cn } from '@utils/cn';

export interface EmailPreviewModalProps {
  open: boolean;
  onClose: () => void;
  customer: CustomerProfile;
  match: ScoredMatch;
  /** Compatibility score (context for generation; never shown in copy). */
  score: number;
  /** Fired when the matchmaker confirms "Send Match". */
  onSend?: () => void;
}

/**
 * Modal that generates and previews an AI introduction email for a match.
 * Supports an email/WhatsApp toggle, copy-to-clipboard, and a send action.
 * Generation degrades to a deterministic template if the AI is unavailable —
 * the user never sees a raw error.
 */
export function EmailPreviewModal({
  open,
  onClose,
  customer,
  match,
  score,
  onSend,
}: EmailPreviewModalProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(open);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<IntroEmail | null>(null);
  const [whatsapp, setWhatsapp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate once per open; reset state on close.
  useEffect(() => {
    if (!open) {
      setEmail(null);
      setWhatsapp(false);
      setCopied(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    generateMatchIntro(customer, match, score)
      .then((result) => {
        if (!cancelled) setEmail(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customer, match, score]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const shownText = email ? (whatsapp ? email.whatsappVersion : email.body) : '';

  const handleCopy = async () => {
    const text = email
      ? whatsapp
        ? email.whatsappVersion
        : `Subject: ${email.subject}\n\n${email.body}`
      : '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — silently ignore, button just won't confirm */
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
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Introduction email preview"
            className={cn(
              'relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden bg-surface-card shadow-float outline-none',
              'rounded-t-sheet sm:max-w-lg sm:rounded-sheet',
            )}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-divider px-xs py-2xs">
              <h3 className="flex items-center gap-2xs font-display text-h4 font-semibold text-text-primary">
                <Mail className="h-5 w-5 text-brand-600" aria-hidden />
                Introduction Preview
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-text-disabled transition-colors hover:bg-surface-sidebar hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-xs py-xs">
              {loading || !email ? (
                <div className="flex flex-col items-center justify-center gap-2xs py-lg">
                  <Spinner size="lg" />
                  <p className="animate-pulse text-body-sm text-text-secondary">
                    Drafting introduction…
                  </p>
                </div>
              ) : (
                <>
                  {/* Channel toggle */}
                  <div className="mb-xs flex items-center gap-1 rounded-lg bg-surface-sidebar p-1">
                    <ToggleTab active={!whatsapp} onClick={() => setWhatsapp(false)} icon={Mail} label="Email" />
                    <ToggleTab active={whatsapp} onClick={() => setWhatsapp(true)} icon={MessageCircle} label="WhatsApp" />
                  </div>

                  {email.isFallback && (
                    <p className="mb-2xs rounded-md bg-status-info-bg px-2xs py-1 text-caption text-status-info-text">
                      Offline draft — AI was unavailable, so this uses a standard template you can edit.
                    </p>
                  )}

                  {/* Subject (email only) */}
                  {!whatsapp && (
                    <div className="mb-2xs">
                      <p className="text-overline uppercase tracking-wider text-text-secondary">Subject</p>
                      <p className="font-medium text-text-primary">{email.subject}</p>
                    </div>
                  )}

                  {/* Body */}
                  <div className="rounded-lg border border-surface-divider bg-surface-bg p-2xs">
                    <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-text-primary">
                      {shownText}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2xs border-t border-surface-divider px-xs py-2xs">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={handleCopy}
                disabled={!email}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                leftIcon={<Send className="h-4 w-4" />}
                disabled={!email}
                onClick={() => {
                  onSend?.();
                  onClose();
                }}
              >
                Send Match
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ToggleTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2xs py-1.5 text-body-sm font-medium transition-colors',
        active ? 'bg-surface-card text-brand-600 shadow-sm' : 'text-text-secondary hover:text-text-primary',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
