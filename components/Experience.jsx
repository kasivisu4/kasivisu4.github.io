'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Calendar, ExternalLink } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { experiences } from '@/lib/data';

const colorMap = {
  cyan: {
    dot: 'bg-cyan-400',
    ring: 'ring-cyan-400/30',
    tag: 'bg-cyan-400/10 text-cyan-500 dark:text-cyan-400 border-cyan-400/20',
    glow: 'shadow-cyan-500/10',
    badge: 'bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border border-cyan-400/20',
  },
  violet: {
    dot: 'bg-violet-400',
    ring: 'ring-violet-400/30',
    tag: 'bg-violet-400/10 text-violet-500 dark:text-violet-400 border-violet-400/20',
    glow: 'shadow-violet-500/10',
    badge: 'bg-violet-400/10 text-violet-600 dark:text-violet-400 border border-violet-400/20',
  },
};

export default function Experience() {
  const [expanded, setExpanded] = useState(0); // open first by default

  return (
    <SectionWrapper id="experience" className="bg-slate-50/50 dark:bg-transparent">
      <div className="mb-12">
        <p className="section-label mb-2">Career</p>
        <h2 className="section-title">
          Where I&apos;ve{' '}
          <span className="gradient-text-violet">Made Impact</span>
        </h2>
      </div>

      {/* Timeline */}
      <div className="relative pl-10">
        {/* Vertical line */}
        <div className="timeline-line" aria-hidden />

        <div className="space-y-6">
          {experiences.map((exp, idx) => {
            const c = colorMap[exp.color] || colorMap.cyan;
            const isOpen = expanded === idx;

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-10 top-5 w-5 h-5 rounded-full ring-4 ${c.ring} ${c.dot} flex items-center justify-center`}>
                  <div className="w-2 h-2 rounded-full bg-white/80" />
                </div>

                {/* Card */}
                <div
                  className={`glass-card overflow-hidden shadow-xl ${c.glow} cursor-pointer`}
                  onClick={() => setExpanded(isOpen ? -1 : idx)}
                >
                  {/* Header — always visible */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        {exp.type === 'current' && (
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2 ${c.badge}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            Current Role
                          </span>
                        )}
                        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                          {exp.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                          {exp.company}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                            <Calendar size={11} /> {exp.period}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                            <MapPin size={11} /> {exp.location}
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1 shrink-0 text-slate-400"
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    </div>

                    {/* Tech tags */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {exp.tags.map((tag) => (
                        <span key={tag} className={`tag-pill border text-[11px] ${c.tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expandable achievements */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-white/5 pt-4">
                          <ul className="space-y-3">
                            {exp.achievements.map((ach, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                              >
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                                <span>{ach}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
