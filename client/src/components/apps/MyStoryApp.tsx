// MyStoryApp.tsx
// Design: Netflix-dark cinematic narrative — DM Serif Display italic for chapter titles,
// full-bleed chapter images with parallax-like overlays, pull quotes in crimson,
// chapter markers on left sidebar, smooth scroll between chapters.
// Color: #0a0a0a bg, var(--pk-accent) accent, #f5f5f1 body text, #a3a3a3 secondary.

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CHAPTERS = [
  {
    id: "ch1",
    number: "01",
    title: "Reference Chapter: Where It Started",
    subtitle: "[Your City, Country] · [Years]",
    image: "/data/mystory-reference.svg",
    pullQuote:
      "\"This is a pull quote — pull the single most striking line from the chapter and drop it here for visual impact.\"",
    body: [
      "This is a reference chapter showing the shape and pacing of a good My Story chapter. Open with a scene: a specific place, a specific memory, something concrete that grounds the reader before you zoom out.",
      "The second paragraph usually builds context — what you were doing during this period, what it taught you, what skills or instincts you picked up along the way.",
      "The third paragraph often pivots toward the 'why' — the throughline connecting this chapter to the ones that follow. What question were you chasing? What was starting to change?",
      "The final paragraph closes the chapter and sets up the next one. End with momentum, not a full stop — the reader should want to click 'Next chapter.'",
    ],
    stats: [
      { label: "Example Stat", value: "X" },
      { label: "Example Stat", value: "Y" },
      { label: "Example Stat", value: "Z" },
    ],
  },
  {
    id: "ch2",
    number: "02",
    title: "Reference Chapter: What Changed",
    subtitle: "[Your Next Chapter] · [Years]",
    image: "/data/mystory-reference.svg",
    pullQuote:
      "\"A second pull quote — chapters read best when each one has its own turning point.\"",
    body: [
      "Use later chapters to show progression — a new role, a new place, a new problem you decided to go solve. Each chapter should feel like a distinct beat in the story, not a repeat of the last one.",
      "Ground it in specifics: numbers, dates, names of things you built or shipped. Concrete details are what make a story feel real instead of generic.",
      "If this is your most recent chapter, this is a good place to explain what you're building now and why — the reader's last impression before they go look at your projects or reach out.",
      "Add as many chapters as you want — the layout, timeline sidebar, and navigation are all fully data-driven from the CHAPTERS array above, so extending this to 3, 5, or more chapters is just adding more entries.",
    ],
    stats: [
      { label: "Example Stat", value: "X" },
      { label: "Example Stat", value: "Y" },
      { label: "Example Stat", value: "Z" },
    ],
  },
];

