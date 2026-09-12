import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';

/** Dual themes emit --shiki-light/--shiki-dark vars; globals.css picks one. */
const prettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark-dimmed' },
  keepBackground: false,
  defaultLang: 'plaintext',
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  pageExtensions: ['js', 'jsx', 'mdx'],
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // remarkFrontmatter parses the --- block so it is not rendered as content.
    // Frontmatter *values* are read separately by lib/blog.js via gray-matter.
    remarkPlugins: [remarkFrontmatter, remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-anchor'] } }],
      [rehypePrettyCode, prettyCodeOptions],
    ],
  },
});

export default withMDX(nextConfig);
