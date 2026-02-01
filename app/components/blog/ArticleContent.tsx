"use client";

import { useEffect, useRef, useState } from "react";
import * as katex from "katex";
import "katex/dist/katex.min.css";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import * as mermaid from "mermaid";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

import { JsonRenderer } from "./JsonRenderer";

interface ArticleContentProps {
  content: string; // HTML Fallback
  contentJson?: any; // Preferred
}

export const ArticleContent = ({
  content,
  contentJson,
}: ArticleContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // LEGACY: Only run these DOM manipulations if we are rendering HTML string
  useEffect(() => {
    if (contentJson) return; // Skip if using JSON renderer

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
  }, [content, contentJson]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only for fallback HTML images. JSON renderer handles its own clicks if needed.
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG" && !target.closest("a")) {
      setZoomImage((target as HTMLImageElement).src);
    }
  };

  if (contentJson) {
    return (
      <div className="prose prose-invert prose-xl max-w-none">
        <JsonRenderer content={contentJson} />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        onClick={handleImageClick}
        className="prose prose-invert prose-xl max-w-none text-zinc-300/90 
          prose-headings:font-serif prose-headings:text-white
          
          /* Typography Hierarchy */
          prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-8 prose-h1:text-white
          prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b prose-h2:border-white/5 prose-h2:font-bold
          prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:font-semibold
          prose-h4:text-xl prose-h4:mt-8 prose-h4:mb-4 prose-h4:font-bold prose-h4:text-white
          prose-h5:text-lg prose-h5:mt-6 prose-h5:mb-2 prose-h5:font-bold prose-h5:text-zinc-200
          prose-h6:text-sm prose-h6:mt-6 prose-h6:mb-2 prose-h6:font-bold prose-h6:uppercase prose-h6:tracking-widest prose-h6:text-zinc-400
          
          prose-p:text-xl prose-p:leading-relaxed prose-p:mb-8 prose-p:font-light
          prose-a:text-accent prose-a:no-underline prose-a:border-b prose-a:border-accent/30 hover:prose-a:border-accent prose-a:transition-colors
          
          /* Lists & HR */
          prose-ul:my-8 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-8 prose-ol:list-decimal prose-ol:pl-6
          prose-li:my-3 prose-li:text-zinc-300/90
          [&_li_>_ul]:my-2 [&_li_>_ol]:my-2  /* Nested List Spacing (Subtle) */
          prose-li:marker:text-accent/50
          prose-hr:my-16 prose-hr:border-white/10
          
          prose-strong:text-white prose-strong:font-bold
          prose-code:text-accent prose-code:bg-accent/5 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          
          /* Code Blocks */
          prose-pre:bg-zinc-900/80 prose-pre:border prose-pre:border-white/20 prose-pre:rounded-xl prose-pre:px-6 prose-pre:pb-6 prose-pre:pt-16 prose-pre:my-12
          
          /* Images */
          prose-img:rounded-xl prose-img:border prose-img:border-white/20 prose-img:shadow-xl prose-img:my-12
          [&_img]:cursor-zoom-in

          /* Tables (Industry Standard UI Style) */
          /* Layout & Sizing */
          [&_table]:w-auto [&_table]:min-w-[50%] [&_table]:border-collapse [&_table]:my-8 [&_table]:block [&_table]:overflow-x-auto md:[&_table]:table [&_table]:table-auto
          [&_col]:w-auto!important [&_col]:min-w-[auto]!important
          [&_td]:w-auto!important [&_th]:w-auto!important
          
          /* Table Container & Head */
          [&_table]:border [&_table]:border-white/20 [&_table]:rounded-lg [&_table]:overflow-hidden
          [&_thead]:bg-zinc-800/50 [&_thead]:border-b [&_thead]:border-white/20
          
          /* Header Cells */
          [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-zinc-400 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider
          [&_th]:border-r [&_th]:border-white/20 [&_th:last-child]:border-r-0
          
          /* Body Cells */
          [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-white/10 [&_td]:text-zinc-300 [&_td]:text-sm [&_td]:align-middle
          [&_td]:border-r [&_td]:border-white/10 [&_td:last-child]:border-r-0
          
          /* Interactions */
          [&_tbody_tr:last-child_td]:border-b-0
          [&_tbody_tr:hover]:bg-white/5 [&_tbody_tr]:transition-colors
          ProseMirror"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <button
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setZoomImage(null)}
            >
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomImage ?? undefined}
              alt="Zoomed"
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
