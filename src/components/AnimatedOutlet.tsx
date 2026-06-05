import { useOutlet, useLocation, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

/**
 * Wraps the routed page in a directional slide transition:
 *  - forward navigation (PUSH) → new page slides in from the right
 *  - back navigation (POP)     → new page slides in from the left
 *
 * Kept subtle (24px offset, ~280ms) so fixed/sticky chrome doesn't visibly
 * shift. Under `prefers-reduced-motion` the global <MotionConfig reducedMotion>
 * collapses the transform to a plain cross-fade.
 */
const pageVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -24 : 24 }),
};

export function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const navType = useNavigationType(); // 'PUSH' | 'POP' | 'REPLACE'
  const direction = navType === 'POP' ? -1 : 1;

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
