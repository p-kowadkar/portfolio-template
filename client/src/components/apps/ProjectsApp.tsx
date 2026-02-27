// Design: Netflix-dark · 2-column layout (content left, image right)
// Everything animates dynamically — title types in, image scales up, cards stagger, bullets appear one by one
// Architecture diagram: frosted-glass SVG, nodes type themselves, edges draw in
// Color: #0a0a0a bg, var(--pk-accent) accent, #f5f5f1 body
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Cpu } from 'lucide-react';
import { projects, type ArchNode, type ArchEdge } from '../../data/projects';
import CareerForgeValueProp from './CareerForgeValueProp';

const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  gold: { bg: 'rgba(255, 214, 10, 0.12)', text: '#ffd60a', border: 'rgba(255, 214, 10, 0.3)' },
  red:  { bg: 'rgba(229, 9, 20, 0.12)',   text: '#ff453a', border: 'rgba(229, 9, 20, 0.3)' },
  gray: { bg: 'rgba(142, 142, 147, 0.12)', text: '#8e8e93', border: 'rgba(142, 142, 147, 0.3)' },
  blue: { bg: 'rgba(10, 132, 255, 0.12)',  text: '#0a84ff', border: 'rgba(10, 132, 255, 0.3)' },
};

const nodeColors: Record<ArchNode['type'], { fill: string; stroke: string; text: string }> = {
  master: { fill: 'var(--pk-accent-dim)',   stroke: 'var(--pk-accent)', text: '#ff6b6b' },
  agent:  { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.25)', text: 'rgba(255,255,255,0.8)' },
  async:  { fill: 'rgba(10,132,255,0.12)',  stroke: 'rgba(10,132,255,0.5)', text: '#60a5fa' },
  io:     { fill: 'rgba(52,199,89,0.10)',   stroke: 'rgba(52,199,89,0.4)', text: '#4ade80' },
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

/* ── Frosted-glass architecture diagram ── */
function ArchDiagram({ nodes, edges }: { nodes: ArchNode[]; edges: ArchEdge[] }) {
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const [visibleEdges, setVisibleEdges] = useState<Set<number>>(new Set());
  const [typedLabels, setTypedLabels] = useState<Record<string, string>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisibleNodes(new Set());
    setVisibleEdges(new Set());
    setTypedLabels({});

    nodes.forEach((node, i) => {
      const t = setTimeout(() => {
        setVisibleNodes((prev) => new Set(Array.from(prev).concat(node.id)));
        let charIdx = 0;
        const iv = setInterval(() => {
          charIdx++;
          setTypedLabels((prev) => ({ ...prev, [node.id]: node.label.slice(0, charIdx) }));
          if (charIdx >= node.label.length) clearInterval(iv);
        }, 35);
      }, i * 110);
      timers.current.push(t);
    });

    const edgeStart = nodes.length * 110 + 80;
    edges.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleEdges((prev) => new Set(Array.from(prev).concat(i)));
      }, edgeStart + i * 70);
      timers.current.push(t);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [nodes, edges]);

  const W = 400, H = 200;
  const px = (x: number) => (x / 100) * W;
  const py = (y: number) => (y / 100) * H;
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
      <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--pk-accent) 55%, transparent)', fontFamily: "'DM Mono', monospace", zIndex: 2 }}>
        architecture
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="eg" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ng" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="aw" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.2)" /></marker>
          <marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="color-mix(in srgb, var(--pk-accent) 50%, transparent)" /></marker>
          <marker id="ab" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="rgba(10,132,255,0.5)" /></marker>
        </defs>
        {edges.map((edge, i) => {
          const from = getNode(edge.from), to = getNode(edge.to);
          if (!from || !to || !visibleEdges.has(i)) return null;
          const x1 = px(from.x), y1 = py(from.y), x2 = px(to.x), y2 = py(to.y);
          const isRed = from.type === 'master';
          const isBlue = from.type === 'async' || to.type === 'async';
          const stroke = isRed ? 'color-mix(in srgb, var(--pk-accent) 45%, transparent)' : isBlue ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.15)';
          const marker = isRed ? 'ar' : isBlue ? 'ab' : 'aw';
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          return (
            <motion.path key={i} d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              stroke={stroke} strokeWidth={edge.style === 'dashed' ? 1 : 1.2}
              strokeDasharray={edge.style === 'dashed' ? '4 3' : undefined}
              fill="none" markerEnd={`url(#${marker})`} filter="url(#eg)"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }} />
          );
        })}
        {nodes.map((node) => {
          if (!visibleNodes.has(node.id)) return null;
          const cx = px(node.x), cy = py(node.y);
          const c = nodeColors[node.type];
          const label = typedLabels[node.id] ?? '';
          const isTyping = label.length < node.label.length;
          return (
            <motion.g key={node.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <rect x={cx - 42} y={cy - 12} width={84} height={24} rx={6} fill={c.fill} stroke={c.stroke} strokeWidth={node.type === 'master' ? 1.5 : 0.8} filter={node.type === 'master' ? 'url(#ng)' : undefined} />
              <text x={cx} y={cy + 4} textAnchor="middle" fill={c.text} fontSize={8.5} fontFamily="'DM Mono', monospace" letterSpacing="0.03em">
                {label}{isTyping && <tspan fill={c.stroke} opacity={0.8}>▊</tspan>}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
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
