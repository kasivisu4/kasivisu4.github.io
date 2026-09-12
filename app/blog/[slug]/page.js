// app/blog/[slug]/page.js — individual post.
// MDX is compiled by the bundler at build time, so nothing is evaluated at runtime.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getAllPostsWithDrafts, getPostBySlug, formatDate } from '@/lib/blog';

export const dynamicParams = false;

export function generateStaticParams() {
  // Drafts are previewable while developing but are never deployed: the
  // exported site contains published posts only.
  const posts =
    process.env.NODE_ENV === 'development' ? getAllPostsWithDrafts() : getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}/` },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}/`,
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Static prefix lets webpack build a context module over content/blog.
  const { default: MDXContent } = await import(`../../../content/blog/${slug}.mdx`);

  return (
    <main className="px-4 sm:px-6 pt-28 pb-24">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/blog/"
          className="inline-block mb-6 text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
        >
          ← All writing
        </Link>

        {/* Opaque reading sheet floating over the neural background */}
        <article
          className="rounded-2xl border border-black/5 dark:border-white/10
            bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl
            shadow-xl shadow-black/5 dark:shadow-black/40
            px-6 sm:px-12 py-10 sm:py-14"
        >
          <header className="mb-10 pb-8 border-b border-black/5 dark:border-white/10">
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

            <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {post.title}
            </h1>

            {post.description && (
              <p className="mt-4 max-w-[68ch] text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                {post.description}
              </p>
            )}

            {post.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
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
          </header>

          {/* The sheet is full width so figures and code can use the whole
              page, but running text keeps a ~68ch measure — direct-child
              selectors, so content inside a figure is left alone. */}
          <div
            className="prose prose-slate dark:prose-invert prose-xl max-w-none
              prose-headings:font-display prose-headings:tracking-tight
              prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
              prose-code:text-cyan-700 dark:prose-code:text-cyan-300 prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-slate-50 dark:prose-pre:bg-slate-950/60
              prose-pre:border prose-pre:border-black/5 dark:prose-pre:border-white/10
              prose-blockquote:border-l-cyan-500/40
              [&>p]:max-w-[68ch] [&>ul]:max-w-[68ch] [&>ol]:max-w-[68ch]
              [&>h2]:max-w-[68ch] [&>h3]:max-w-[68ch] [&>h4]:max-w-[68ch]
              [&>blockquote]:max-w-[68ch] [&>hr]:max-w-[68ch]"
          >
            <MDXContent />
          </div>
        </article>
      </div>
    </main>
  );
}
