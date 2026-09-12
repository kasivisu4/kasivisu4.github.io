// mdx-components.jsx — required by @next/mdx in the App Router.
// Element overrides applied to every compiled MDX document.
import Link from 'next/link';

export function useMDXComponents(components) {
  return {
    a: ({ href = '', children, ...props }) => {
      const isInternal = href.startsWith('/') || href.startsWith('#');
      if (isInternal) {
        return (
          <Link href={href} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    // Images are unoptimized in this static export, so a plain img is correct.
    img: ({ alt = '', ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} className="rounded-xl border border-white/10" {...props} />
    ),
    ...components,
  };
}
