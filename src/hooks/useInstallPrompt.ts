import { useCallback, useEffect, useState } from 'react';

/** The non-standard `beforeinstallprompt` event (Chromium only). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPrompt {
  /** A deferred install prompt is available (Chromium + not yet installed). */
  canInstall: boolean;
  /** The app is already running as an installed PWA (standalone display mode). */
  installed: boolean;
  /** Trigger the native install prompt. Resolves true if the user accepted. */
  promptInstall: () => Promise<boolean>;
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true);

/**
 * Manage the PWA "Add to Home Screen" flow.
 *
 * Chromium fires `beforeinstallprompt`, which we capture to trigger later from a
 * button. iOS Safari doesn't support it — there `canInstall` stays false and the
 * UI should fall back to manual "Share → Add to Home Screen" instructions.
 */
export function useInstallPrompt(): InstallPrompt {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // stop Chrome's mini-infobar; we drive the prompt ourselves
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  }, [deferred]);

  return { canInstall: !!deferred && !installed, installed, promptInstall };
}
