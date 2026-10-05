'use client';

// components/viz/chutes/Info.jsx
//
// The (i) help marker used across the Chutes figure. Hover or focus it for a
// short explanation of what a component shows and how to read it.
//
// The popover is portalled to <body> and positioned from the marker's rect.
// Rendered in place it would be clipped by the sidebar's scroll container and
// sit under the fixed navbar -- the page's <main> is a `z-10` stacking
// context nothing inside it can escape.
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const WIDTH = 288;

export default function Info({ children, label = 'What is this?', className = '' }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const show = useCallback(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - WIDTH / 2), window.innerWidth - WIDTH - 8);
    // Below the marker, unless that would run off the bottom of the viewport.
    const below = r.bottom + 8;
    setPos({ left, top: below, flip: below + 160 > window.innerHeight, anchorTop: r.top - 8 });
  }, []);
  const hide = useCallback(() => setPos(null), []);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full border border-slate-400/60 text-[9px] font-bold leading-none text-slate-500 hover:border-cyan-500 hover:text-cyan-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 dark:text-slate-400 dark:hover:text-cyan-300 ${className}`}
      >
        i
      </button>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[80] rounded-lg border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 shadow-xl dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            style={{
              left: pos.left,
              width: WIDTH,
              ...(pos.flip ? { bottom: window.innerHeight - pos.anchorTop } : { top: pos.top }),
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
