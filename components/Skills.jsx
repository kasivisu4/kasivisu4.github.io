'use client';
import { motion } from 'framer-motion';
import SectionWrapper from './SectionWrapper';
import { skillGroups } from '@/lib/data';

// Color config for each skill group
const colorMap = {
  cyan: {
    label: 'text-cyan-500 dark:text-cyan-400',
    pill: 'bg-cyan-50 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-400/40 hover:bg-cyan-100 dark:hover:bg-cyan-400/30 hover:border-cyan-300 dark:hover:border-cyan-400/60',
    header: 'border-cyan-400/30',
  },
  violet: {
    label: 'text-violet-500 dark:text-violet-400',
    pill: 'bg-violet-50 dark:bg-violet-400/20 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-400/40 hover:bg-violet-100 dark:hover:bg-violet-400/30 hover:border-violet-300 dark:hover:border-violet-400/60',
    header: 'border-violet-400/30',
  },
  blue: {
    label: 'text-blue-500 dark:text-blue-400',
    pill: 'bg-blue-50 dark:bg-blue-400/20 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-400/40 hover:bg-blue-100 dark:hover:bg-blue-400/30 hover:border-blue-300 dark:hover:border-blue-400/60',
    header: 'border-blue-400/30',
  },
  emerald: {
    label: 'text-emerald-500 dark:text-emerald-400',
    pill: 'bg-emerald-50 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-400/40 hover:bg-emerald-100 dark:hover:bg-emerald-400/30 hover:border-emerald-300 dark:hover:border-emerald-400/60',
    header: 'border-emerald-400/30',
  },
  orange: {
    label: 'text-orange-500 dark:text-orange-400',
    pill: 'bg-orange-50 dark:bg-orange-400/20 text-orange-700 dark:text-orange-200 border border-orange-200 dark:border-orange-400/40 hover:bg-orange-100 dark:hover:bg-orange-400/30 hover:border-orange-300 dark:hover:border-orange-400/60',
    header: 'border-orange-400/30',
  },
  pink: {
    label: 'text-pink-500 dark:text-pink-400',
    pill: 'bg-pink-50 dark:bg-pink-400/20 text-pink-700 dark:text-pink-200 border border-pink-200 dark:border-pink-400/40 hover:bg-pink-100 dark:hover:bg-pink-400/30 hover:border-pink-300 dark:hover:border-pink-400/60',
    header: 'border-pink-400/30',
  },
  yellow: {
    label: 'text-yellow-600 dark:text-yellow-400',
    pill: 'bg-yellow-50 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-400/40 hover:bg-yellow-100 dark:hover:bg-yellow-400/30 hover:border-yellow-300 dark:hover:border-yellow-400/60',
    header: 'border-yellow-400/30',
  },
};

function SkillGroup({ group, index }) {
  const c = colorMap[group.color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="glass-card p-5 h-full"
    >
      {/* Group label */}
      <div className={`mb-4 pb-3 border-b ${c.header}`}>
        <h3 className={`font-display text-sm font-semibold ${c.label} tracking-wide`}>
          {group.label}
        </h3>
      </div>

      {/* Skill pills */}
      <div className="flex flex-wrap gap-1.5">
        {group.skills.map((skill, i) => (
          <motion.span
            key={skill}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.07 + i * 0.04, duration: 0.3 }}
            whileHover={{ scale: 1.06, y: -1 }}
            className={`tag-pill text-[12px] font-medium transition-all duration-150 ${c.pill}`}
          >
            {skill}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Skills() {
  return (
    <SectionWrapper id="skills">
      <div className="mb-12">
        <p className="section-label mb-2">Expertise</p>
        <h2 className="section-title">
          Tech Stack &{' '}
          <span className="gradient-text-cyan">Skill Map</span>
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm max-w-xl">
          Full-stack AI engineering — from raw data to intelligent, production-deployed systems.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skillGroups.map((group, i) => (
          <SkillGroup key={group.label} group={group} index={i} />
        ))}
      </div>
    </SectionWrapper>
  );
}
