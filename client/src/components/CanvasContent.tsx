// CanvasContent — shared inner component for the Canvas app. Looks up a
// project by id and renders its name/tagline/description/architecture
// diagram. Desktop (CanvasApp.tsx) and mobile (MobileCanvas.tsx) are thin
// platform wrappers around this so the actual content logic lives in one
// place instead of being copy-pasted between the two shells.
import { motion } from 'framer-motion';
import { projects } from '../data/projects';
import ArchDiagram from './ArchDiagram';

export default function CanvasContent({ projectId }: { projectId: string | undefined }) {
  const project = projectId ? projects.find((p) => p.id === projectId) : undefined;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          No project selected
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', maxWidth: '320px' }}>
          Open Canvas from a project in Projects to see its architecture here.
        </p>
      </div>
    );
  }

  return (
    <motion.div key={project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-[720px] mx-auto">
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: '#f0f0f2', lineHeight: 1.15, marginBottom: '6px' }}>
          {project.name}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--pk-accent)', lineHeight: 1.6, marginBottom: '18px' }}>{project.tagline}</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.8, marginBottom: '24px' }}>{project.description}</p>

        {project.arch ? (
          <div style={{ height: '260px' }}>
            <ArchDiagram nodes={project.arch.nodes} edges={project.arch.edges} />
          </div>
        ) : (
          <div
            className="flex items-center justify-center text-center"
            style={{
              height: '180px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px dashed rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '12px',
              fontFamily: "'DM Mono', monospace",
              padding: '0 24px',
            }}
          >
            no architecture diagram available for this project yet
          </div>
        )}
      </div>
    </motion.div>
  );
}
