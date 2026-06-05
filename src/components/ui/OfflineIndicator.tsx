import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@hooks/index';

/**
 * Global slim banner shown while the browser is offline. Mounted once in the
 * AppShell; auto-hides when connectivity returns. Sits above the header.
 */
export function OfflineIndicator() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden bg-text-primary text-text-inverse"
        >
          <div className="flex items-center justify-center gap-1.5 px-xs py-1.5 text-caption font-medium">
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            You’re offline — changes will sync when you reconnect.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
