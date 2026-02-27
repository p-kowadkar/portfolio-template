// Design: Netflix-dark · 2-column layout (content left, image right)
// Everything animates dynamically: title types in, image scales up, cards stagger, bullets appear one by one
// Color: dark bg, #e50914 accent, glass = rgba(255,255,255,0.03) + blur

import { useState, useEffect, useRef } from 'react';
import { InlineHaiku } from '../HaikuEasterEgg';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { experience } from '../../data/experience';
import { education } from '../../data/education';

const tabs = [
  { id: 'experience', label: 'Experience', url: 'pk://experience' },
  { id: 'education', label: 'Education', url: 'pk://education' },
  { id: 'careerforge', label: 'CareerForge', url: 'forge-your-future.com' },
];

/* ── Typing text hook ── */
function useTypewriter(text: string, speed = 28, startDelay = 0) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, speed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return displayed;
}

/* ─────────────────────────────────────────────
   EXPERIENCE TAB — 2-column detail panel
───────────────────────────────────────────── */
function ExperienceTab() {
  const [selected, setSelected] = useState<string>(experience[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedExp = experience.find((e) => e.id === selected)!;

  const typedRole = useTypewriter(selectedExp.role, 38, 80);
  const typedCompany = useTypewriter(selectedExp.company, 22, 320);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', fontStyle: 'italic', color: '#f0f0f2', marginBottom: '2px' }}>
          Work Experience
        </h2>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
          {experience.length} roles · AI · Data Engineering · Software
        </p>
      </div>

      {/* Horizontal scroll row */}
      <div className="relative shrink-0 px-6">
        <button onClick={() => scroll('left')} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-all hover:scale-110"
          style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ChevronLeft size={14} color="white" />
        </button>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingLeft: '24px', paddingRight: '24px' }}>
          {experience.map((exp) => (
            <motion.button key={exp.id} onClick={() => setSelected(exp.id)}
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              className="relative shrink-0 overflow-hidden text-left"
              style={{ width: '170px', height: '110px', borderRadius: '10px', border: exp.id === selected ? '2px solid #E50914' : '2px solid rgba(255,255,255,0.06)', boxShadow: exp.id === selected ? '0 0 20px rgba(229,9,20,0.3)' : '0 4px 20px rgba(0,0,0,0.4)', background: '#1a1a1c', cursor: 'pointer' }}>
              <div className="absolute inset-0">
                <img src={exp.image} alt={exp.company} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65) saturate(1.05)' }} loading="lazy" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
              </div>
              {exp.current && (
                <div className="absolute top-2 right-2 z-10" style={{ padding: '2px 7px', borderRadius: '8px', fontSize: '8px', fontFamily: "'DM Mono', monospace", background: '#E50914', color: 'white', letterSpacing: '0.08em', fontWeight: 600 }}>
                  CURRENT
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f0f0f2', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.role}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.company}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", marginTop: '2px' }}>{exp.period}</div>
              </div>
              {exp.id === selected && (
                <motion.div layoutId="exp-sel" className="absolute bottom-0 left-0 right-0" style={{ height: '3px', background: '#E50914' }} />
              )}
            </motion.button>
          ))}
        </div>
        <button onClick={() => scroll('right')} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-all hover:scale-110"
          style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ChevronRight size={14} color="white" />
        </button>
      </div>

      {/* Full-bleed detail panel */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 mt-2">
        <AnimatePresence mode="wait">
          <motion.div key={selectedExp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>

            {/* TRUE 2-COLUMN: left=content, right=image */}
            <div style={{ display: 'flex', minHeight: '260px' }}>

              {/* LEFT COLUMN — all content */}
              <div style={{ flex: '0 0 52%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 16px 20px 20px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '19px', fontStyle: 'italic', color: '#f0f0f2' }}>
                    {typedRole}<span style={{ opacity: typedRole.length < selectedExp.role.length ? 1 : 0, color: '#E50914' }}>▊</span>
                  </span>
                  {selectedExp.current && (
                    <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '9px', fontFamily: "'DM Mono', monospace", background: 'rgba(229,9,20,0.2)', color: '#E50914', border: '1px solid rgba(229,9,20,0.35)', letterSpacing: '0.06em' }}>CURRENT</span>
                  )}
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '2px' }}>
                  {typedCompany}{selectedExp.detail && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {selectedExp.detail}</span>}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", marginBottom: '14px' }}>{selectedExp.period}</p>

                {/* Highlight cards */}
                {selectedExp.highlights && selectedExp.highlights.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    {selectedExp.highlights.map((h, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '13px', marginBottom: '3px' }}>{h.icon}</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#f0f0f2', lineHeight: 1.3 }}>{h.value}</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{h.label}</div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Tech tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {selectedExp.tech.slice(0, 6).map((t, i) => (
                    <motion.span key={t} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.04 }}
                      style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontFamily: "'DM Mono', monospace", background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {t}
                    </motion.span>
                  ))}
                  {selectedExp.tech.length > 6 && (
                    <span style={{ padding: '2px 8px', fontSize: '9px', fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.22)' }}>+{selectedExp.tech.length - 6}</span>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN — image, no overlays */}
              <motion.div style={{ flex: '0 0 48%', overflow: 'hidden' }}
                initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
                <img src={selectedExp.image} alt={selectedExp.company}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
              </motion.div>
            </div>

            {/* Content below */}
            <div style={{ background: 'rgba(14,14,16,0.97)', padding: '16px 20px 20px' }}>
              {/* Animated divider */}
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.28, duration: 0.4 }}
                style={{ height: '1px', background: 'linear-gradient(to right, rgba(229,9,20,0.4), rgba(255,255,255,0.06), transparent)', transformOrigin: 'left', marginBottom: '14px' }} />

              {/* Bullets — staggered */}
              <ul className="flex flex-col gap-2 mb-4">
                {selectedExp.bullets.map((b, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.06 }}
                    className="flex gap-2" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.65 }}>
                    <span style={{ color: '#E50914', flexShrink: 0, marginTop: '2px' }}>▸</span>
                    {b}
                  </motion.li>
                ))}
              </ul>

              {/* All tech tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedExp.tech.map((t, i) => (
                  <motion.span key={t} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55 + i * 0.04 }}
                    style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '10px', fontFamily: "'DM Mono', monospace", background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {t}
                  </motion.span>
                ))}
              </div>

              {/* Origin story */}
              {selectedExp.originStory && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: 'rgba(229,9,20,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>origin story</p>
                  <div style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid rgba(229,9,20,0.5)', borderRadius: '0 8px 8px 0', padding: '12px 14px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, fontStyle: 'italic' }}>{selectedExp.originStory}</p>
                  </div>
                  {selectedExp.haiku && <InlineHaiku id={selectedExp.haiku} />}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EDUCATION TAB — 2-column cards
