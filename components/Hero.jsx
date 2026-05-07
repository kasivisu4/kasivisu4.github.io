'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Github, Linkedin, Mail, Download, ArrowDown, Zap } from 'lucide-react';
import { personalInfo, coreProfiles } from '@/lib/data';

// Rotating typewriter words
const WORDS = ['Agentic AI', 'FastAPI', 'LangGraph', 'LLM Systems', 'Data Platforms'];

// SVG progress ring for a core skill
function SkillRing({ name, pct, size = 80, stroke = 5, delay = 0 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring', bounce: 0.3 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-slate-200 dark:stroke-slate-700/60"
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className="stroke-cyan-400"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ delay: delay + 0.3, duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight max-w-[80px]">
        {name}
      </span>
    </motion.div>
  );
}

// Floating tech badge
function TechBadge({ label, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan: 'border-cyan-400/30 bg-cyan-400/5 text-cyan-400',
    violet: 'border-violet-400/30 bg-violet-400/5 text-violet-400',
    blue: 'border-blue-400/30 bg-blue-400/5 text-blue-400',
    emerald: 'border-emerald-400/30 bg-emerald-400/5 text-emerald-400',
  };
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`tag-pill border text-[11px] font-mono ${colors[color] || colors.cyan}`}
    >
      {label}
    </motion.span>
  );
}

export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect
  useEffect(() => {
    const word = WORDS[wordIndex];
    const speed = isDeleting ? 40 : 80;
    const pause = isDeleting ? 300 : 1800;

    const timeout = setTimeout(() => {
      if (!isDeleting && displayText === word) {
        setTimeout(() => setIsDeleting(true), pause);
        return;
      }
      if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setWordIndex((i) => (i + 1) % WORDS.length);
        return;
      }
      setDisplayText((t) =>
        isDeleting ? t.slice(0, -1) : word.slice(0, t.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex]);

  const stagger = { initial: {}, animate: { transition: { staggerChildren: 0.1 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Radial glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/8 blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-500/5 dark:bg-violet-500/8 blur-3xl animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* ── Left: Text Content ── */}
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
          {/* Availability badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              border border-emerald-400/30 bg-emerald-400/5 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Open to Senior / Staff AI Engineering Roles
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.div variants={fadeUp} className="space-y-2">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              <span className="text-slate-900 dark:text-white">Hi, I&apos;m </span>
              <span className="gradient-text-hero">Kasi Vandanapu</span>
            </h1>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-600 dark:text-slate-300 leading-tight">
              Building{' '}
              <span className="gradient-text-cyan inline-block min-w-[220px]">
                {displayText}
                <span className="animate-pulse ml-0.5 text-cyan-400">|</span>
              </span>
            </h2>
          </motion.div>

          {/* Summary */}
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl"
          >
            Senior Python Developer & Data Engineer with{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">5+ years</span>{' '}
            building scalable, cloud-native AI platforms. Expert in{' '}
            <span className="text-cyan-500 dark:text-cyan-400 font-medium">Python · FastAPI · LLMs · LangGraph</span>.
            Proven track record optimizing ETL pipelines by{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">60%</span> and cutting inference costs by{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">50%</span>.
          </motion.p>

          {/* Tag cloud */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
            <TechBadge label="LangGraph" color="cyan" delay={0.6} />
            <TechBadge label="LangChain" color="cyan" delay={0.65} />
            <TechBadge label="FastAPI" color="violet" delay={0.7} />
            <TechBadge label="PySpark" color="blue" delay={0.75} />
            <TechBadge label="AWS · GCP" color="emerald" delay={0.8} />
            <TechBadge label="MongoDB" color="violet" delay={0.85} />
            <TechBadge label="Text2SQL" color="cyan" delay={0.9} />
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
            <motion.a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400
                text-white font-semibold text-sm shadow-lg shadow-cyan-500/25
                transition-all duration-200"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap size={15} />
              Let&apos;s Connect
            </motion.a>
            <motion.a
              href="/kasi_resume_2026_v2.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                hover:border-cyan-400/50 hover:text-cyan-500 dark:hover:text-cyan-400
                font-semibold text-sm backdrop-blur transition-all duration-200"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download size={15} />
              Resume
            </motion.a>
            {/* Social icons */}
            <div className="flex items-center gap-2">
              {[
                { href: personalInfo.github, icon: Github, label: 'GitHub' },
                { href: personalInfo.linkedin, icon: Linkedin, label: 'LinkedIn' },
                { href: `mailto:${personalInfo.email}`, icon: Mail, label: 'Email' },
              ].map(({ href, icon: Icon, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="w-10 h-10 rounded-lg flex items-center justify-center
                    border border-slate-200 dark:border-slate-700 text-slate-500
                    hover:text-cyan-400 hover:border-cyan-400/30 transition-colors duration-150"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={17} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Right: Skill Rings ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="hidden lg:flex flex-col items-center"
        >
          <div className="glass-card p-8 space-y-6 glow-cyan">
            <div className="text-center">
              <p className="section-label mb-1">Core Proficiency</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Self-assessed expertise levels</p>
            </div>
            <div className="grid grid-cols-3 gap-6 justify-items-center">
              {coreProfiles.map((skill, i) => (
                <SkillRing key={skill.name} name={skill.name} pct={skill.pct} delay={0.5 + i * 0.12} />
              ))}
            </div>
            {/* Impact stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
              {[
                { v: '5+', l: 'Years in Python' },
                { v: '60%', l: 'Pipeline speedup' },
                { v: '50%', l: 'Inference cost cut' },
                { v: '4+', l: 'Enterprise clients' },
              ].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <div className="font-display text-xl font-bold gradient-text-cyan">{v}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={14} className="text-slate-400 dark:text-slate-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}
