// MobileMyStory — vertical scrolling chapter timeline
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

const CHAPTERS = [
  {
    id: 'ch1', number: '01', title: 'The Boy Who Built Wings',
    subtitle: 'Belagavi, Karnataka · 2000–2014',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/EPpvubJEovqNLORM.webp',
    pullQuote: '"Every RC plane I built was a proof of concept — that with enough patience and the right components, anything could fly."',
    body: [
      "In a small workshop in Belagavi, Karnataka, a teenager surrounded by balsa wood, copper wire, and circuit boards was quietly becoming an engineer. Before the textbooks, before the degrees, before the algorithms — there were 15 hand-built RC planes.",
      "Each one was a complete engineering project: aerodynamics calculated by hand, electronics soldered at midnight, test flights conducted in the fields outside the city. When one crashed, Pranav didn't see failure — he saw data.",
      "Belagavi gave Pranav something that no curriculum could: the confidence to build from scratch, the patience to debug the physical world, and the hunger to understand not just how things work, but why they work.",
    ],
    stats: [{ label: 'RC Planes Built', value: '15' }, { label: 'Years of Tinkering', value: '8+' }, { label: 'First Flight', value: 'Age 12' }],
  },
  {
    id: 'ch2', number: '02', title: 'National Skies',
    subtitle: 'NAL Bangalore & Cognizant · 2015–2021',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/ZorbHUZjDugTBIlU.webp',
    pullQuote: '"Working on India\'s VTOL UAV program wasn\'t just a job — it was proof that the kid who built RC planes in Belagavi belonged in a national laboratory."',
    body: [
      "The boy who built RC planes grew into an engineer who built UAVs for India's national aerospace program. At the National Aerospace Laboratories (NAL) in Bangalore, Pranav contributed to the VTOL unmanned aerial vehicle project.",
      "From aerospace to enterprise: Cognizant offered a different kind of scale. As a Programmer Analyst, Pranav built automation frameworks that processed millions of records and designed data pipelines that reduced manual effort by 70%.",
      "These years in India were the crucible where technical skill met professional discipline. The question that kept surfacing: what happens when you combine this engineering foundation with the cutting edge of AI?",
    ],
    stats: [{ label: 'UAV Programs', value: '2' }, { label: 'Automation Savings', value: '70%' }, { label: 'Years in Industry', value: '4' }],
  },
  {
    id: 'ch3', number: '03', title: 'The American Chapter',
    subtitle: 'NJIT, New Jersey · 2022–2024',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/smKaeSfYJyAgcwnU.jpg',
    pullQuote: '"Two suitcases, one scholarship, and a city I\'d never seen. Newark was not what I expected. It was exactly what I needed."',
    body: [
      "In September 2022, Pranav landed in Newark with two suitcases and a scholarship. The MS in Data Science at NJIT was a deliberate pivot — not away from engineering, but deeper into it, toward the intersection of data, intelligence, and systems.",
      "NJIT delivered. The coursework was rigorous. The research opportunities were real. Pranav became a Teaching Assistant for Big Data and Data Structures, an AI/ML Instructor for K-12 students at JerseySTEM, and a Data Science Intern at Bayer building RAG pipelines for regulatory documents.",
      "He graduated in May 2024 with a 3.9 GPA and something more valuable than a degree: a clear vision of what he wanted to build and the technical foundation to build it.",
    ],
    stats: [{ label: 'GPA', value: '3.9' }, { label: 'GRE Score', value: '320' }, { label: 'Graduation', value: '2024' }],
  },
  {
    id: 'ch4', number: '04', title: 'Building the Future',
    subtitle: 'Silicon Valley & Beyond · 2024–Present',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/MrKOyokDzaseVyYq.webp',
    pullQuote: '"The job market was broken. So I stopped trying to navigate it and started building the tools to fix it."',
    body: [
      "Graduating with a Master's in Data Science from NJIT in 2024 should have opened every door. The credentials were strong. The skills were real. The timing, however, was complicated.",
      "Rather than being defeated by the paradoxical AI job market, Pranav did what engineers do: he analyzed the system, identified the failure modes, and started building solutions. CareerForge was born from this frustration. Project Poltergeist emerged from the desire for privacy-first AI.",
      "Hackathon wins validated the ideas. The home laboratory became a 24/7 development environment. And slowly, the portfolio of projects evolved into something larger: a vision for how AI could genuinely augment human capability.",
    ],
    stats: [{ label: 'AI Projects Built', value: '6+' }, { label: 'Hackathon Wins', value: '3' }, { label: 'Status', value: 'Building' }],
  },
  {
    id: 'ch5', number: '05', title: 'Speaking to the World',
    subtitle: 'LLM Day NYC · March 6, 2026',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/fzToKMmHAGPjKXfc.jpg',
    pullQuote: '"Production AI systems don\'t fail because of bad models. They fail because of bad architecture."',
    body: [
      "On March 6, 2026, Pranav took the stage at LLM Day NYC to deliver a talk titled \"Multi-Agent Architectures: Solving Production LLM Reliability at Scale.\"",
      "The core argument: production LLM systems face impossible tradeoffs — latency vs accuracy, cost vs quality. Multi-agent architectures dissolve the tradeoff by decomposing tasks, routing intelligently, and using peer review between agents.",
      "The talk covered hierarchical agents, collaborative networks, sequential pipelines, and hybrid architectures. Central to each: LLM-as-Judge — using one model to evaluate another's output, implementing RLAIF without the cost of human annotation.",
    ],
    stats: [{ label: 'Event', value: 'LLM Day NYC' }, { label: 'Date', value: 'Mar 6, 2026' }, { label: 'Topic', value: 'Multi-Agent AI' }],
  },
];

