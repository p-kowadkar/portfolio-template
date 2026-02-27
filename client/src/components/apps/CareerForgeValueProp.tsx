// Design: Netflix-dark · CareerForge Value Proposition overlay
// Colors: #0a0a0a bg, var(--pk-accent) Netflix red accent, #f97316 forge-orange for CareerForge brand
// Typography: DM Serif Display (headings), DM Mono (labels/tags), Outfit (body)
// Matches the ProjectsApp Netflix aesthetic exactly

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const FEATURES = [
  {
    icon: '📄',
    name: 'ResumeForge',
    desc: 'Proprietary multi-pass pipeline that selects and formats the most relevant experience from your master resume for any given JD. Output is a perfectly formatted, single-page PDF — server-side rendered, instant download.',
    tags: ['Proprietary pipeline', 'Single-page PDF', 'ATS-tuned'],
  },
  {
    icon: '✉️',
    name: 'CoverForge',
    desc: 'Auto-extracts company and role from a pasted JD — no manual entry. Same proprietary pipeline as ResumeForge. Tone and structure adapt dynamically to industry and seniority level detected in the JD.',
    tags: ['Auto-extract JD', 'Tone-aware', 'PDF output'],
  },
  {
    icon: '📊',
    name: 'ForgeScore',
    desc: '100-point resume scoring across Experience (40), Technical Skills (30), Education (15), Projects (15). Gives specific, actionable improvement suggestions — not vague "quantify your impact" advice.',
    tags: ['4-dimension scoring', 'Actionable gaps'],
  },
  {
    icon: '🏢',
    name: 'Company Intelligence',
    desc: 'Live web scraping via Firecrawl. Returns a Health Score (0–100), H1B sponsorship trend, layoff history timeline, Glassdoor-style sentiment breakdown, funding runway, hiring cycle predictions, and AI-generated red/green flags.',
    tags: ['Firecrawl', 'H1B tracker', 'Layoff history', 'Health score'],
  },
  {
    icon: '🤝',
    name: 'Contact Finder',
    desc: 'Generates 5–8 realistic target contacts (recruiters, HMs, ICs, directors) with LinkedIn search hints, email pattern heuristics, priority ranking, and ready-to-send personalized outreach templates.',
    tags: ['Outreach templates', 'Priority ranked'],
  },
  {
    icon: '🎤',
    name: 'InterviewAI',
    desc: 'Voice-to-voice mock interviews powered by ElevenLabs Scribe v2 (STT) + TTS. Configure interviewer personality (Professional / Friendly / Tough / Technical). End-of-session report with per-question scoring and trend tracking.',
    tags: ['ElevenLabs', 'Voice-to-voice', 'Session reports'],
    tagsIce: true,
  },
];

const ROADMAP = [
  {
    tag: 'Live Now',
    tagColor: '#22c55e',
    tagBg: 'rgba(34,197,94,0.1)',
    tagBorder: 'rgba(34,197,94,0.2)',
    title: 'Command Center v1',
    items: ['ResumeForge + CoverForge + ForgeScore', 'Company Intelligence with Health Score', 'Contact Finder with outreach templates', 'Voice-to-voice InterviewAI (ElevenLabs)', 'Kanban application pipeline tracker', 'BYOK for 7+ LLM providers (encrypted)', 'Hope — floating voice AI assistant'],
  },
  {
    tag: 'In Progress',
    tagColor: '#f97316',
    tagBg: 'rgba(249,115,22,0.1)',
    tagBorder: 'rgba(249,115,22,0.2)',
    title: 'Multi-Agent Layer',
    items: ['Telegram Council — 4 bots, FastAPI + n8n', 'CareerCouncil web — 5-agent pipeline', 'Robin (evidence extractor) + Ryan (doc gen)', 'Redis artifact caching by JD fingerprint', 'Per-agent model tier routing', 'Session sidebar + job history'],
  },
  {
    tag: 'Next Up',
    tagColor: '#38bdf8',
    tagBg: 'rgba(56,189,248,0.1)',
    tagBorder: 'rgba(56,189,248,0.2)',
    title: 'Platform Expansion',
    items: ['35+ ATS auto-fill support', 'Automated job discovery pipeline', 'Daily application digest via Telegram', 'Follow-up reminder automation', 'LinkedIn message scheduling', 'Application analytics dashboard'],
  },
  {
    tag: 'Horizon',
    tagColor: 'rgba(255,255,255,0.3)',
    tagBg: 'rgba(255,255,255,0.04)',
    tagBorder: 'rgba(255,255,255,0.1)',
    title: 'SaaS / Open Source',
    items: ['Freemium + BYOK SaaS model', 'Open-source community release', 'YC consideration pathway', 'n8n community workflow sharing', 'Interview pattern analysis (longitudinal)', 'Recruiter-side tooling'],
    dashed: true,
  },
];

