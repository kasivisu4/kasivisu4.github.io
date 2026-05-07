'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, ExternalLink, X, ChevronRight, Maximize2 } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { projects } from '@/lib/data';

const highlightColors = {
  cyan: {
    border: 'hover:border-cyan-400/40',
    badge: 'bg-cyan-400/10 dark:bg-cyan-400/20 text-cyan-500 dark:text-cyan-200 border border-cyan-400/20 dark:border-cyan-400/40',
    metric: 'bg-cyan-50 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-400/40',
    accent: 'text-cyan-400',
    btn: 'bg-cyan-500 hover:bg-cyan-400',
  },
  violet: {
    border: 'hover:border-violet-400/40',
    badge: 'bg-violet-400/10 dark:bg-violet-400/20 text-violet-500 dark:text-violet-200 border border-violet-400/20 dark:border-violet-400/40',
    metric: 'bg-violet-50 dark:bg-violet-400/20 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-400/40',
    accent: 'text-violet-400',
    btn: 'bg-violet-500 hover:bg-violet-400',
  },
  blue: {
    border: 'hover:border-blue-400/40',
    badge: 'bg-blue-400/10 dark:bg-blue-400/20 text-blue-500 dark:text-blue-200 border border-blue-400/20 dark:border-blue-400/40',
    metric: 'bg-blue-50 dark:bg-blue-400/20 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-400/40',
    accent: 'text-blue-400',
    btn: 'bg-blue-500 hover:bg-blue-400',
  },
  pink: {
    border: 'hover:border-pink-400/40',
    badge: 'bg-pink-400/10 dark:bg-pink-400/20 text-pink-500 dark:text-pink-200 border border-pink-400/20 dark:border-pink-400/40',
    metric: 'bg-pink-50 dark:bg-pink-400/20 text-pink-700 dark:text-pink-200 border border-pink-200 dark:border-pink-400/40',
    accent: 'text-pink-400',
    btn: 'bg-pink-500 hover:bg-pink-400',
  },
};

function ProjectModal({ project, onClose }) {
  const c = highlightColors[project.highlight] || highlightColors.cyan;
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl z-10"
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
      >
        <div className="p-7 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`tag-pill border text-[11px] ${c.badge}`}>{project.tags[0]}</span>
                {project.tags[1] && (
                  <span className={`tag-pill border text-[11px] ${c.badge}`}>{project.tags[1]}</span>
                )}
                <span className="text-xs text-slate-500">{project.year}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {project.title}
              </h3>
              <p className={`text-sm font-medium mt-0.5 ${c.accent}`}>{project.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Long description */}
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {project.longDescription}
          </p>

          {/* Metrics */}
          <div className="flex flex-wrap gap-2">
            {project.metrics.map((m) => (
              <span key={m} className={`tag-pill text-[11px] font-semibold ${c.metric}`}>
                ✓ {m}
              </span>
            ))}
          </div>

          {/* Tech stack */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((t) => (
                <span
                  key={t}
                  className="tag-pill text-[12px] border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-3 pt-2">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  text-white text-sm font-semibold transition-colors duration-150 ${c.btn}`}
              >
                <Github size={15} /> View on GitHub
              </a>
            )}
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  border border-slate-300 dark:border-slate-600 text-sm font-semibold
                  text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors"
              >
                <ExternalLink size={15} /> Live Demo
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProjectCard({ project, index }) {
  const [modalOpen, setModalOpen] = useState(false);
  const c = highlightColors[project.highlight] || highlightColors.cyan;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        whileHover={{ y: -4 }}
        className={`glass-card p-6 flex flex-col gap-4 cursor-pointer
          border border-transparent transition-all duration-200 ${c.border}
          ${project.featured ? 'shadow-lg' : ''}`}
        onClick={() => setModalOpen(true)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        role="button"
        aria-label={`View ${project.title} details`}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span key={tag} className={`tag-pill border text-[10px] font-semibold ${c.badge}`}>
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-500">{project.year}</span>
            <Maximize2 size={13} className="text-slate-400" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {project.title}
          </h3>
          <p className={`text-xs font-medium mt-0.5 ${c.accent}`}>{project.subtitle}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
          {project.description}
        </p>

        {/* Metrics */}
        <div className="flex flex-wrap gap-1.5">
          {project.metrics.map((m) => (
            <span key={m} className={`tag-pill text-[10px] font-semibold ${c.metric}`}>
              {m}
            </span>
          ))}
        </div>

        {/* Tech + CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex flex-wrap gap-1">
            {project.technologies.slice(0, 3).map((t) => (
              <span key={t} className="text-[11px] text-slate-500 dark:text-slate-500 font-mono">
                {t}{project.technologies.indexOf(t) < 2 ? ' ·' : project.technologies.length > 3 ? ` +${project.technologies.length - 3}` : ''}
              </span>
            ))}
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.accent}`}>
            Deep dive <ChevronRight size={12} />
          </span>
        </div>
      </motion.article>

      <AnimatePresence>
        {modalOpen && <ProjectModal project={project} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function Projects() {
  const featured = projects.filter((p) => p.featured);
  const other = projects.filter((p) => !p.featured);

  return (
    <SectionWrapper id="projects" className="bg-slate-50/50 dark:bg-transparent">
      <div className="mb-12">
        <p className="section-label mb-2">Work</p>
        <h2 className="section-title">
          Featured{' '}
          <span className="gradient-text-violet">Projects</span>
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm max-w-xl">
          Click any card for a full technical deep-dive.
        </p>
      </div>

      {/* Featured grid — 2 cols */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {featured.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
      </div>

      {/* Other projects — 2 cols */}
      <div className="grid md:grid-cols-2 gap-5">
        {other.map((p, i) => <ProjectCard key={p.id} project={p} index={i + featured.length} />)}
      </div>
    </SectionWrapper>
  );
}
