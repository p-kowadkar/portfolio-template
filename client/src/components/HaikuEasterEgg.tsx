// HaikuEasterEgg.tsx
// Hidden haiku easter eggs — fun facts about Pranav disguised as poetry.
// Triggered by: Konami code (↑↑↓↓←→←→BA), triple-clicking the hero name, or typing "haiku" in Terminal.
// Haikus are dynamically generated each session via Gemini RAG over journey doc, resume, and GitHub.

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaikus, FALLBACK_HAIKUS, type Haiku } from "@/hooks/useHaikus";

// Re-export for backward compat (TerminalApp imports HAIKUS)
export const HAIKUS = FALLBACK_HAIKUS;

// Konami code sequence
const KONAMI = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "b","a",
];

interface HaikuEasterEggProps {
  /** If provided, show a specific haiku by id */
  forceId?: string;
  /** Called when the easter egg is dismissed */
  onClose?: () => void;
}

export default function HaikuEasterEgg({ forceId, onClose }: HaikuEasterEggProps) {
  const { haikus, loading, source } = useHaikus();
  const [visible, setVisible] = useState(!!forceId);
  const [haiku, setHaiku] = useState<Haiku | null>(null);
  const [konamiProgress, setKonamiProgress] = useState(0);

  // Once haikus load, initialise the displayed haiku
  useEffect(() => {
    if (haikus.length === 0) return;
    if (forceId) {
      setHaiku(haikus.find((h) => h.id === forceId) ?? haikus[0]);
    } else if (!haiku) {
      setHaiku(haikus[Math.floor(Math.random() * haikus.length)]);
    }
  }, [haikus, forceId]);

  const showRandom = useCallback(() => {
    if (haikus.length === 0) return;
    const next = haikus[Math.floor(Math.random() * haikus.length)];
    setHaiku(next);
    setVisible(true);
  }, [haikus]);

  // Konami code listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const expected = KONAMI[konamiProgress];
      if (e.key === expected) {
        const next = konamiProgress + 1;
        if (next === KONAMI.length) {
          setKonamiProgress(0);
          showRandom();
        } else {
          setKonamiProgress(next);
        }
      } else {
        setKonamiProgress(0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [konamiProgress, showRandom]);

  const dismiss = () => {
    setVisible(false);
    onClose?.();
  };

  if (!haiku) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={haiku.id}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed z-[9999] pointer-events-auto"
          style={{ bottom: "96px", right: "24px", maxWidth: "280px" }}
        >
          <div
            style={{
              background: "rgba(10, 10, 10, 0.95)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(229, 9, 20, 0.3)",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 0.5px color-mix(in srgb, var(--pk-accent) 15%, transparent)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "18px" }}>{haiku.emoji}</span>
                <span
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--pk-accent)",
                    fontFamily: "monospace",
                  }}
                >
                  easter egg
                </span>
                {source === 'backend' && (
                  <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                    ✦ live
                  </span>
                )}
              </div>
              <button
                onClick={dismiss}
                style={{
                  background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.3)", cursor: "pointer",
                  fontSize: "14px", lineHeight: 1, padding: "2px 4px",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
              >
                ×
              </button>
            </div>

            {/* Haiku lines */}
            <div className="mb-3">
              {haiku.lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "15px",
                    color: i === 1 ? "#f5f5f1" : "rgba(245,245,241,0.75)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            {/* Fun fact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "10px" }}
            >
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", lineHeight: 1.5, fontFamily: "monospace" }}>
                {haiku.fact}
              </p>
            </motion.div>

            {/* Next haiku button */}
            <button
              onClick={showRandom}
              style={{
                marginTop: "10px",
                background: "color-mix(in srgb, var(--pk-accent) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--pk-accent) 20%, transparent)",
                borderRadius: "6px",
                color: "var(--pk-accent)",
                fontSize: "10px",
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
                width: "100%",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "color-mix(in srgb, var(--pk-accent) 15%, transparent)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "color-mix(in srgb, var(--pk-accent) 8%, transparent)"; }}
            >
              another haiku →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Inline haiku — for embedding in apps as a subtle decorative element ───
export function InlineHaiku({ id }: { id: string }) {
  const { haikus } = useHaikus();
  const haiku = haikus.find((h) => h.id === id) ?? FALLBACK_HAIKUS.find((h) => h.id === id);
  if (!haiku) return null;

  return (
    <div
      style={{ borderLeft: "2px solid color-mix(in srgb, var(--pk-accent) 25%, transparent)", paddingLeft: "12px", opacity: 0.45 }}
      title={haiku.fact}
    >
      {haiku.lines.map((line, i) => (
        <p
          key={i}
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "11px",
            color: "rgba(245,245,241,0.7)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
