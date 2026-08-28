// MobileMyStory — vertical scrolling chapter timeline
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

const CHAPTERS = [
  {
    id: 'ch1', number: '01', title: 'Reference Chapter: Where It Started',
    subtitle: '[Your City, Country] · [Years]',
    image: '/data/mystory-reference.svg',
    pullQuote: '"This is a pull quote — pull the single most striking line from the chapter and drop it here for visual impact."',
    body: [
      "This is a reference chapter showing the shape and pacing of a good My Story chapter. Open with a scene: a specific place, a specific memory, something concrete that grounds the reader before you zoom out.",
      "The second paragraph usually builds context — what you were doing during this period, what it taught you, what skills or instincts you picked up along the way.",
      "The final paragraph should pivot toward the 'why' and set up momentum into the next chapter, instead of ending on a full stop.",
    ],
    stats: [{ label: 'Example Stat', value: 'X' }, { label: 'Example Stat', value: 'Y' }, { label: 'Example Stat', value: 'Z' }],
  },
  {
    id: 'ch2', number: '02', title: 'Reference Chapter: What Changed',
    subtitle: '[Your Next Chapter] · [Years]',
    image: '/data/mystory-reference.svg',
    pullQuote: '"A second pull quote — chapters read best when each one has its own turning point."',
    body: [
      "Use later chapters to show progression — a new role, a new place, a new problem you decided to go solve. Ground it in specifics: numbers, dates, names of things you built or shipped.",
      "If this is your most recent chapter, this is a good place to explain what you're building now and why — the reader's last impression before they go look at your projects or reach out.",
      "Add as many chapters as you want — this list is fully data-driven, so extending it to 3, 5, or more chapters is just adding more entries to the CHAPTERS array above.",
    ],
    stats: [{ label: 'Example Stat', value: 'X' }, { label: 'Example Stat', value: 'Y' }, { label: 'Example Stat', value: 'Z' }],
  },
];

export default function MobileMyStory({ onClose }: { onClose: () => void }) {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const chapter = CHAPTERS.find((c) => c.id === activeChapter);

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10" style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#e53e3e]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">My Story</h1>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto">
        {CHAPTERS.map((ch, i) => (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveChapter(ch.id)}
            className="flex items-center gap-4 px-5 py-4 border-b border-white/5 cursor-pointer active:bg-white/5"
          >
            {/* Chapter number */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={ch.image} alt={ch.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.7)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[#e53e3e] text-xs font-mono">{ch.number}</span>
                <h3 className="text-white text-sm font-semibold truncate">{ch.title}</h3>
              </div>
              <p className="text-white/40 text-xs mt-0.5 truncate">{ch.subtitle}</p>
            </div>
            <ChevronLeft size={16} className="text-white/30 rotate-180 flex-shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Chapter detail */}
      <AnimatePresence>
        {chapter && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
            style={{ background: '#0a0a0a' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Hero */}
            <div className="relative h-64 flex-shrink-0">
              <img src={chapter.image} alt={chapter.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.55)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0a 0%, transparent 50%)' }} />
              <button
                onClick={() => setActiveChapter(null)}
                className="absolute top-12 left-4 flex items-center gap-1 text-[#e53e3e]"
              >
                <ChevronLeft size={22} />
                <span className="text-sm">My Story</span>
              </button>
              <div className="absolute bottom-4 left-5">
                <span className="text-[#e53e3e] text-xs font-mono">{chapter.number}</span>
                <h2 className="text-white font-bold text-2xl mt-1" style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontStyle: 'italic' }}>{chapter.title}</h2>
                <p className="text-white/50 text-xs mt-1">{chapter.subtitle}</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-12">
              {/* Pull quote */}
              <blockquote className="my-5 pl-4 border-l-2 border-[#e53e3e]">
                <p className="text-[#e53e3e] text-sm italic leading-relaxed">{chapter.pullQuote}</p>
              </blockquote>

              {/* Body */}
              <div className="space-y-4 mb-6">
                {chapter.body.map((para, i) => (
                  <p key={i} className="text-white/70 text-sm leading-relaxed">{para}</p>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {chapter.stats.map((s) => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[#e53e3e] font-bold text-lg">{s.value}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
