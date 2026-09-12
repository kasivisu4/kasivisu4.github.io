// app/blog/layout.js — shared chrome so the blog reads as part of the site.
// The neural background stays visible in the margins; article content sits on
// its own opaque sheet so text never competes with the animation behind it.
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import NeuralBackground from '@/components/NeuralBackground';

export default function BlogLayout({ children }) {
  return (
    <>
      <NeuralBackground />
      <NavBar />
      <div className="relative z-10 min-h-screen">{children}</div>
      <Footer />
    </>
  );
}
