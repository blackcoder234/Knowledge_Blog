"use client";

import { useEffect, useRef, useState } from "react";
import * as katex from "katex";
import "katex/dist/katex.min.css";
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

interface ArticleContentProps {
  content: string;
}

export const ArticleContent = ({ content }: ArticleContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 2. Code Block Enhancements (Copy Button & Language Label)
      const codeBlocks = containerRef.current.querySelectorAll("pre");
      codeBlocks.forEach((pre) => {
        if (pre.querySelector(".copy-btn")) return; // Prevent double injection

        const wrapper = document.createElement("div");
        wrapper.className = "relative group/code mb-8";
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Language Label
        const code = pre.querySelector("code");
        const lang =
          Array.from(code?.classList || [])
            .find((c) => c.startsWith("language-"))
            ?.replace("language-", "") || "code";

        if (lang) {
          const label = document.createElement("span");
          label.className =
            "absolute top-0 right-12 px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 select-none opacity-0 group-hover/code:opacity-100 transition-opacity";
          label.textContent = lang;
          wrapper.appendChild(label);
        }

        // Copy Button
        const btn = document.createElement("button");
        btn.className =
          "copy-btn absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 opacity-0 group-hover/code:opacity-100 transition-all z-10";
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

        btn.onclick = () => {
          const text = code?.innerText || "";
          navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
              btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
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

      // 6. Image Zoom Listeners
      const images = containerRef.current.querySelectorAll("img");
      images.forEach((img) => {
        img.classList.add(
          "cursor-zoom-in",
          "transition-transform",
          "hover:scale-[1.01]",
        );
        img.onclick = () => setZoomImage(img.src);
      });
    }
  }, [content]);

  return (
    <>
      <div
        ref={containerRef}
        className="prose prose-invert prose-xl max-w-none text-zinc-300/90 
          prose-headings:font-serif prose-headings:text-white prose-headings:font-bold
          prose-h2:text-5xl prose-h2:mt-24 prose-h2:mb-12 prose-h2:pb-4 prose-h2:border-b prose-h2:border-white/5
          prose-h3:text-3xl prose-h3:mt-16 prose-h3:mb-8 prose-h3:text-white/90
          prose-p:text-xl prose-p:leading-relaxed prose-p:mb-10 prose-p:font-light
          prose-strong:text-white prose-strong:font-bold
          prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:py-8 prose-blockquote:px-12 prose-blockquote:not-italic prose-blockquote:rounded-r-3xl prose-blockquote:text-2xl prose-blockquote:my-16
          prose-code:text-accent prose-code:bg-accent/5 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-zinc-900/80 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-3xl prose-pre:p-10 prose-pre:my-12
          prose-img:rounded-[2.5rem] prose-img:border prose-img:border-white/10 prose-img:shadow-2xl prose-img:my-20
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
