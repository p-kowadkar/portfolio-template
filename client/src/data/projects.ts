export interface ProjectHighlight {
  icon: string;
  label: string;
  value: string;
}

export interface ArchNode {
  id: string;
  label: string;
  type: 'master' | 'agent' | 'async' | 'io';
  x: number; // 0-100 percent
  y: number; // 0-100 percent
}

export interface ArchEdge {
  from: string;
  to: string;
  style?: 'solid' | 'dashed';
}

export interface ProjectArch {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface Project {
  id: string;
  name: string;
  badge: string | null;
  badgeColor: 'gold' | 'red' | 'gray' | 'blue' | null;
  tagline: string;
  description: string;
  orchestration: string | null;
  tech: string[];
  github: string | null;
  demo: string | null;
  valueProp?: string;
  image: string;
  highlights?: ProjectHighlight[];
  arch?: ProjectArch;
}

export const projects: Project[] = [
  {
    id: 'search-sentinel',
    name: 'Search Sentinel',
    badge: '🏆 1st Place — Pulse NYC Hackathon',
    badgeColor: 'gold',
    tagline: 'Agentic brand visibility tracking across AI search engines',
    description: `Built in 7 hours during a NYC snowstorm. Search Sentinel tracks how brands and content rank in AI-powered search responses (ChatGPT, Perplexity, Claude) — the search layer that's replacing Google. Multi-agent orchestration handles real-time analysis across multiple AI search platforms simultaneously.`,
    orchestration: 'Multi-Agent (Parallel)',
    tech: ['Python', 'FastAPI', 'Multi-agent orchestration', 'AI Search APIs', 'Real-time processing'],
    github: 'https://github.com/p-kowadkar/search-sentinel',
    demo: null,
    image: '/data/DCScRiPpkHDNleBZ.jpg',
  },
  {
    id: 'ez-oncall',
    name: 'EZ OnCall',
    badge: '🏆 n8n Sponsor Prize — ElevenLabs Global Hackathon',
    badgeColor: 'gold',
    tagline: 'Voice-first DevOps agent for hands-free incident response',
    description: `Voice-controlled DevOps agent that lets you manage infrastructure without touching a keyboard. Speak a command, get a response, trigger automations — all through ElevenLabs speech synthesis and n8n workflow orchestration.`,
    orchestration: null,
    tech: ['Python', 'ElevenLabs', 'n8n', 'FastAPI', 'Voice AI', 'DevOps automation'],
    github: 'https://github.com/p-kowadkar/ez-oncall',
    demo: null,
    image: '/data/XgiGNuHEBHgdxuHZ.jpg',
  },
  {
    id: 'careerforge',
    name: 'CareerForge',
    badge: '🔴 Live Product',
    badgeColor: 'red',
    tagline: 'End-to-end AI job application automation',
    description: `Production system actively running a 20+ application/day job search. ResumeForge, CoverForge, ForgeScore, Company Intelligence (live Firecrawl scraping + Health Score), Contact Finder, voice-to-voice InterviewAI (ElevenLabs), Kanban tracker, BYOK for 7+ LLM providers with pgcrypto encryption.`,
    orchestration: 'Hierarchical Multi-Agent (CareerCouncil: Brian → Rita‖Marcus → Robin → Ryan)',
    tech: ['React', 'TypeScript', 'Supabase', 'FastAPI', 'ElevenLabs', 'Firecrawl', 'Multi-agent', 'pgcrypto'],
    github: null,
    demo: 'https://www.forge-your-future.com',
    valueProp: 'https://p-kowadkar.github.io/careerforge',
    image: '/data/gKtqpVEtftDLBUdX.jpg',
  },
  {
    id: 'prometheus',
    name: 'PrometheusAI',
    badge: null,
    badgeColor: null,
    tagline: 'Self-improving multi-agent research system — 21x relevance improvement',
    description: `5-agent sequential pipeline (Architect → Scout → Analyst → Validator → Synthesizer) that researches, validates, and synthesizes information with intra-stage parallelism for concurrent source processing. Adaptive learning system with reward-based strategy optimization.`,
    orchestration: 'Sequential Pipeline Orchestration',
    tech: ['Python', 'You.com API', 'Multi-agent', 'SQLite', 'Gradio', 'Adaptive learning'],
    github: 'https://github.com/p-kowadkar/PrometheusAI',
    demo: null,
    image: '/data/MufdsTStkpGeNydc.jpg',
  },
  {
    id: 'poltergeist',
    name: 'Project Poltergeist',
    badge: '🔒 Closed Source',
    badgeColor: 'gray',
    tagline: 'Multi-agent AI assistant with hierarchical + async validator architecture',
    description: `Hierarchical orchestration with a twist: Phantomlord (master orchestrator) dispatches specialist agents top-down — CoderGhost, MCQGhost, MathGhost, CloudGhost, DataGhost, ArchitectGhost, OperatorGhost. Oracle runs as a detached async validator — Phantomlord doesn't wait for it. Ghost delivers in ~2s, Oracle researches in ~30s background and auto-improves the response without blocking delivery. Proprietary closed-source system.`,
    orchestration: 'Hierarchical + Async Validator (novel pattern)',
    tech: ['Python', 'Multi-agent orchestration', 'Voice AI', 'Faster-Whisper', 'Deepgram', 'Vision AI'],
    github: null,
    demo: null,
    image: '/data/tzuiMmLETnBMBhqE.jpg',
  },
  {
    id: 'smriti',
    name: 'Smriti',
    badge: '🚧 In Development',
    badgeColor: 'blue',
    tagline: 'Persistent-memory AI assistant — lazy memory, 1000x storage efficiency',
    description: `Sanskrit for "that which is remembered." Hybrid Rust-Python architecture: Rust core handles performance-critical capture and IPC, Python brain handles intelligence and memory. Lazy memory storage pipeline: capture → extract semantic meaning → discard raw data. Remembers across every session, grows smarter over time. Open-source.`,
    orchestration: null,
    tech: ['Python', 'Rust', 'Whisper', 'OCR', 'Vector DB', 'IPC', 'Semantic extraction'],
    github: null,
    demo: null,
    image: '/data/gDnxCrPJMLCuSMhq.jpg',
  },
];
