// MobileIntro — Short pk flash intro for mobile (1.5s, no audio gate)
// Design: Same dark aesthetic as desktop intro but faster, no click-to-enter
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileIntroProps {
  onComplete: () => void;
}

export default function MobileIntro({ onComplete }: MobileIntroProps) {
  const [phase, setPhase] = useState<'enter' | 'dissolve' | 'done'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('dissolve'), 1200);
    const t2 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: '#000' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'dissolve' ? 0 : 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 1, 1] }}
      >
        {/* pk monogram */}
        <motion.div
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{
            opacity: phase === 'dissolve' ? 0 : 1,
            scale: phase === 'dissolve' ? 2.5 : 1,
          }}
          transition={{ duration: phase === 'dissolve' ? 0.7 : 0.5, ease: phase === 'dissolve' ? [0.4, 0, 1, 1] : [0, 0, 0.2, 1] }}
        >
          <span
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: '72px',
              fontWeight: 400,
              color: '#fff',
              letterSpacing: '-0.02em',
              textShadow: '0 0 60px rgba(229,9,20,0.6), 0 0 120px rgba(229,9,20,0.3)',
            }}
          >
            pk
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
