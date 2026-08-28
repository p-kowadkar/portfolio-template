// ArchDiagram — frosted-glass architecture diagram, animated: nodes type
// themselves in, edges draw in after. Shared by ProjectsApp's Showcase panel
// and the Canvas app (desktop + mobile) so the rendering logic lives in one
// place instead of being duplicated.
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ArchNode, ArchEdge } from '../data/projects';

export const nodeColors: Record<ArchNode['type'], { fill: string; stroke: string; text: string }> = {
  master: { fill: 'var(--pk-accent-dim)',   stroke: 'var(--pk-accent)', text: '#ff6b6b' },
  agent:  { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.25)', text: 'rgba(255,255,255,0.8)' },
  async:  { fill: 'rgba(10,132,255,0.12)',  stroke: 'rgba(10,132,255,0.5)', text: '#60a5fa' },
  io:     { fill: 'rgba(52,199,89,0.10)',   stroke: 'rgba(52,199,89,0.4)', text: '#4ade80' },
};

export default function ArchDiagram({ nodes, edges }: { nodes: ArchNode[]; edges: ArchEdge[] }) {
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

  const W = 560, H = 220;
  const px = (x: number) => (x / 100) * W;
  const py = (y: number) => (y / 100) * H;
  const getNode = (id: string) => nodes.find((n) => n.id === id);
  // Box width tracks the FINAL label length (not the mid-typing partial string) so
  // boxes don't resize while typing in — a hardcoded width regardless of label
  // length is exactly why longer labels overflow and collide with neighboring
  // nodes. 5.8px/char is a generous estimate for this monospace font at 8.5px +
  // 0.03em letter-spacing; err wide, not narrow.
  const boxWidth = (label: string) => Math.max(60, label.length * 5.8 + 16);

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
          const c = nodeColors[node.type];
          const label = typedLabels[node.id] ?? '';
          const isTyping = label.length < node.label.length;
          const w = boxWidth(node.label);
          // A node's own x/y just says where its CENTER wants to be — a wide box on a
          // node placed near the edge (by design, e.g. the last stage of a pipeline at
          // x=90) can still push past the viewBox boundary once its real width is
          // known. Clamping the rendered center, not the data, means no diagram authored
          // now or later can overflow regardless of how close to the edge its x/y sits.
          const cx = Math.min(Math.max(px(node.x), w / 2 + 4), W - w / 2 - 4);
          const cy = py(node.y);
          return (
            <motion.g key={node.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <rect x={cx - w / 2} y={cy - 12} width={w} height={24} rx={6} fill={c.fill} stroke={c.stroke} strokeWidth={node.type === 'master' ? 1.5 : 0.8} filter={node.type === 'master' ? 'url(#ng)' : undefined} />
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
