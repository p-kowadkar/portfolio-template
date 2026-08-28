export interface ExpHighlight {
  icon: string;
  label: string;
  value: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  detail: string | null;
  period: string;
  current: boolean;
  bullets: string[];
  tech: string[];
  image: string;
  highlights?: ExpHighlight[];
  originStory?: string; // Journey snippet — the human story behind the role
  haiku?: string; // haiku id for easter egg
}

export const experience: Experience[] = [
  {
    id: 'mock-experience-1',
    role: 'Software Engineer',
    company: 'Mock Experience 1: Company A',
    detail: null,
    period: 'Jun 2021 — Aug 2023',
    current: false,
    bullets: [
      'Built and shipped 3 internal tools that cut manual reporting time by ~30%',
      'Migrated a legacy monolith to a modular architecture with zero downtime',
      'Mentored 2 junior engineers through their first production releases',
    ],
    tech: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    image: '/data/mock-experience-1.svg',
  },
  {
    id: 'mock-experience-2',
    role: 'Data Analyst Intern',
    company: 'Mock Experience 2: Company B',
    detail: 'Summer Internship',
    period: 'Jun 2020 — Aug 2020',
    current: false,
    bullets: [
      'Automated a weekly reporting pipeline, saving ~5 hours/week of manual work',
      'Built dashboards used by 3 cross-functional teams to track KPIs',
    ],
    tech: ['Python', 'SQL', 'Tableau'],
    image: '/data/mock-experience-2.svg',
  },
  {
    id: 'njit',
    role: 'AI Engineer',
    company: 'ReferenceExperience: NJIT Brain Connectivity Lab',
    detail: null,
    period: 'March 2025 — Present',
    current: true,
    bullets: [
      'RAG pipeline for neuroimaging research — 31% faster document search, 18% higher QA accuracy over vanilla LLM baselines',
      'Transformer architectures for fMRI classification — 89% accuracy on cognitive state detection from 90k+ voxel time-series',
      'Attention mechanisms for brain region interpretability — 28% improvement in expert interpretability scores',
      'Integrated Neurosynth neuroimaging data with structured DNN retrievers (brain-cog-rag)',
    ],
    tech: ['PyTorch', 'Transformers', 'RAG', 'LangChain', 'fMRI', 'Python', 'LLM fine-tuning'],
    image: '/data/YDDmbxXFKwpLTzSx.webp',
  },
];
