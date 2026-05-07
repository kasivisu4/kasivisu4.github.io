// app/layout.js — Root layout with SEO, fonts, and theme provider
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const baseUrl = 'https://kasivisu4.github.io';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Kasi Vandanapu — Senior Python Developer & AI Engineer',
    template: '%s | Kasi Vandanapu',
  },
  description:
    'Senior Python Developer & AI Engineer with 5+ years building LLM-powered agentic systems, FastAPI microservices, and scalable data platforms on AWS & GCP. Expert in LangChain, LangGraph, and production ML.',
  keywords: [
    'Python Developer',
    'AI Engineer',
    'LLM',
    'LangChain',
    'LangGraph',
    'FastAPI',
    'Data Engineer',
    'Agentic AI',
    'LangGraph Developer',
    'AWS',
    'GCP',
    'PySpark',
    'Kasi Vandanapu',
  ],
  authors: [{ name: 'Kasi Vandanapu', url: baseUrl }],
  creator: 'Kasi Vandanapu',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Kasi Vandanapu Portfolio',
    title: 'Kasi Vandanapu — Senior Python Developer & AI Engineer',
    description:
      'Building LLM-powered agentic systems, FastAPI microservices, and scalable data platforms. 5+ years in Python, LangChain, LangGraph, AWS & GCP.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Kasi Vandanapu Portfolio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kasi Vandanapu — Senior Python Developer & AI Engineer',
    description: 'Building LLM-powered agentic systems, FastAPI microservices, and scalable data platforms.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: baseUrl },
};

// JSON-LD structured data for rich search results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Kasi Vandanapu',
  url: baseUrl,
  email: 'kasivisu3109@gmail.com',
  jobTitle: 'Senior Python Developer & AI Engineer',
  description: 'Senior Python Developer & Data Engineer specializing in LLM-powered agentic systems, FastAPI, and scalable data platforms.',
  sameAs: [
    'https://www.linkedin.com/in/kasivisu4/',
    'https://github.com/kasivisu4',
  ],
  knowsAbout: [
    'Python', 'FastAPI', 'LangChain', 'LangGraph',
    'Large Language Models', 'Data Engineering', 'Apache Spark',
    'AWS', 'Google Cloud Platform',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <div className="noise-overlay" aria-hidden="true" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
