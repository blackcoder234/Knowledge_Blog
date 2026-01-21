"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface ArticleContentProps {
  content: string;
}

export const ArticleContent = ({ content }: ArticleContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Find all math nodes rendered by Tiptap
      const mathNodes = containerRef.current.querySelectorAll(
        'span[data-type="math"]',
      );

      mathNodes.forEach((node) => {
        const latex = (node as HTMLElement).getAttribute("data-latex");
        const displayMode = (node as HTMLElement).getAttribute(
          "data-display-mode",
        );

        if (latex) {
          try {
            katex.render(latex, node as HTMLElement, {
              throwOnError: false,
              displayMode: displayMode === "block",
              errorColor: "#cc0000",
            });
            // Add spacing for block math
            if (displayMode === "block") {
              (node as HTMLElement).style.display = "flex";
              (node as HTMLElement).style.justifyContent = "center";
              (node as HTMLElement).style.margin = "1.5rem 0";
            }
          } catch (e) {
            console.error("Katex rendering error:", e);
          }
        }
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="prose prose-invert prose-lg text-zinc-300 prose-headings:font-serif prose-headings:text-white prose-headings:font-medium prose-strong:text-white prose-blockquote:border-l-accent prose-blockquote:bg-white/5 prose-blockquote:py-4 prose-blockquote:pl-6 prose-blockquote:not-italic prose-code:text-accent prose-code:bg-white/5 prose-code:p-1 prose-code:rounded ProseMirror"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
