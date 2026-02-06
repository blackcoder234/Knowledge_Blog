"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export const TableOfContents = () => {
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [activeId, setActiveId] = useState<string>("");
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const findHeadings = () => {
      const article = document.querySelector(".prose-article");
      if (!article) return false;

      const elements = article.querySelectorAll("h1, h2, h3");
      if (elements.length === 0) return false;

      const items: { id: string; text: string; level: number }[] = [];
      elements.forEach((el, index) => {
        if (!el.id) {
          el.id = `heading-${index}`;
        }
        items.push({
          id: el.id,
          text: el.textContent || "",
          level: parseInt(el.tagName.charAt(1)),
        });
      });

      setHeadings(items);

      // Intersection Observer for Scroll-Spy
      observer.current = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries.filter((e) => e.isIntersecting);
          if (visibleEntries.length > 0) {
            setActiveId(visibleEntries[0].target.id);
          }
        },
        { rootMargin: "-10% 0px -80% 0px", threshold: 0 },
      );

      elements.forEach((el) => observer.current?.observe(el));
      return true;
    };

    // Initial attempt
    if (!findHeadings()) {
      // Retry after a short delay if not found (for hydration/client rendering lag)
      const timer = setTimeout(findHeadings, 500);
      return () => {
        clearTimeout(timer);
        observer.current?.disconnect();
      };
    }

    return () => observer.current?.disconnect();
  }, [headings.length === 0]); // Re-run if it was empty

  if (headings.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl p-8 sticky top-24 shadow-2xl">
        <h4 className="mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(255,215,0,0.4)]"></span>
          Table of Contents
        </h4>
        <p className="text-sm text-zinc-500">No headings found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl p-8 sticky top-24 shadow-2xl">
      <h4 className="mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(255,215,0,0.4)]"></span>
        Table of Contents
      </h4>
      <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto scrollbar-none pr-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
            className="group/item"
          >
            <Link
              href={`#${heading.id}`}
              className={`
                block text-sm transition-all border-l-2 py-2 pl-4 -ml-px
                ${
                  activeId === heading.id
                    ? "text-accent border-accent font-semibold bg-accent/5 ring-1 ring-accent/10 rounded-r-lg"
                    : "text-zinc-500 border-white/5 hover:text-zinc-200 hover:border-zinc-500"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(heading.id);
                if (element) {
                  const offset = 120;
                  const bodyRect = document.body.getBoundingClientRect().top;
                  const elementRect = element.getBoundingClientRect().top;
                  const elementPosition = elementRect - bodyRect;
                  const offsetPosition = elementPosition - offset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <span className="truncate block">{heading.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