const STACK = [
  { label: 'frontend', value: 'React 18 · TypeScript · Vite · Tailwind · shadcn/ui' },
  { label: 'backend', value: 'Supabase Edge Functions · FastAPI · Python 3.11' },
  { label: 'ai', value: 'Claude API · Gemini · GPT · Multi-model routing' },
  { label: 'voice', value: 'ElevenLabs STT (Scribe v2) + TTS + Conversational AI' },
  { label: 'scraping', value: 'Firecrawl (scrape + search)' },
  { label: 'agents', value: 'Multi-agent orchestration · n8n Pro workflows' },
  { label: 'infra', value: 'Supabase · Redis · PostgreSQL · Docker · Railway' },
  { label: 'security', value: 'pgcrypto AES · RLS · SECURITY DEFINER' },
];

export default function CareerForgeValueProp({ onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        key="cf-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '24px 16px 40px',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{
            width: '100%', maxWidth: '760px',
            background: '#0d0d0f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', overflow: 'hidden',
            fontFamily: "'Outfit', sans-serif",
            position: 'relative',
          }}
        >
          {/* Background glow blobs */}
          <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '400px', height: '400px', background: 'rgba(249,115,22,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '60px', left: '-100px', width: '350px', height: '350px', background: 'color-mix(in srgb, var(--pk-accent) 4%, transparent)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#f0f0f2'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <X size={16} />
          </button>

          <div style={{ padding: '40px 36px 48px', position: 'relative', zIndex: 1 }}>

            {/* ── HEADER ── */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.08)', padding: '5px 14px', borderRadius: '100px', marginBottom: '20px', textTransform: 'uppercase' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
                Candidate Value Summary · Feb 2026
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 6vw, 58px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#f0f0f2', marginBottom: '12px' }}>
                Career<span style={{ color: '#f97316', fontStyle: 'italic' }}>Forge</span>
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7, fontWeight: 400 }}>
                End-to-end AI job application automation — from JD to tailored resume, company intel, contacts, and voice interview prep.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                {['Web App · Live', 'Telegram · Multi-Agent', 'Council Mode · In Progress', 'BYOK · Freemium'].map((chip) => (
                  <span key={chip} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.04em' }}>{chip}</span>
                ))}
              </div>
            </div>

            {/* ── DIVIDER ── */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '0 0 36px' }} />

            {/* ── PROBLEM STRIP ── */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '28px 32px', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, #f97316, transparent)' }} />
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#f0f0f2', marginBottom: '10px' }}>The job hunt is broken for technical candidates</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13.5px', lineHeight: 1.75, maxWidth: '620px' }}>
                Applying for 20+ roles a day while tailoring every resume, researching every company, finding the right contacts, and preparing for voice interviews — it's a full-time job on top of your full-time job. Most tools handle one piece. CareerForge automates the entire pipeline.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                {['Generic resumes get auto-rejected', 'Company research takes 2+ hours per application', 'No time for personalized outreach', 'Interview prep is isolated from context', '35+ ATS systems, each with different quirks'].map((pain) => (
                  <span key={pain} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '4px 12px', borderRadius: '100px' }}>{pain}</span>
                ))}
              </div>
            </div>

            {/* ── SECTION LABEL ── */}
            <SectionLabel>Core Platform · careerforge-command-center</SectionLabel>

            {/* ── FEATURE GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '40px' }}>
              {FEATURES.map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '22px 22px 18px', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'border-color 0.2s, transform 0.2s' }}
                  whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.14)' } as any}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '12px' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f2', marginBottom: '6px', letterSpacing: '-0.01em' }}>{f.name}</h3>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{f.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '12px' }}>
                    {f.tags.map((tag) => (
                      <span key={tag} style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.03em', color: f.tagsIce ? '#38bdf8' : '#f97316', background: f.tagsIce ? 'rgba(56,189,248,0.08)' : 'rgba(249,115,22,0.08)', border: `1px solid ${f.tagsIce ? 'rgba(56,189,248,0.2)' : 'rgba(249,115,22,0.2)'}`, padding: '2px 8px', borderRadius: '100px' }}>{tag}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── BYOK ── */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '28px 32px', marginBottom: '40px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ fontSize: '36px', flexShrink: 0, marginTop: '2px' }}>🔑</div>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '19px', color: '#f0f0f2', marginBottom: '8px' }}>Bring Your Own Key — Full Provider Freedom</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.75 }}>
                  CareerForge is model-agnostic by design. Plug in your own keys and route to any provider you already pay for. Keys are encrypted at rest via pgcrypto (AES pgp_sym_encrypt), validated against provider APIs before saving, and decrypted server-side only inside SECURITY DEFINER functions. No keys, no problem — the platform falls back to a Gemini Flash gateway.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '14px' }}>
                  {['Claude (Sonnet / Opus / Haiku)', 'GPT-5 / GPT-5 mini', 'Gemini 3 Pro / Flash', 'Grok 4.1', 'DeepSeek', 'OpenRouter', 'Custom OpenAI-compatible'].map((p) => (
                    <span key={p} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '3px 10px', borderRadius: '100px' }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── AGENT PIPELINE ── */}
            <SectionLabel>Where It's Heading · Advisory Intelligence Layer</SectionLabel>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '28px', marginBottom: '16px', overflowX: 'auto' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>careerforge_Telegram → CareerCouncil · multi-agent council pipeline</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: 'max-content' }}>
                <PipelineNode name="🧠 Brian" role="Router" accent="#f97316" />
                <Arrow />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>parallel</div>
                  <PipelineNode name="🔍 Rita" role="Company Intel" accent="#38bdf8" />
                  <PipelineNode name="🧭 Marcus" role="Strategy" accent="#38bdf8" />
                </div>
                <Arrow />
                <PipelineNode name="📚 Robin" role="Evidence" accent="#a855f7" />
                <Arrow />
                <PipelineNode name="✍️ Ryan" role="Doc Output" accent="#22c55e" accentBg />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '40px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f0f0f2', marginBottom: '6px' }}>🤖 Telegram Advisory Council</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>4 AI avatars (Brian, Marcus, Ryan, Rita) in a private Telegram group. Real-time chat via FastAPI, multi-step prep pipelines through n8n. Budget-tracked — max 15 LLM calls per thread. Dockerized, Railway-deployable.</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f0f0f2', marginBottom: '6px' }}>🌐 CareerCouncil Web</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>5-agent web interface with per-agent model tiers (Haiku for routing, Sonnet for research, Opus for resume gen). Redis artifact caching by JD fingerprint. Built for the AI Interfaces Hackathon w/ Claude NYC 2026.</div>
              </div>
            </div>

            {/* ── ROADMAP ── */}
            <SectionLabel>Status & Trajectory</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '40px' }}>
              {ROADMAP.map((r) => (
                <div key={r.tag} style={{ background: 'rgba(255,255,255,0.03)', border: `1px ${r.dashed ? 'dashed' : 'solid'} rgba(255,255,255,0.08)`, borderRadius: '12px', padding: '22px' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px', color: r.tagColor, background: r.tagBg, border: `1px solid ${r.tagBorder}` }}>{r.tag}</span>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f2', marginBottom: '10px' }}>{r.title}</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {r.items.map((item) => (
                      <li key={item} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, paddingLeft: '14px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, top: '7px', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* ── TECH STACK ── */}
            <SectionLabel>Tech Stack</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' }}>
              {STACK.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '12px', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', flexShrink: 0, minWidth: '64px' }}>{s.label}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* ── CTA ── */}
            <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#f0f0f2', marginBottom: '8px' }}>Built by someone who needed this</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', lineHeight: 1.7 }}>Not a side project. A production system actively running the job search — 20+ applications a day, fully automated.</p>
              <a href="https://www.forge-your-future.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', background: 'var(--pk-accent)', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'filter 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.15)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)'; }}>
                <ExternalLink size={14} /> Launch CareerForge
              </a>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Small helpers ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '16px' }}>
      {children}
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

function PipelineNode({ name, role, accent, accentBg }: { name: string; role: string; accent: string; accentBg?: boolean }) {
  return (
    <div style={{ background: accentBg ? `${accent}0d` : 'rgba(255,255,255,0.04)', border: `1px solid ${accent}55`, borderRadius: '8px', padding: '10px 14px', textAlign: 'center', minWidth: '90px' }}>
      <div style={{ fontSize: '12px', fontWeight: 500, color: '#f0f0f2', marginBottom: '2px' }}>{name}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>{role}</div>
    </div>
  );
}

function Arrow() {
  return <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px', padding: '0 6px', flexShrink: 0 }}>→</div>;
}
