// MyStoryApp.tsx
// Design: Netflix-dark cinematic narrative — DM Serif Display italic for chapter titles,
// full-bleed chapter images with parallax-like overlays, pull quotes in crimson,
// chapter markers on left sidebar, smooth scroll between chapters.
// Color: #0a0a0a bg, var(--pk-accent) accent, #f5f5f1 body text, #a3a3a3 secondary.

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CHAPTERS = [
  {
    id: "ch1",
    number: "01",
    title: "The Boy Who Built Wings",
    subtitle: "Belagavi, Karnataka · 2000–2014",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/115134064/EPpvubJEovqNLORM.webp",
    pullQuote:
      "\"Every RC plane I built was a proof of concept — that with enough patience and the right components, anything could fly.\"",
    body: [
      "In a small workshop in Belagavi, Karnataka, a teenager surrounded by balsa wood, copper wire, and circuit boards was quietly becoming an engineer. Before the textbooks, before the degrees, before the algorithms — there were 15 hand-built RC planes.",
      "Each one was a complete engineering project: aerodynamics calculated by hand, electronics soldered at midnight, test flights conducted in the fields outside the city. When one crashed, Pranav didn't see failure — he saw data. What went wrong? What needed to change? How could the next version fly higher?",
      "This obsession with building things that worked — really worked, not just in theory — would define everything that followed. The discipline of iterating through failure, the joy of watching something you made with your own hands actually take flight: these weren't just hobbies. They were the foundation of an engineering philosophy.",
      "Belagavi gave Pranav something that no curriculum could: the confidence to build from scratch, the patience to debug the physical world, and the hunger to understand not just how things work, but why they work — and how to make them work better.",
    ],
    stats: [
      { label: "RC Planes Built", value: "15" },
      { label: "Years of Tinkering", value: "8+" },
      { label: "First Flight", value: "Age 12" },
    ],
  },
  {
    id: "ch2",
    number: "02",
    title: "National Skies",
    subtitle: "NAL Bangalore & Cognizant · 2015–2021",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/115134064/ZorbHUZjDugTBIlU.webp",
    pullQuote:
      "\"Working on India's VTOL UAV program wasn't just a job — it was proof that the kid who built RC planes in Belagavi belonged in a national laboratory.\"",
    body: [
      "The boy who built RC planes grew into an engineer who built UAVs for India's national aerospace program. At the National Aerospace Laboratories (NAL) in Bangalore, Pranav contributed to the VTOL unmanned aerial vehicle project — real aircraft, real stakes, real national significance.",
      "The transition from hobbyist to professional was jarring in the best way. At NAL, every decision had to be documented, justified, and reviewed. The informal intuition of the workshop gave way to rigorous engineering discipline. But the core remained the same: understand the physics, build the system, test it until it works.",
      "From aerospace to enterprise: Cognizant offered a different kind of scale. As a Programmer Analyst, Pranav built automation frameworks that processed millions of records, designed data pipelines that reduced manual effort by 70%, and discovered that the same problem-solving instincts that made RC planes fly could make enterprise software sing.",
      "These years in India weren't just career steps — they were the crucible where technical skill met professional discipline. The question that kept surfacing: what happens when you combine this engineering foundation with the cutting edge of AI? The answer would require crossing an ocean to find out.",
    ],
    stats: [
      { label: "UAV Programs", value: "2" },
      { label: "Automation Savings", value: "70%" },
      { label: "Years in Industry", value: "4" },
    ],
  },
  {
    id: "ch3",
    number: "03",
    title: "The American Chapter",
    subtitle: "NJIT, New Jersey · 2022–2024",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/115134064/smKaeSfYJyAgcwnU.jpg",
    pullQuote:
      "\"Landing in Newark with a suitcase and a GRE score, I had no idea that the hardest part wasn't the coursework — it was learning to think differently about everything.\"",
    body: [
      "The GRE score was 320. The IELTS was 7.5. The acceptance letter from NJIT's Ying Wu College of Computing arrived on a Tuesday. Pranav Kowadkar was going to America.",
      "The Master of Science in Data Science program at NJIT was rigorous in ways that surprised even someone who had worked at NAL. The coursework in machine learning, deep learning, and NLP wasn't just theoretical — it demanded that students build systems that actually worked, at scale, under constraints.",
      "The academic environment was electric. Surrounded by researchers pushing the boundaries of AI, Pranav absorbed not just techniques but ways of thinking: how to frame a problem as a research question, how to evaluate solutions rigorously, how to communicate complex ideas clearly. The GPA of 3.6/4.0 reflected consistent excellence across courses that included Big Data, Computer Vision, and Advanced Database Systems.",
      "But the most important education happened outside the classroom. Part-time work developing DNNs and RAG pipelines for clients taught Pranav what academia couldn't: how real organizations actually use AI, what breaks in production, and how to bridge the gap between research and deployment. By graduation in 2024, the theoretical and practical had fused into something rare — deep expertise with real-world judgment.",
    ],
    stats: [
      { label: "GPA", value: "3.6/4.0" },
      { label: "GRE Score", value: "320" },
      { label: "Graduation", value: "2024" },
    ],
  },
  {
    id: "ch4",
    number: "04",
    title: "Building the Future",
    subtitle: "Silicon Valley & Beyond · 2024–Present",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/115134064/MrKOyokDzaseVyYq.webp",
    pullQuote:
      "\"The job market was broken. So I stopped trying to navigate it and started building the tools to fix it — for myself and for everyone else.\"",
    body: [
      "Graduating with a Master's in Data Science from NJIT in 2024 should have opened every door. The credentials were strong. The skills were real. The timing, however, was complicated.",
      "The AI job market in 2024 was a paradox: companies claimed they desperately needed AI talent while simultaneously running hiring processes that filtered out exactly the kind of independent, creative builders who could actually deliver results. The ATS black hole swallowed applications. The interview process tested algorithm memorization instead of AI judgment. The experience paradox demanded 3-5 years of experience in technologies that barely existed.",
      "Rather than being defeated by this, Pranav did what engineers do: he analyzed the system, identified the failure modes, and started building solutions. CareerForge Agent was born from this frustration — an AI-powered career development platform that actually served job seekers instead of recruiters. Project Poltergeist emerged from the desire for an AI assistant that could operate with complete privacy. GPT-Unbound addressed the context limitation that made every AI conversation feel like starting from scratch.",
      "The home laboratory in Harrison became a 24/7 development environment. Client work on DNN and RAG systems funded the research. Hackathon wins validated the ideas. And slowly, the portfolio of projects that began as solutions to personal frustrations evolved into something larger: a vision for how AI could genuinely augment human capability without compromising privacy, autonomy, or creativity. The story isn't over. It's just getting interesting.",
    ],
    stats: [
      { label: "AI Projects Built", value: "6+" },
      { label: "Hackathon Wins", value: "3" },
      { label: "Status", value: "Building" },
    ],
  },
  {
    id: "ch5",
    number: "05",
    title: "Speaking to the World",
    subtitle: "LLM Day NYC · March 6, 2026",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/115134064/fzToKMmHAGPjKXfc.jpg",
    pullQuote:
      '"Production AI systems don\'t fail because of bad models. They fail because of bad architecture. Multi-agent orchestration is how you fix that."',
    body: [
      "On March 6, 2026, Pranav took the stage at LLM Day NYC to deliver a talk titled \"Multi-Agent Architectures: Solving Production LLM Reliability at Scale.\" The room was packed with engineers, researchers, and founders who had all hit the same wall: production LLM systems that looked brilliant in demos and fell apart in the real world.",
      "The core argument was deceptively simple. Production LLM systems face impossible tradeoffs — latency vs accuracy, cost vs quality, speed vs reliability. Single-model architectures force you to pick one and sacrifice the others. Multi-agent architectures dissolve the tradeoff entirely by decomposing tasks, routing intelligently, and using peer review between agents to catch errors before they reach users.",
      "The talk covered the full spectrum of orchestration patterns: Hierarchical agents where a coordinator delegates to specialists; Collaborative networks where agents debate and converge on answers; Sequential pipelines where each agent refines the previous output; and Hybrid architectures that combine all three depending on task complexity. Central to each pattern was the LLM-as-Judge technique — using one model to evaluate and critique another's output, implementing RLAIF (Reinforcement Learning from AI Feedback) without the cost of human annotation.",
      "The most technically dense section covered RLVR-inspired implementations: grounding agents with truth documents as reference anchors, building RAG pipelines that agents use not just for retrieval but for self-correction, and designing A2A (Agent-to-Agent) communication protocols that prevent cascading hallucinations. Attendees left with patterns they could implement immediately — not theoretical frameworks, but battle-tested architectures drawn from real production systems.",
    ],
    stats: [
      { label: "Event", value: "LLM Day NYC" },
      { label: "Date", value: "March 6, 2026" },
      { label: "Topic", value: "Multi-Agent AI" },
    ],
  },
];

