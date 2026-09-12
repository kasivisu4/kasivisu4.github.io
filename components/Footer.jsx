// components/Footer.jsx — shared across the portfolio and the blog.
export default function Footer() {
  return (
    <footer className="relative z-10 py-8 border-t border-black/5 dark:border-white/5 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-500">
        © {new Date().getFullYear()} Kasi Vandanapu · Built with Next.js 15, Tailwind CSS & Framer Motion
      </p>
    </footer>
  );
}
