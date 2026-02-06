"use client";

import { useEffect, useRef } from "react";
import * as katex from "katex";
import "katex/dist/katex.min.css";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import * as mermaid from "mermaid";

// Initialize mermaid for frontend
if (typeof window !== "undefined") {
  const m = (mermaid as any).default || mermaid;
  if (typeof m.initialize === "function") {
    m.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "Inter, system-ui, sans-serif",
    });
  }
}

interface HtmlRendererProps {
  content: string;
  className?: string;
  onImageClick?: (src: string) => void;
}

export const HtmlRenderer = ({
  content,
  className,
  onImageClick,
}: HtmlRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 1. Syntax Highlighting
      hljs.highlightAll();

      // 2. Code Block Enhancements (Copy Button & Language Label)
      const codeBlocks = containerRef.current.querySelectorAll("pre");
      codeBlocks.forEach((pre) => {
        // Cleanup existing injections to prevent duplicates (React Strict Mode fix)
        // Note: We must escape the forward slash in the selector
        const existingWrapper = pre.closest(".group\\/code");
        if (existingWrapper) {
          // If we already wrapped it, just ensure we don't double-add,
          // but cleaner is to ignore or reset.
          // For simplicity, we'll check inside the wrapper.
          if (existingWrapper.querySelector(".copy-btn")) return;
        }

        // Check if we need to wrap
        if (
          pre.parentNode &&
          !(pre.parentNode as HTMLElement).classList.contains("group/code")
        ) {
          const wrapper = document.createElement("div");
          wrapper.className = "relative group/code mb-8";
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);
        }

        const wrapper = pre.parentNode as HTMLElement;
        // Double check injection
        if (wrapper.querySelector(".copy-btn")) return;

        // Force Code Content Spacing (Fix vertical overlap)
        const codeElement = pre.querySelector("code");
        if (codeElement) {
          codeElement.style.display = "block";
          codeElement.style.paddingTop = "2.5rem"; // Force content down below label
        }

        // Language Label
        const code = pre.querySelector("code");
        const lang =
          Array.from(code?.classList || [])
            .find((c) => c.startsWith("language-"))
            ?.replace("language-", "") || "text";

        if (lang) {
          const label = document.createElement("span");
          label.className =
            "injected-label absolute top-4 left-6 text-xs font-bold text-zinc-500 select-none pointer-events-none";
          label.textContent = lang;
          wrapper.appendChild(label);
        }

        // Copy Button
        const btn = document.createElement("button");
        btn.className =
          "copy-btn absolute top-3 right-4 py-1.5 text-zinc-400 hover:text-white transition-colors z-20 flex items-center gap-2 text-xs font-medium bg-transparent border-none cursor-pointer";

        // Initial State: [Icon] Copy
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        `;

        btn.onclick = () => {
          const text = code?.innerText || "";
          navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span class="text-green-400">Copied!</span>
            `;

            setTimeout(() => {
              btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy</span>
              `;
            }, 2000);
          });
        };
        wrapper.appendChild(btn);
      });

      // 3. Heading Anchors
      const headings = containerRef.current.querySelectorAll("h2, h3");
      headings.forEach((h) => {
        if (h.querySelector(".anchor-link")) return;
        const anchor = document.createElement("a");
        anchor.className =
          "anchor-link ml-2 opacity-0 focus:opacity-100 group-hover:opacity-100 transition-opacity text-accent no-underline";
        anchor.href = `#${h.id}`;
        anchor.innerHTML = "#";
        h.classList.add("group", "flex", "items-center");
        h.appendChild(anchor);
      });

      // 4. Math Rendering
      const mathNodes = containerRef.current.querySelectorAll(
        'span[data-type="math-equation"]',
      );
      mathNodes.forEach((node) => {
        const latex = (node as HTMLElement).getAttribute("data-latex");
        const isBlock =
          (node as HTMLElement).getAttribute("data-is-block") === "true";

        if (latex) {
          try {
            const k = (katex as any).default || katex;
            if (typeof k.render === "function") {
              k.render(latex, node as HTMLElement, {
                throwOnError: false,
                displayMode: isBlock,
                errorColor: "#cc0000",
              });
              if (isBlock) {
                (node as HTMLElement).style.display = "flex";
                (node as HTMLElement).style.justifyContent = "center";
                (node as HTMLElement).style.margin = "2.5rem 0";
                (node as HTMLElement).style.overflowX = "auto";
                (node as HTMLElement).style.overflowY = "hidden";
              }
            }
          } catch (e) {
            console.error("Katex rendering error:", e);
          }
        }
      });

      // 5. Mermaid Diagrams
      const mermaidNodes = containerRef.current.querySelectorAll(
        'div[data-type="mermaid"]',
      );
      mermaidNodes.forEach(async (node, index) => {
        const code = (node as HTMLElement).getAttribute("data-code");
        if (code && !node.querySelector("svg")) {
          try {
            const id = `mermaid-render-${index}`;
            const m = (mermaid as any).default || mermaid;
            if (typeof m.render === "function") {
              const { svg } = await m.render(id, code);
              node.innerHTML = `<div class="mermaid-svg-container w-full flex justify-center py-4 [&>svg]:max-w-full [&>svg]:h-auto">${svg}</div>`;
            } else {
              console.error("Mermaid render function not found");
            }
          } catch (e) {
            console.error("Mermaid Render Error:", e);
            node.innerHTML = `<div class="text-red-500/50 text-[10px] uppercase tracking-widest font-mono p-4 border border-red-500/20 rounded-lg">Diagram Rendering Error</div>`;
          }
        }
      });
    }
  }, [content]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onImageClick) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG" && !target.closest("a")) {
      onImageClick((target as HTMLImageElement).src);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