export default function MyStoryApp() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track which chapter is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = chapterRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (idx !== -1) setActiveChapter(idx);
          }
        });
      },
      { threshold: 0.4, root: containerRef.current }
    );

    chapterRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToChapter = (idx: number) => {
    setIsScrolling(true);
    chapterRefs.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setTimeout(() => setIsScrolling(false), 800);
  };

  return (
    <div className="flex h-full bg-[#0a0a0a] text-[#f5f5f1] overflow-hidden font-['SF_Pro_Display',system-ui]">
      {/* Left sidebar — chapter nav */}
      <div className="w-[200px] flex-shrink-0 border-r border-white/10 flex flex-col py-8 px-4 gap-1 bg-[#0d0d0d]">
        <div className="mb-6 px-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#666] mb-1">
            My Story
          </p>
          <p className="text-[11px] text-[#a3a3a3]">Pranav Kowadkar</p>
        </div>

        {CHAPTERS.map((ch, idx) => (
          <button
            key={ch.id}
            onClick={() => scrollToChapter(idx)}
            className={`text-left px-3 py-3 rounded-lg transition-all duration-200 group ${
              activeChapter === idx
                ? "bg-[var(--pk-accent)]/10 border border-[var(--pk-accent)]/30"
                : "hover:bg-white/5 border border-transparent"
            }`}
          >
            <div
              className={`text-[10px] font-mono mb-1 transition-colors ${
                activeChapter === idx ? "text-[var(--pk-accent)]" : "text-[#555]"
              }`}
            >
              {ch.number}
            </div>
            <div
              className={`text-[12px] leading-tight font-medium transition-colors ${
                activeChapter === idx ? "text-[#f5f5f1]" : "text-[#888] group-hover:text-[#bbb]"
              }`}
            >
              {ch.title}
            </div>
          </button>
        ))}

        {/* Timeline line */}
        <div className="mt-auto px-2">
          <div className="relative h-[120px] flex items-center justify-center">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
            {CHAPTERS.map((_, idx) => (
              <div
                key={idx}
                className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border transition-all duration-300 ${
                  idx <= activeChapter
                    ? "bg-[var(--pk-accent)] border-[var(--pk-accent)]"
                    : "bg-transparent border-[#444]"
                }`}
                style={{ top: `${(idx / (CHAPTERS.length - 1)) * 100}%` }}
              />
            ))}
          </div>
          <p className="text-[10px] text-[#444] text-center mt-2">
            {activeChapter + 1} / {CHAPTERS.length}
          </p>
        </div>
      </div>

      {/* Main scroll area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
      >
        {CHAPTERS.map((chapter, idx) => (
          <div
            key={chapter.id}
            ref={(el) => {
              chapterRefs.current[idx] = el;
            }}
            className="min-h-full"
          >
            {/* Hero image with overlay */}
            <div className="relative h-[340px] overflow-hidden">
              <img
                src={chapter.image}
                alt={chapter.title}
                className="w-full h-full object-cover object-center"
                style={{ filter: "brightness(0.55)" }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 to-transparent" />

              {/* Chapter number watermark */}
              <div className="absolute top-6 right-8 text-[80px] font-bold text-white/5 font-mono leading-none select-none">
                {chapter.number}
              </div>

              {/* Chapter header */}
              <div className="absolute bottom-8 left-10 right-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--pk-accent)] mb-2">
                    Chapter {chapter.number}
                  </p>
                  <h2
                    className="text-[32px] leading-tight text-white mb-1"
                    style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontStyle: "italic",
                    }}
                  >
                    {chapter.title}
                  </h2>
                  <p className="text-[13px] text-[#a3a3a3]">{chapter.subtitle}</p>
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="px-10 pb-16 pt-8 max-w-[720px]">
              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex gap-6 mb-10"
              >
                {chapter.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-center"
                  >
                    <div className="text-[22px] font-bold text-[var(--pk-accent)] font-mono leading-none mb-1">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-[#666] uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Pull quote */}
              <motion.blockquote
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="border-l-[3px] border-[var(--pk-accent)] pl-6 mb-10"
              >
                <p
                  className="text-[17px] leading-relaxed text-[#f5f5f1]"
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontStyle: "italic",
                  }}
                >
                  {chapter.pullQuote}
                </p>
              </motion.blockquote>

              {/* Body paragraphs */}
              <div className="space-y-5">
                {chapter.body.map((para, pIdx) => (
                  <motion.p
                    key={pIdx}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 + pIdx * 0.08 }}
                    className="text-[14px] leading-[1.8] text-[#c8c8c4]"
                  >
                    {para}
                  </motion.p>
                ))}
              </div>

              {/* Chapter divider */}
              {idx < CHAPTERS.length - 1 && (
                <div className="mt-16 flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <button
                    onClick={() => scrollToChapter(idx + 1)}
                    className="flex items-center gap-2 text-[12px] text-[#666] hover:text-[var(--pk-accent)] transition-colors group"
                  >
                    <span>Next chapter</span>
                    <span className="group-hover:translate-y-1 transition-transform">↓</span>
                  </button>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              {/* Final CTA */}
              {idx === CHAPTERS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-16 p-8 bg-[var(--pk-accent)]/5 border border-[var(--pk-accent)]/20 rounded-2xl text-center"
                >
                  <p
                    className="text-[22px] text-white mb-3"
                    style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontStyle: "italic",
                    }}
                  >
                    The story continues.
                  </p>
                  <p className="text-[13px] text-[#a3a3a3] mb-6 max-w-[400px] mx-auto">
                    Wherever your story starts, this is the shape it can take — chapters that build on each other, leading somewhere.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href="https://github.com/p-kowadkar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 bg-[var(--pk-accent)] text-white text-[12px] font-medium rounded-lg hover:bg-[#c40812] transition-colors"
                    >
                      See the work →
                    </a>
                    <a
                      href="mailto:pranav.kowadkar@gmail.com"
                      className="px-5 py-2 bg-white/10 text-white text-[12px] font-medium rounded-lg hover:bg-white/15 transition-colors"
                    >
                      Start a conversation
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
