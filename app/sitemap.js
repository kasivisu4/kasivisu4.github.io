// app/sitemap.js — generated at build time
import { getAllPosts, SITE_URL } from '@/lib/blog';

export const dynamic = 'force-static';

export default function sitemap() {
  const posts = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}/`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/blog/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...posts,
  ];
}
