'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Github, Linkedin, Mail, Download, ArrowDown, Zap } from 'lucide-react';
import { personalInfo, buildPillars, stats } from '@/lib/data';

// Rotating typewriter words
const WORDS = ['Agentic AI', 'FastAPI', 'LangGraph', 'LLM Systems', 'Data Platforms'];

// Left-border accent per pillar. Literal class strings so Tailwind keeps them.
const PILLAR_ACCENT = {
  cyan: 'border-cyan-400/50',
  violet: 'border-violet-400/50',
  emerald: 'border-emerald-400/50',
  rose: 'border-rose-400/50',
};

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

          {/* Role line — the positioning statement, verbatim */}
          <motion.p
            variants={fadeUp}
            className="font-mono text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 tracking-tight"
          >
            {personalInfo.title}
            <span className="text-cyan-500/60 dark:text-cyan-400/60"> · </span>
            {personalInfo.subtitle}
          </motion.p>

          {/* Summary */}
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl"
          >
            Senior AI &amp; Backend Engineer with{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">5+ years</span>{' '}
            building production data and AI systems in Python. I work across{' '}
            <span className="text-cyan-500 dark:text-cyan-400 font-medium">
              LLM applications, agentic workflows, data engineering
            </span>{' '}
            and high-performance backend services — with a focus on making systems{' '}
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              faster, cheaper, and easier to evaluate
            </span>.
          </motion.p>

          {/* No tag cloud here — every tag but one was already in the
              What I Build panel beside it, organised by purpose rather than
              listed raw. */}

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

        {/* ── Right: What I Build ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="hidden lg:flex flex-col items-center"
        >
          <div className="glass-card p-8 space-y-6 glow-cyan min-w-[400px] max-w-[440px]">
            <div>
              <p className="section-label mb-1">What I Build</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Four areas, and the systems behind them.
              </p>
            </div>

            <div className="space-y-4">
              {buildPillars.map((pillar, i) => (
                <motion.div
                  key={pillar.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.5 + i * 0.1 }}
                  className={`pl-3 border-l-2 ${PILLAR_ACCENT[pillar.color] ?? PILLAR_ACCENT.cyan}`}
                >
                  <p className="font-display text-[13px] font-semibold text-slate-800 dark:text-slate-100 tracking-wide">
                    {pillar.label}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {pillar.items}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Selected impact */}
            <div className="pt-4 border-t border-white/5">
              <p className="section-label mb-3">Selected Impact</p>
              <div className="grid grid-cols-2 gap-3">
                {stats.map(({ value, label }) => (
                  <div key={label}>
                    <div className="font-display text-xl font-bold gradient-text-cyan">{value}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 leading-snug">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
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
