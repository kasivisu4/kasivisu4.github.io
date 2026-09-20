'use client';
import SectionWrapper from './SectionWrapper';
import { personalInfo } from '@/lib/data';
import { MapPin, Calendar } from 'lucide-react';

// No category cards here. The hero's What I Build panel already states the four
// areas, and the Skills section lists the tools — a third telling on the way
// past made the page read as repetition. This section is the narrative layer:
// what was actually built, where, and what came of it.
export default function About() {
  return (
    <SectionWrapper id="about">
      <div className="max-w-3xl">
        <p className="section-label mb-2">About Me</p>
        <h2 className="section-title mb-8">
          I make data and AI systems{' '}
          <span className="gradient-text-cyan">faster, cheaper, and measurable</span>.
        </h2>

        <div className="space-y-5">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base sm:text-lg">
            At <span className="text-slate-800 dark:text-slate-200 font-medium">Citi</span>, I build{' '}
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              LangGraph-based agentic workflows
            </span>{' '}
            and FastAPI services for AI-powered data applications, including a system that generates
            dashboard configurations from available data and visualization context.
          </p>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base sm:text-lg">
            Separately, I built an open-source{' '}
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              Text2SQL evaluation framework
            </span>{' '}
            that benchmarks LLM-generated SQL against real-world schemas. It analyzes execution and
            structural correctness, identifies why queries fail, and supports techniques such as
            schema pruning that reduced inference cost by 50% in my experiments.
          </p>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base sm:text-lg">
            Before that, at{' '}
            <span className="text-slate-800 dark:text-slate-200 font-medium">Infosys</span>, I built
            ETL pipelines using PySpark, Delta Lake and Airflow for Levi&apos;s, Kraft Heinz and HCSC,
            along with a GCP streaming pipeline using Pub/Sub and Cloud Run. More recently I&apos;ve been
            exploring{' '}
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              interactive analytics
            </span>{' '}
            using DuckDB, Parquet and Mosaic — the work documented in my Writing section.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-8">
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
    </SectionWrapper>
  );
}
