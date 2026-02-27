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
    id: 'njit',
    role: 'AI Engineer',
    company: 'NJIT Brain Connectivity Lab',
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
  {
    id: 'vandoo',
    role: 'Programmer Analyst',
    company: 'Vandoo LLC',
    detail: null,
    period: 'Nov 2024 — Feb 2025',
    current: false,
    bullets: [
      'Oracle/PL-SQL pipeline revamp — 20% query speed improvement, streamlined batch financial processing',
      'Custom Prometheus exporters for Oracle KPIs (query latency, tablespace usage)',
      'Grafana dashboards + alerting — 45% reduction in system outages',
      'AWS Lambda observability pipeline (CloudWatch + Grafana)',
    ],
    tech: ['Python', 'Oracle', 'PL/SQL', 'AWS', 'Grafana', 'Prometheus', 'PostgreSQL'],
    image: '/data/iQbTNNvHhLpWissJ.webp',
  },
  {
    id: 'jerseystem',
    role: 'Data Scientist',
    company: 'JerseySTEM',
    detail: null,
    period: 'Feb 2024 — Nov 2024',
    current: false,
    bullets: [
      'Automated data cleaning on 1M+ records using SQL + pandas workflows',
      'Airflow pipelines on AWS EC2 — 40% reduction in manual effort, 25% operational efficiency gain',
      'Looker Studio executive dashboards for program impact and student engagement',
    ],
    tech: ['Python', 'SQL', 'Airflow', 'AWS EC2', 'Looker Studio', 'Pandas'],
    image: '/data/rwmKbbgyEcfPwUVd.webp',
  },
  {
    id: 'bayer',
    role: 'Data Engineer',
    company: 'Bayer',
    detail: null,
    period: 'Sep 2023 — Dec 2023',
    current: false,
    bullets: [
      'Databricks pipelines for Snowflake healthcare data — 3 marketing personas, 22% ROI boost',
      'PowerBI dashboards with DAX — 121+ behavior metrics visualized',
      'Azure Data Factory real-time ETL for point-of-sale data — 18% campaign performance lift',
    ],
    tech: ['Databricks', 'Spark', 'Snowflake', 'PowerBI', 'Azure Data Factory', 'Python'],
    image: '/data/QxpIVkVypsYlgrJA.webp',
  },
  {
    id: 'dassault',
    role: 'R&D Software Engineer',
    company: 'Dassault Systèmes',
    detail: 'CATIA · C/C++ · 2.4 years',
    period: 'Apr 2020 — Jul 2022',
    current: false,
    bullets: [
      'Fixed 10+ critical memory bugs in CATIA using C/C++ — 20% crash rate reduction',
      'Led CATIA Linux migration — resolved 20+ platform errors, 40% less migration downtime',
      'Python test automation framework for CADAM — 87% faster execution, 35% more coverage',
      'Automated analytics pipeline (JSON → reports) saving 3+ hours/week',
    ],
    tech: ['C/C++', 'Python', 'Linux', 'CATIA', 'Pandas', 'Apache', 'Test automation'],
    image: '/data/DMHWEmpdlGqmgCvp.webp',
  },
  {
    id: 'nal',
    role: 'Project Assistant',
    company: 'National Aerospace Laboratories',
    detail: 'VTOL UAV',
    period: 'Dec 2019 — Mar 2020',
    current: false,
    bullets: [
      '17% VTOL UAV design efficiency improvement via CFD + Python stats on 1,500+ wind tunnel data points',
      'CATIA V5 propeller optimization — 8.5% performance improvement across 12 blueprints',
      'Stress-strain reporting automation — reduced report time from 6 hours to 45 minutes',
    ],
    tech: ['Python', 'CATIA V5', 'CFD', 'Tableau', 'Matplotlib', 'NumPy'],
    image: '/data/bOYiVhVrAlLhRnhF.webp',
  },
  {
    id: 'cognizant',
    role: 'Programmer Analyst',
    company: 'Cognizant Technology Solutions',
    detail: 'Banking',
    period: 'Dec 2018 — Oct 2019',
    current: false,
    bullets: [
      'C# transaction engine — automated exception handling, 75% less manual reconciliation, 25% faster ₹11.2M+ daily settlements',
      'Multithreading refactor — batch processing time cut from 6 hours to 4.5 hours for 50K+ records',
      '15+ stored procedures and index redesigns — 35% query latency reduction',
    ],
    tech: ['C#', '.NET', 'SQL Server', 'OOP', 'Multithreading', 'Python'],
    image: '/data/mPasRLraFLtbGbtl.webp',
  },
];
