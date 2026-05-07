'use client';
import { motion } from 'framer-motion';
import SectionWrapper from './SectionWrapper';
import { personalInfo } from '@/lib/data';
import { MapPin, Calendar, Cpu, Database, Globe } from 'lucide-react';

const highlights = [
  { icon: Cpu, label: 'Agentic AI', desc: 'LLM workflows that reason and act', color: 'text-cyan-400' },
  { icon: Database, label: 'Data at Scale', desc: 'ETL pipelines across 4+ enterprise clients', color: 'text-violet-400' },
  { icon: Globe, label: 'Cloud-Native', desc: 'Production on AWS & GCP', color: 'text-blue-400' },
];

export default function About() {
  return (
    <SectionWrapper id="about">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: text */}
        <div className="space-y-6">
          <div>
            <p className="section-label mb-2">About Me</p>
            <h2 className="section-title mb-4">
              I build AI systems that{' '}
              <span className="gradient-text-cyan">actually ship</span>.
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
            {personalInfo.summary}
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
            My work spans the full AI engineering stack — from architecting{' '}
            <span className="text-slate-800 dark:text-slate-200 font-medium">LangGraph agentic workflows</span>{' '}
            that replace brittle rule-based pipelines, to optimizing PySpark jobs that process terabytes overnight.
            I care deeply about making AI systems robust, explainable, and cost-efficient in production.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
              <MapPin size={13} className="text-cyan-400" />
              {personalInfo.location}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
              <Calendar size={13} className="text-violet-400" />
              5+ Years Experience
            </div>
          </div>
        </div>

        {/* Right: highlight cards */}
        <div className="grid gap-4">
          {highlights.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ x: 4 }}
              className="glass-card p-5 flex items-start gap-4 cursor-default"
            >
              <div className={`mt-0.5 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 mb-0.5">
                  {label}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
