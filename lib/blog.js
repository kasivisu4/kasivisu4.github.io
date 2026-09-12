// lib/blog.js — build-time content layer for the MDX blog.
// Runs only in server components / build scripts, never in the browser.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export const SITE_URL = 'https://kasivisu4.github.io';

function readPostFile(fileName) {
  const slug = fileName.replace(/\.mdx?$/, '');
  const raw = fs.readFileSync(path.join(BLOG_DIR, fileName), 'utf8');
  const { data, content } = matter(raw);

  return {
    slug,
    content,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: data.date ?? null,
    tags: data.tags ?? [],
    draft: Boolean(data.draft),
    readingTime: readingTime(content).text,
  };
}

function readAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(readPostFile)
    .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0));
}

/**
 * Published posts, newest first.
 * This is the listing surface — index page, RSS feed and sitemap all use it,
 * so drafts never appear in anything that links or advertises a post.
 */
export function getAllPosts() {
  return readAllPosts().filter((post) => !post.draft);
}

/**
 * Every post including drafts. Used only to decide which pages to build.
 * Drafts get a real URL but are unlisted and marked noindex, so they are
 * previewable on the deployed site without being discoverable.
 */
export function getAllPostsWithDrafts() {
  return readAllPosts();
}

/**
 * Posts shown on the blog index. Drafts are listed while developing so you can
 * reach them locally, and are dropped from the deployed build, where they stay
 * unlisted and noindex.
 */
export function getListedPosts() {
  return process.env.NODE_ENV === 'development' ? readAllPosts() : getAllPosts();
}

export function getPostBySlug(slug) {
  return readAllPosts().find((post) => post.slug === slug) ?? null;
}

/** Every tag in use across published posts, most frequent first. */
export function getAllTags() {
  const counts = new Map();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
