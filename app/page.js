// app/page.js — Main portfolio page
import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Education from '@/components/Education';
import Contact from '@/components/Contact';
import AIChat from '@/components/AIChat';
import NeuralBackground from '@/components/NeuralBackground';

export default function Home() {
  return (
    <>
      {/* Animated neural network canvas — fixed behind everything */}
      <NeuralBackground />

      {/* Sticky navigation */}
      <NavBar />

      <main className="relative z-10">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </main>

      {/* Floating AI chat widget */}
      <AIChat />

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-500">
          © {new Date().getFullYear()} Kasi Vandanapu · Built with Next.js 15, Tailwind CSS & Framer Motion
        </p>
      </footer>
    </>
  );
}
