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
    id: 'mock-project-1',
    name: 'Mock Project 1: Recipe Recommender',
    badge: null,
    badgeColor: null,
    tagline: 'AI-powered recipe suggestions from what\'s in your fridge',
    description: `A weekend project exploring multimodal LLM inputs. A vision model identifies ingredients from a fridge photo, then recommends recipes ranked by prep time and dietary fit. This is placeholder content — swap it out with your own project's name, tagline, description, tech stack, and links.`,
    orchestration: null,
    tech: ['Python', 'FastAPI', 'OpenAI Vision', 'React'],
    github: 'https://github.com/your-username/mock-project-1',
    demo: null,
    image: '/data/mock-project-1.svg',
  },
  {
    id: 'mock-project-2',
    name: 'Mock Project 2: Habit Tracker CLI',
    badge: '🚧 In Development',
    badgeColor: 'blue',
    tagline: 'A terminal-first habit tracker with streak visualization',
    description: `A minimal command-line tool for tracking daily habits without leaving the terminal. Local-first, no accounts, SQLite-backed. This is placeholder content — swap it out with your own project's name, tagline, description, tech stack, and links.`,
    orchestration: null,
    tech: ['Rust', 'SQLite', 'Clap'],
    github: 'https://github.com/your-username/mock-project-2',
    demo: null,
    image: '/data/mock-project-2.svg',
  },
  {
    id: 'careerforge',
    name: 'ReferenceProject: CareerForge',
    badge: '🔴 Live Product',
    badgeColor: 'red',
    tagline: 'End-to-end AI job application automation',
    description: `Production system actively running a 20+ application/day job search. ResumeForge, CoverForge, ForgeScore, Company Intelligence (live Firecrawl scraping + Health Score), Contact Finder, voice-to-voice InterviewAI (ElevenLabs), Kanban tracker, BYOK for 7+ LLM providers with pgcrypto encryption. Kept in as a fully-filled-out reference — see the shape a finished entry can take, including the optional architecture diagram below.`,
    orchestration: 'Hierarchical Multi-Agent (CareerCouncil: Brian → Rita‖Marcus → Robin → Ryan)',
    tech: ['React', 'TypeScript', 'Supabase', 'FastAPI', 'ElevenLabs', 'Firecrawl', 'Multi-agent', 'pgcrypto'],
    github: null,
    demo: 'https://www.forge-your-future.com',
    valueProp: 'https://p-kowadkar.github.io/careerforge',
    image: '/data/gKtqpVEtftDLBUdX.jpg',
    arch: {
      nodes: [
        { id: 'brian', label: 'Brian · Intake', type: 'master', x: 8, y: 50 },
        { id: 'rita', label: 'Rita · Resume', type: 'agent', x: 28, y: 25 },
        { id: 'marcus', label: 'Marcus · Cover', type: 'agent', x: 28, y: 75 },
        { id: 'robin', label: 'Robin · ATS Score', type: 'agent', x: 50, y: 50 },
        { id: 'ryan', label: 'Ryan · Interview', type: 'agent', x: 70, y: 50 },
        { id: 'elevenlabs', label: 'ElevenLabs Voice', type: 'io', x: 70, y: 85 },
        { id: 'kanban', label: 'Kanban Tracker', type: 'io', x: 90, y: 50 },
      ],
      edges: [
        { from: 'brian', to: 'rita' },
        { from: 'brian', to: 'marcus' },
        { from: 'rita', to: 'robin' },
        { from: 'marcus', to: 'robin' },
        { from: 'robin', to: 'ryan' },
        { from: 'ryan', to: 'elevenlabs', style: 'dashed' },
        { from: 'ryan', to: 'kanban' },
        { from: 'robin', to: 'kanban' },
      ],
    },
  },
];
