// Design: Netflix-dark · 2-column layout (content left, image right)
// Everything animates dynamically — title types in, image scales up, cards stagger, bullets appear one by one
// Architecture diagram: frosted-glass SVG, nodes type themselves, edges draw in
// Color: #0a0a0a bg, var(--pk-accent) accent, #f5f5f1 body
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Cpu } from 'lucide-react';
import { projects } from '../../data/projects';
import CareerForgeValueProp from './CareerForgeValueProp';
import ArchDiagram from '../ArchDiagram';

const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  gold: { bg: 'rgba(255, 214, 10, 0.12)', text: '#ffd60a', border: 'rgba(255, 214, 10, 0.3)' },
  red:  { bg: 'rgba(229, 9, 20, 0.12)',   text: '#ff453a', border: 'rgba(229, 9, 20, 0.3)' },
  gray: { bg: 'rgba(142, 142, 147, 0.12)', text: '#8e8e93', border: 'rgba(142, 142, 147, 0.3)' },
  blue: { bg: 'rgba(10, 132, 255, 0.12)',  text: '#0a84ff', border: 'rgba(10, 132, 255, 0.3)' },
};

/* ── Typing text hook ── */
function useTypewriter(text: string, speed = 28, startDelay = 0) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

/* ── Main component ── */
export default function ProjectsApp() {
  const [selected, setSelected] = useState(projects[0].id);
  const [showCareerForge, setShowCareerForge] = useState(false);
  const project = projects.find((p) => p.id === selected);

  // Typewriter for title
  const { displayed: typedTitle } = useTypewriter(project?.name ?? '', 40, 80);
  const { displayed: typedTagline } = useTypewriter(project?.tagline ?? '', 18, 320);

  return (
    <div className="flex h-full" style={{ fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
      {showCareerForge && <CareerForgeValueProp onClose={() => setShowCareerForge(false)} />}
      {/* ── Left sidebar ── */}
      <div className="shrink-0 overflow-y-auto" style={{ width: '200px', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,14,16,0.8)' }}>
        <div className="px-4 py-3 sticky top-0" style={{ background: 'rgba(14,14,16,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {projects.length} Projects
          </p>
        </div>
        {projects.map((p) => (
          <button key={p.id} onClick={() => setSelected(p.id)} className="w-full text-left px-4 py-3 transition-all relative"
            style={{ borderLeft: p.id === selected ? '2px solid var(--pk-accent)' : '2px solid transparent', background: p.id === selected ? 'var(--pk-accent-dim)' : 'transparent' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: p.id === selected ? 500 : 400, color: p.id === selected ? '#f0f0f2' : 'rgba(255,255,255,0.55)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </p>
                {p.badge && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: badgeStyles[p.badgeColor || 'gray']?.text || '#8e8e93', marginTop: '2px', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.badge.split('—')[0].trim()}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Right detail panel ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#0a0a0a' }}>
        <AnimatePresence mode="wait">
          {project && (
            <motion.div key={project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

              {/* ── TRUE 2-COLUMN: left=content, right=image ── */}
              <div style={{ display: 'flex', minHeight: '320px' }}>

                {/* LEFT COLUMN — all content */}
                <div style={{ flex: '0 0 52%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px 24px 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  {project.badge && project.badgeColor && (
                    <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                      style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontFamily: "'DM Mono', monospace", background: badgeStyles[project.badgeColor]?.bg, color: badgeStyles[project.badgeColor]?.text, border: `1px solid ${badgeStyles[project.badgeColor]?.border}`, marginBottom: '10px', width: 'fit-content' }}>
                      {project.badge}
                    </motion.span>
                  )}
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: '#f0f0f2', lineHeight: 1.15, minHeight: '32px', marginBottom: '6px' }}>
                    {typedTitle}<span style={{ opacity: typedTitle.length < (project?.name?.length ?? 0) ? 1 : 0, color: 'var(--pk-accent)' }}>▊</span>
                  </h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '14px' }}>{typedTagline}</p>
                  {project.orchestration && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginBottom: '14px' }}>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ border: '1px solid color-mix(in srgb, var(--pk-accent) 30%, transparent)', background: 'var(--pk-accent-dim)' }}>
                        <Cpu size={10} color="var(--pk-accent)" />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'var(--pk-accent)' }}>{project.orchestration}</span>
                      </div>
                    </motion.div>
                  )}
                  {/* Highlight cards in left column */}
                  {project.highlights && project.highlights.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      {project.highlights.map((h, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 10px' }}>
                          <div style={{ fontSize: '14px', marginBottom: '3px' }}>{h.icon}</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f0f0f2', lineHeight: 1.3 }}>{h.value}</div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{h.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {/* Tech tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {project.tech.slice(0, 6).map((t, i) => (
                      <motion.span key={t} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.04 }}
                        style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '10px', fontFamily: "'DM Mono', monospace", background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {t}
                      </motion.span>
                    ))}
                    {project.tech.length > 6 && (
                      <span style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '10px', fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.25)' }}>+{project.tech.length - 6} more</span>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN — image, no overlays */}
                <motion.div style={{ flex: '0 0 48%', overflow: 'hidden' }}
                  initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
                  <img src={project.image} alt={project.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                </motion.div>
              </div>

              {/* ── Divider ── */}
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.4 }}
                style={{ height: '1px', background: 'linear-gradient(to right, color-mix(in srgb, var(--pk-accent) 40%, transparent), rgba(255,255,255,0.06), transparent)', transformOrigin: 'left', margin: '0 24px' }} />

              {/* ── Content area below ── */}
              <div className="px-6 pb-8 pt-5">

                {/* Description */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                  style={{ fontSize: '13px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.8, marginBottom: '20px' }}>
                  {project.description}
                </motion.p>

                {/* Architecture diagram */}
                {project.arch && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-6" style={{ height: '180px' }}>
                    <ArchDiagram nodes={project.arch.nodes} edges={project.arch.edges} />
                  </motion.div>
                )}

                {/* All tech tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((t, i) => (
                    <motion.span key={t} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 + i * 0.04 }}
                      style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: "'DM Mono', monospace", background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {t}
                    </motion.span>
                  ))}
                </div>

                {/* Links */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex flex-wrap gap-3">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-all hover:brightness-110"
                      style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: 'rgba(255,255,255,0.08)', color: '#f0f0f2', border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none' }}>
                      <Github size={13} /> GitHub
                    </a>
                  )}
                  {project.demo && (
                    <a href={project.demo} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-all hover:brightness-110"
                      style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: 'var(--pk-accent)', color: 'white', textDecoration: 'none' }}>
                      <ExternalLink size={13} /> Live Demo
                    </a>
                  )}
                  {project.valueProp && (
                    <button
                      onClick={() => setShowCareerForge(true)}
                      className="inline-flex items-center gap-2 transition-all"
                      style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,115,22,0.4)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                      <ExternalLink size={12} /> Value Proposition
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
