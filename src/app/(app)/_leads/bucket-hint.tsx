"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

/**
 * The one thing about this board that is not self-evident: why some people
 * are on it and most are not.
 *
 * Opens on hover for a mouse and on tap for a phone, since a phone has no
 * hover and a hint nobody can reach is not a hint.
 */
export function BucketHint({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  // A tap opens it; a tap anywhere else closes it again.
  useEffect(() => {
    if (!open) return;
    function away(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  return (
    <span
      ref={wrap}
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={title}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex size-5 items-center justify-center rounded-full text-[var(--board-ink-muted)] transition-colors hover:text-[var(--board-ink)]"
      >
        <HelpCircle className="size-4" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute top-full left-0 z-30 mt-2 block w-64 rounded-lg bg-[var(--board-ink)] p-3 text-left shadow-lg"
        >
          <span className="block text-xs font-bold text-white">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-white/80">
            {children}
          </span>
          {/* Little arrow pointing back at the icon. */}
          <span className="absolute -top-1 left-2 size-2 rotate-45 bg-[var(--board-ink)]" />
        </span>
      )}
    </span>
  );
}
