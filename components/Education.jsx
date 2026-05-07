'use client';
import { motion } from 'framer-motion';
import { GraduationCap, MapPin, Calendar, Award, BookOpen } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { education, certifications, publications } from '@/lib/data';

export default function Education() {
  return (
    <SectionWrapper id="education">
      <div className="mb-12">
        <p className="section-label mb-2">Background</p>
        <h2 className="section-title">
          Education &{' '}
          <span className="gradient-text-cyan">Publications</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Education cards ── */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="font-display text-sm font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">
            Degrees
          </h3>
          {education.map((edu, i) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-cyan-400/10 text-cyan-400 shrink-0 mt-0.5">
                  <GraduationCap size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {edu.degree}
                  </h4>
                  <p className="text-sm font-semibold text-cyan-500 dark:text-cyan-400">{edu.school}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={10} /> {edu.period}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={10} /> {edu.location}
                    </span>
                  </div>
                </div>
              </div>
              {edu.roles.length > 0 && (
                <ul className="pl-4 space-y-1.5 border-l-2 border-cyan-400/20">
                  {edu.roles.map((r) => (
                    <li key={r} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}

          {/* Publication */}
          <div className="mt-6">
            <h3 className="font-display text-sm font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">
              Publication
            </h3>
            {publications.map((pub, i) => (
              <motion.div
                key={pub.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-violet-400/10 text-violet-400 shrink-0 mt-0.5">
                    <BookOpen size={18} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      &ldquo;{pub.title}&rdquo;
                    </p>
                    <p className="text-xs text-violet-500 dark:text-violet-400 font-medium">{pub.conference}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{pub.authors}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{pub.year}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Certifications sidebar ── */}
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">
            Certifications
          </h3>
          <div className="space-y-3">
            {certifications.map((cert, i) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card p-4 flex items-start gap-3"
              >
                <span className="text-xl mt-0.5" aria-hidden>{cert.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {cert.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{cert.issuer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
