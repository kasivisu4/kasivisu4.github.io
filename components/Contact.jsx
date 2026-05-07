'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, MapPin, Send, CheckCircle } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { personalInfo } from '@/lib/data';

const socials = [
  { icon: Mail, label: 'Email', value: personalInfo.email, href: `mailto:${personalInfo.email}`, color: 'text-cyan-400' },
  { icon: Linkedin, label: 'LinkedIn', value: 'kasivandanapu', href: personalInfo.linkedin, color: 'text-blue-400' },
  { icon: Github, label: 'GitHub', value: 'kasivisu4', href: personalInfo.github, color: 'text-violet-400' },
  { icon: MapPin, label: 'Location', value: personalInfo.location, href: null, color: 'text-emerald-400' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    // Mailto fallback — replace with your own API endpoint for production
    const subject = encodeURIComponent(`Portfolio Contact from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
    window.open(`mailto:${personalInfo.email}?subject=${subject}&body=${body}`);
    setTimeout(() => {
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    }, 600);
  };

  return (
    <SectionWrapper id="contact" className="bg-slate-50/50 dark:bg-transparent">
      <div className="mb-12">
        <p className="section-label mb-2">Get In Touch</p>
        <h2 className="section-title">
          Let&apos;s{' '}
          <span className="gradient-text-cyan">Build Together</span>
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm max-w-xl">
          I&apos;m open to Senior / Staff Python & AI Engineering roles. Whether you&apos;re building an
          agentic system or scaling a data platform — let&apos;s talk.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* ── Contact info ── */}
        <div className="space-y-4">
          {socials.map(({ icon: Icon, label, value, href, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="glass-card p-4 flex items-center gap-4 group"
            >
              <div className={`p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 ${color}`}>
                <Icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500">{label}</p>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`text-sm font-semibold ${color} hover:underline truncate block`}
                  >
                    {value}
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{value}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Message form ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card p-6"
        >
          {status === 'sent' ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-8 text-center">
              <CheckCircle size={40} className="text-emerald-400" />
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Message sent!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your mail client should have opened. Looking forward to connecting!
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-2 text-sm text-cyan-400 hover:underline"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2.5 rounded-lg text-sm
                      bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700
                      text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
                      focus:outline-none focus:border-cyan-400/60 focus:bg-white dark:focus:bg-slate-800
                      transition-colors duration-150"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Your Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2.5 rounded-lg text-sm
                      bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700
                      text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
                      focus:outline-none focus:border-cyan-400/60 focus:bg-white dark:focus:bg-slate-800
                      transition-colors duration-150"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell me about the role or project..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none
                    bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
                    focus:outline-none focus:border-cyan-400/60 focus:bg-white dark:focus:bg-slate-800
                    transition-colors duration-150"
                />
              </div>
              <motion.button
                type="submit"
                disabled={status === 'sending'}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg
                  bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400
                  text-white font-semibold text-sm shadow-lg shadow-cyan-500/20
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-150"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Send size={15} />
                {status === 'sending' ? 'Opening mail client…' : 'Send Message'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
