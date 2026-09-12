// app/feed.xml/route.js — static RSS feed, rendered once at build time.
import { getAllPosts, SITE_URL } from '@/lib/blog';

export const dynamic = 'force-static';

const escapeXml = (unsafe = '') =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export function GET() {
  const posts = getAllPosts();

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}/</guid>
      <description>${escapeXml(post.description)}</description>
      ${post.date ? `<pubDate>${new Date(post.date).toUTCString()}</pubDate>` : ''}
      ${post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Kasi Vandanapu — Writing</title>
    <link>${SITE_URL}/blog/</link>
    <description>Notes on data engineering, analytics, and building LLM-powered systems in production.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
