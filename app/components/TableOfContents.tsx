"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const TableOfContents = () => {
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);

  useEffect(() => {
    // Wait for content to render.
    // The article is wrapped in .prose class as per ArticleContent.tsx
    const article = document.querySelector(".prose");
    if (!article) return;

    const elements = article.querySelectorAll("h1, h2, h3");
    const items: { id: string; text: string; level: number }[] = [];

    elements.forEach((el, index) => {
      // Ensure ID exists
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
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 sticky top-24">
      <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
        Contents
      </h4>
      <ul className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 0.5}rem` }}
          >
            <Link
              href={`#${heading.id}`}
              className={`
                block text-sm transition-colors border-l-2 pl-4 -ml-px py-1
                ${heading.level === 1 ? "text-white font-medium border-white/20 hover:border-accent" : "text-zinc-400 border-transparent hover:border-zinc-600 hover:text-zinc-200"}
              `}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(heading.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {heading.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