───────────────────────────────────────────── */
function EducationTab() {
  const [expanded, setExpanded] = useState<string | null>('njit');

  return (
    <div className="px-6 py-5">
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', fontStyle: 'italic', color: '#f0f0f2', marginBottom: '2px' }}>
        Education
      </h2>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>
        From aerospace to AI
      </p>

      <div className="flex flex-col gap-4">
        {education.map((edu, eduIdx) => (
          <motion.div key={edu.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: eduIdx * 0.1 }}
            style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>

            {/* TRUE 2-COLUMN: left=content, right=image */}
            <div style={{ display: 'flex', minHeight: '180px' }}>

              {/* LEFT COLUMN — all content */}
              <div style={{ flex: '0 0 52%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '18px 16px 18px 18px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + eduIdx * 0.1 }}
                  style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', fontStyle: 'italic', color: '#f0f0f2', marginBottom: '4px' }}>
                  {edu.degree} · {edu.field}
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + eduIdx * 0.1 }}
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '3px' }}>
                  {edu.institution}
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + eduIdx * 0.1 }}
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono', monospace", marginBottom: '12px' }}>
                  {edu.location} · {edu.period}
                </motion.div>
                {/* Highlight cards */}
                {edu.highlights && edu.highlights.length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {edu.highlights.map((h, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + eduIdx * 0.1 + i * 0.07 }}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '7px 9px' }}>
                        <div style={{ fontSize: '13px', marginBottom: '3px' }}>{h.icon}</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#f0f0f2', lineHeight: 1.3 }}>{h.value}</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{h.label}</div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + eduIdx * 0.1 }}
                    style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontFamily: "'DM Mono', monospace", background: 'rgba(229,9,20,0.12)', color: '#E50914', border: '1px solid rgba(229,9,20,0.25)', width: 'fit-content' }}>
                    GPA {edu.gpa}
                  </motion.span>
                )}
              </div>

              {/* RIGHT COLUMN — image, no overlays */}
              <motion.div style={{ flex: '0 0 48%', overflow: 'hidden' }}
                initial={{ opacity: 0, scale: 1.04 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.05 + eduIdx * 0.1 }}>
                <img src={edu.image} alt={edu.institution} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
              </motion.div>
            </div>

            {/* Content below image */}
            <div style={{ background: 'rgba(14,14,16,0.97)' }}>
            {/* Animated divider */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.25 + eduIdx * 0.1, duration: 0.35 }}
              style={{ height: '1px', background: 'linear-gradient(to right, rgba(229,9,20,0.35), rgba(255,255,255,0.05), transparent)', transformOrigin: 'left', margin: '0 20px' }} />

            {/* Expand */}
            <div className="px-5 py-3">
              <div className="flex items-center justify-end">
                <button onClick={() => setExpanded(expanded === edu.id ? null : edu.id)}
                  className="flex items-center gap-1 transition-opacity hover:opacity-100"
                  style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>
                  {expanded === edu.id ? 'Less' : 'More'}
                  {expanded === edu.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              <AnimatePresence>
                {expanded === edu.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                      {/* Origin story */}
                      {edu.originStory && (
                        <div className="mb-4">
                          <p style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: 'rgba(229,9,20,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>origin story</p>
                          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid rgba(229,9,20,0.5)', borderRadius: '0 8px 8px 0', padding: '10px 14px' }}>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, fontStyle: 'italic' }}>{edu.originStory}</p>
                          </div>
                        </div>
                      )}

                      {/* Lore bullets */}
                      {edu.lore && edu.lore.length > 0 && (
                        <div className="mb-4">
                          <p style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>lore</p>
                          <div className="flex flex-col gap-2">
                            {edu.lore.map((l, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="flex gap-2" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                                <span style={{ color: '#E50914', flexShrink: 0, marginTop: '3px' }}>▸</span>
                                {l}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Academic roles */}
                      {edu.roles.length > 0 && (
                        <div className="mb-4">
                          <p style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.3)', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>roles & activities</p>
                          <div className="flex flex-col gap-1.5">
                            {edu.roles.map((r, i) => (
                              <motion.div key={r} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                className="flex gap-2" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                                <span style={{ color: '#E50914', flexShrink: 0 }}>▸</span>
                                {r}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Courses */}
                      <div>
                        <p style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.3)', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>coursework</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(edu.courses ?? []).map((c, i) => (
                            <motion.span key={c} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                              style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontFamily: "'DM Mono', monospace", background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              {c}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CAREERFORGE TAB
───────────────────────────────────────────── */
function CareerForgeTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-5"
          style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #E50914, #b00710)', boxShadow: '0 8px 30px rgba(229,9,20,0.3)' }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontStyle: 'italic', color: 'white' }}>CF</span>
        </div>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#f0f0f2', marginBottom: '8px' }}>CareerForge</h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', maxWidth: '320px', lineHeight: 1.6, marginBottom: '24px' }}>
          End-to-end AI job application automation. Live product actively running 20+ applications/day.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <a href="https://www.forge-your-future.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 transition-all hover:brightness-110"
          style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, background: '#E50914', color: 'white', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}>
          <ExternalLink size={15} /> Open CareerForge
        </a>
        <a href="https://p-kowadkar.github.io/careerforge" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 transition-all"
          style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)'; }}>
          View Value Proposition
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN BROWSER APP
───────────────────────────────────────────── */
export default function BrowserApp() {
  const [activeTab, setActiveTab] = useState('experience');
  const [history, setHistory] = useState(['experience']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const currentTab = tabs.find((t) => t.id === activeTab);

  const goTo = (id: string) => {
    const newHistory = [...history.slice(0, historyIdx + 1), id];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
    setActiveTab(id);
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Browser chrome */}
      <div className="shrink-0" style={{ background: 'rgba(20,20,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 px-3 py-2">
          <button onClick={() => { if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setActiveTab(history[historyIdx - 1]); } }} disabled={historyIdx <= 0}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-25">
            <ChevronLeft size={15} color="rgba(255,255,255,0.6)" />
          </button>
          <button onClick={() => { if (historyIdx < history.length - 1) { setHistoryIdx(historyIdx + 1); setActiveTab(history[historyIdx + 1]); } }} disabled={historyIdx >= history.length - 1}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-25">
            <ChevronRight size={15} color="rgba(255,255,255,0.6)" />
          </button>
          <button className="p-1.5 rounded-md transition-colors hover:bg-white/5">
            <RefreshCw size={13} color="rgba(255,255,255,0.4)" />
          </button>
          <div className="flex-1 flex items-center px-3 py-1.5 rounded-lg" style={{ background: 'rgba(36,36,38,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{currentTab?.url}</span>
          </div>
        </div>
        <div className="flex px-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => goTo(tab.id)} className="relative px-4 py-2 transition-colors"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: activeTab === tab.id ? '#f0f0f2' : 'rgba(255,255,255,0.35)', background: activeTab === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '6px 6px 0 0' }}>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0" style={{ height: '2px', background: '#E50914', borderRadius: '1px' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="h-full">
            {activeTab === 'experience' && <ExperienceTab />}
            {activeTab === 'education' && <EducationTab />}
            {activeTab === 'careerforge' && <CareerForgeTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
