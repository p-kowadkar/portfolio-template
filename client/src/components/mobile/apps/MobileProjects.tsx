// MobileProjects — iOS card-style projects browser
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ExternalLink, Github, X } from 'lucide-react';
import { projects } from '../../../data/projects';

export default function MobileProjects({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const project = projects.find((p) => p.id === selected);

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10" style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#e53e3e]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">Projects</h1>
        <span className="text-white/30 text-xs font-mono">{projects.length} items</span>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {projects.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(p.id)}
            className="rounded-2xl overflow-hidden cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Project image */}
            <div className="relative h-36 overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" style={{ filter: 'brightness(0.7)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)' }} />
              {p.badge && (
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(255,214,10,0.15)', color: '#ffd60a', border: '1px solid rgba(255,214,10,0.3)' }}>
                    {p.badge}
                  </span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-semibold text-base">{p.name}</h3>
                <p className="text-white/60 text-xs mt-0.5">{p.tagline}</p>
              </div>
            </div>
            {/* Tech tags */}
            <div className="px-3 py-2 flex gap-1.5 flex-wrap">
              {p.tech.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {t}
                </span>
              ))}
              {p.tech.length > 4 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'rgba(255,255,255,0.25)' }}>+{p.tech.length - 4}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Project detail sheet */}
      <AnimatePresence>
        {project && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#0a0a0a' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Hero image */}
            <div className="relative h-56 flex-shrink-0">
              <img src={project.image} alt={project.name} className="w-full h-full object-cover" style={{ filter: 'brightness(0.6)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0a 0%, transparent 60%)' }} />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-12 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
              >
                <X size={16} color="white" />
              </button>
              {project.badge && (
                <div className="absolute top-12 left-4">
                  <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(255,214,10,0.15)', color: '#ffd60a', border: '1px solid rgba(255,214,10,0.3)' }}>
                    {project.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              <h2 className="text-white font-bold text-2xl mt-4 mb-1">{project.name}</h2>
              <p className="text-[#e53e3e] text-sm mb-4">{project.tagline}</p>
              <p className="text-white/70 text-sm leading-relaxed mb-5">{project.description}</p>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tech.map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {t}
                  </span>
                ))}
              </div>

              {/* Links */}
              <div className="flex gap-3 flex-wrap">
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Github size={14} /> GitHub
                  </a>
                )}
                {project.demo && (
                  <a href={project.demo} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: '#e53e3e', color: 'white', textDecoration: 'none' }}>
                    <ExternalLink size={14} /> Live Demo
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