export default function MyStoryApp() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track which chapter is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = chapterRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (idx !== -1) setActiveChapter(idx);
          }
        });
      },
      { threshold: 0.4, root: containerRef.current }
    );

    chapterRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToChapter = (idx: number) => {
    setIsScrolling(true);
    chapterRefs.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setTimeout(() => setIsScrolling(false), 800);
  };

  return (
    <div className="flex h-full bg-[#0a0a0a] text-[#f5f5f1] overflow-hidden font-['SF_Pro_Display',system-ui]">
      {/* Left sidebar — chapter nav */}
      <div className="w-[200px] flex-shrink-0 border-r border-white/10 flex flex-col py-8 px-4 gap-1 bg-[#0d0d0d]">
        <div className="mb-6 px-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#666] mb-1">
            My Story
          </p>
          <p className="text-[11px] text-[#a3a3a3]">Pranav Kowadkar</p>
        </div>

        {CHAPTERS.map((ch, idx) => (
          <button
            key={ch.id}
            onClick={() => scrollToChapter(idx)}
            className={`text-left px-3 py-3 rounded-lg transition-all duration-200 group ${
              activeChapter === idx
                ? "bg-[var(--pk-accent)]/10 border border-[var(--pk-accent)]/30"
                : "hover:bg-white/5 border border-transparent"
            }`}
          >
            <div
              className={`text-[10px] font-mono mb-1 transition-colors ${
                activeChapter === idx ? "text-[var(--pk-accent)]" : "text-[#555]"
              }`}
            >
              {ch.number}
            </div>
            <div
              className={`text-[12px] leading-tight font-medium transition-colors ${
                activeChapter === idx ? "text-[#f5f5f1]" : "text-[#888] group-hover:text-[#bbb]"
              }`}
            >
              {ch.title}
            </div>
          </button>
        ))}

        {/* Timeline line */}
        <div className="mt-auto px-2">
          <div className="relative h-[120px] flex items-center justify-center">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
            {CHAPTERS.map((_, idx) => (
              <div
                key={idx}
                className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border transition-all duration-300 ${
                  idx <= activeChapter
                    ? "bg-[var(--pk-accent)] border-[var(--pk-accent)]"
                    : "bg-transparent border-[#444]"
                }`}
                style={{ top: `${(idx / (CHAPTERS.length - 1)) * 100}%` }}
              />
            ))}
          </div>
          <p className="text-[10px] text-[#444] text-center mt-2">
            {activeChapter + 1} / {CHAPTERS.length}
          </p>
        </div>
      </div>

      {/* Main scroll area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
      >
        {CHAPTERS.map((chapter, idx) => (
          <div
            key={chapter.id}
            ref={(el) => {
              chapterRefs.current[idx] = el;
            }}
            className="min-h-full"
          >
            {/* Hero image with overlay */}
            <div className="relative h-[340px] overflow-hidden">
              <img
                src={chapter.image}
                alt={chapter.title}
                className="w-full h-full object-cover object-center"
                style={{ filter: "brightness(0.55)" }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 to-transparent" />

              {/* Chapter number watermark */}
              <div className="absolute top-6 right-8 text-[80px] font-bold text-white/5 font-mono leading-none select-none">
                {chapter.number}
              </div>

              {/* Chapter header */}
              <div className="absolute bottom-8 left-10 right-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--pk-accent)] mb-2">
                    Chapter {chapter.number}
                  </p>
                  <h2
                    className="text-[32px] leading-tight text-white mb-1"
                    style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontStyle: "italic",
                    }}
                  >
                    {chapter.title}
                  </h2>
                  <p className="text-[13px] text-[#a3a3a3]">{chapter.subtitle}</p>
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="px-10 pb-16 pt-8 max-w-[720px]">
              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex gap-6 mb-10"
              >
                {chapter.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-center"
                  >
                    <div className="text-[22px] font-bold text-[var(--pk-accent)] font-mono leading-none mb-1">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-[#666] uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Pull quote */}
              <motion.blockquote
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="border-l-[3px] border-[var(--pk-accent)] pl-6 mb-10"
              >
                <p
                  className="text-[17px] leading-relaxed text-[#f5f5f1]"
                  style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontStyle: "italic",
                  }}
                >
                  {chapter.pullQuote}
                </p>
              </motion.blockquote>

              {/* Body paragraphs */}
              <div className="space-y-5">
                {chapter.body.map((para, pIdx) => (
                  <motion.p
                    key={pIdx}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 + pIdx * 0.08 }}
                    className="text-[14px] leading-[1.8] text-[#c8c8c4]"
                  >
                    {para}
                  </motion.p>
                ))}
              </div>

              {/* Chapter divider */}
              {idx < CHAPTERS.length - 1 && (
                <div className="mt-16 flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <button
                    onClick={() => scrollToChapter(idx + 1)}
                    className="flex items-center gap-2 text-[12px] text-[#666] hover:text-[var(--pk-accent)] transition-colors group"
                  >
                    <span>Next chapter</span>
                    <span className="group-hover:translate-y-1 transition-transform">↓</span>
                  </button>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              {/* Final CTA */}
              {idx === CHAPTERS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-16 p-8 bg-[var(--pk-accent)]/5 border border-[var(--pk-accent)]/20 rounded-2xl text-center"
                >
                  <p
                    className="text-[22px] text-white mb-3"
                    style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontStyle: "italic",
                    }}
                  >
                    The story continues.
                  </p>
                  <p className="text-[13px] text-[#a3a3a3] mb-6 max-w-[400px] mx-auto">
                    From Belagavi to Bangalore to New Jersey to wherever the next chapter leads — the same drive that built 15 RC planes is now building AI systems that matter.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href="https://github.com/p-kowadkar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 bg-[var(--pk-accent)] text-white text-[12px] font-medium rounded-lg hover:bg-[#c40812] transition-colors"
                    >
                      See the work →
                    </a>
                    <a
                      href="mailto:pranav.kowadkar@gmail.com"
                      className="px-5 py-2 bg-white/10 text-white text-[12px] font-medium rounded-lg hover:bg-white/15 transition-colors"
                    >
                      Start a conversation
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