export default function MobileMyStory({ onClose }: { onClose: () => void }) {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const chapter = CHAPTERS.find((c) => c.id === activeChapter);

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10" style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#e53e3e]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">My Story</h1>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto">
        {CHAPTERS.map((ch, i) => (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveChapter(ch.id)}
            className="flex items-center gap-4 px-5 py-4 border-b border-white/5 cursor-pointer active:bg-white/5"
          >
            {/* Chapter number */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={ch.image} alt={ch.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.7)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[#e53e3e] text-xs font-mono">{ch.number}</span>
                <h3 className="text-white text-sm font-semibold truncate">{ch.title}</h3>
              </div>
              <p className="text-white/40 text-xs mt-0.5 truncate">{ch.subtitle}</p>
            </div>
            <ChevronLeft size={16} className="text-white/30 rotate-180 flex-shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Chapter detail */}
      <AnimatePresence>
        {chapter && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
            style={{ background: '#0a0a0a' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Hero */}
            <div className="relative h-64 flex-shrink-0">
              <img src={chapter.image} alt={chapter.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.55)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0a 0%, transparent 50%)' }} />
              <button
                onClick={() => setActiveChapter(null)}
                className="absolute top-12 left-4 flex items-center gap-1 text-[#e53e3e]"
              >
                <ChevronLeft size={22} />
                <span className="text-sm">My Story</span>
              </button>
              <div className="absolute bottom-4 left-5">
                <span className="text-[#e53e3e] text-xs font-mono">{chapter.number}</span>
                <h2 className="text-white font-bold text-2xl mt-1" style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontStyle: 'italic' }}>{chapter.title}</h2>
                <p className="text-white/50 text-xs mt-1">{chapter.subtitle}</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-12">
              {/* Pull quote */}
              <blockquote className="my-5 pl-4 border-l-2 border-[#e53e3e]">
                <p className="text-[#e53e3e] text-sm italic leading-relaxed">{chapter.pullQuote}</p>
              </blockquote>

              {/* Body */}
              <div className="space-y-4 mb-6">
                {chapter.body.map((para, i) => (
                  <p key={i} className="text-white/70 text-sm leading-relaxed">{para}</p>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {chapter.stats.map((s) => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[#e53e3e] font-bold text-lg">{s.value}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
