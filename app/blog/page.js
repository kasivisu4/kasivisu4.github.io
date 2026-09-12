// app/blog/page.js — blog index
import Link from 'next/link';
import { getListedPosts, formatDate } from '@/lib/blog';

export const metadata = {
  title: 'Blog',
  description:
    'Notes on data engineering, analytics, and building LLM-powered systems in production.',
  alternates: { canonical: '/blog/' },
};

export default function BlogIndex() {
  const posts = getListedPosts();

  return (
    <main className="px-4 sm:px-6 pt-28 pb-24">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Writing
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Notes on data engineering, analytics, and building LLM-powered
            systems that survive production.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-slate-500">No posts published yet.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}/`} className="group block">
                  <article
                    className="rounded-2xl border border-black/5 dark:border-white/10
                      bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl
                      shadow-lg shadow-black/5 dark:shadow-black/30
                      px-6 sm:px-8 py-6
                      transition-colors duration-200
                      hover:border-cyan-500/30 dark:hover:border-cyan-400/30"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span aria-hidden="true">·</span>
                      <span>{post.readingTime}</span>
                      {post.draft && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          draft
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {post.title}
                    </h2>

                    <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                      {post.description}
                    </p>

                    {post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 text-xs rounded-full bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-black/5 dark:border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
