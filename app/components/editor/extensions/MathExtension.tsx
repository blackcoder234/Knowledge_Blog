import { mergeAttributes, Node, InputRule, PasteRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
import React, { useEffect, useRef, useState, useCallback } from "react";

// Inline Math: $content$
// Trigger: Ends with $
export const starInputRegex = /(?:^|\s)\$([^$]+)\$$/;

// Block Math: $$content$$
export const blockInputRegex = /^\$\$([^$]+)\$\$$/;

const MathNodeView = ({
  node,
  updateAttributes,
  selected,
  getPos,
  editor,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [latex, setLatex] = useState(node.attrs.latex || "");
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal state when node attributes change
  useEffect(() => {
    setLatex(node.attrs.latex);
  }, [node.attrs.latex]);

  // Handle focus & Positioning
  useEffect(() => {
    if (isEditing) {
      // Focus Input
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }

      // Smart Positioning
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const popoverWidth = 280; // assumed width (matches w-[280px])
        const half = popoverWidth / 2;
        const screenW = window.innerWidth;

        let style: React.CSSProperties = {
          left: "50%",
          transform: "translateX(-50%)",
        };
        let arrow: React.CSSProperties = { left: "50%" };

        // Too close to left edge?
        if (rect.left < half) {
          // Align left
          style = { left: "0px", transform: "translateX(0)" };
          // Arrow should move to where the node center is roughly
          // node center relative to popover left edge is rect.width/2.
          arrow = { left: `${rect.width / 2}px` };
        }
        // Too close to right edge?
        else if (rect.right + half > screenW) {
          // Align right
          style = { left: "auto", right: "0px", transform: "translateX(0)" };
          arrow = { left: "auto", right: `${rect.width / 2}px` };
        }

        setPopoverStyle(style);
        setArrowStyle(arrow);
      }
    }
  }, [isEditing]);

  const save = useCallback(() => {
    if (latex.trim()) {
      updateAttributes({ latex: latex });
      setIsEditing(false);
      editor.commands.focus();
    } else {
      editor.commands.deleteRange({ from: getPos(), to: getPos() + 1 });
      setIsEditing(false);
      editor.commands.focus();
    }
  }, [latex, updateAttributes, editor, getPos]);

  const cancel = useCallback(() => {
    setLatex(node.attrs.latex);
    setIsEditing(false);
    editor.commands.focus();
  }, [node.attrs.latex, editor]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    e.stopPropagation();
  };

  const renderMath = (content: string) => {
    try {
      return katex.renderToString(content, {
        throwOnError: false,
        displayMode: node.attrs.displayMode === "block",
        errorColor: "#cc0000",
      });
    } catch (e) {
      return `<span class="text-red-500 font-mono text-xs">Invalid Equation</span>`;
    }
  };

  useEffect(() => {
    if (!isEditing) return;
    const handleGlobalClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as any)) {
        save();
      }
    };
    window.addEventListener("mousedown", handleGlobalClick);
    return () => window.removeEventListener("mousedown", handleGlobalClick);
  }, [isEditing, save]);

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`relative inline-block ${
        node.attrs.displayMode === "block"
          ? "w-full my-4 flex justify-center"
          : "mx-1 align-middle"
      }`}
    >
      {isEditing && (
        <div
          className="absolute top-full mt-2 z-50 w-[280px] bg-[#1e1e1e] border border-zinc-700/50 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-1 ring-1 ring-white/10 overflow-hidden text-left"
          style={popoverStyle}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#252525] border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                LaTeX
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={cancel}
                className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                title="Cancel"
              >
                <span className="sr-only">Cancel</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <button
                onClick={save}
                className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition-colors"
                title="Save"
              >
                <span className="sr-only">Save</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-2">
            <textarea
              ref={inputRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-16 bg-[#111] border border-zinc-800 rounded p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
              placeholder="E = mc^2"
            />

            {/* Live Preview (Compact) */}
            <div className="mt-2 px-2 py-1.5 bg-black/20 rounded border border-white/5 min-h-[1.5rem] flex items-center justify-center">
              <div
                className="text-white text-sm"
                dangerouslySetInnerHTML={{ __html: renderMath(latex) }}
              />
            </div>
            <div className="mt-1 text-right">
              <span className="text-[9px] text-zinc-600">
                Shift+Enter to new line
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#252525] border-t border-l border-white/5 transform rotate-45"
            style={arrowStyle}
          ></div>
        </div>
      )}
      <span
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer rounded transition-all duration-200 py-1 px-1 ${
          selected || isEditing
            ? "bg-cyan-500/10 ring-1 ring-cyan-500/30"
            : "hover:bg-white/5"
        } ${node.attrs.displayMode === "block" ? "block w-full text-center p-2" : ""}`}
        title="Click to edit equation"
        dangerouslySetInnerHTML={{ __html: renderMath(node.attrs.latex) }}
      />
    </NodeViewWrapper>
  );
};

export const MathExtension = Node.create({
  name: "math",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "E=mc^2",
      },
      displayMode: {
        default: "inline",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='math']",
        getAttrs: (node) => ({
          latex: (node as HTMLElement).getAttribute("data-latex"),
          displayMode:
            (node as HTMLElement).getAttribute("data-display-mode") || "inline",
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "math",
        "data-latex": node.attrs.latex,
        "data-display-mode": node.attrs.displayMode,
        class: "math-node",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView);
  },

  addInputRules() {
    return [
      // Block Math Rule: $$...$$
      new InputRule({
        find: blockInputRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;
          const latex = match[1];
          if (latex) {
            tr.replaceWith(
              start,
              end,
              this.type.create({ latex, displayMode: "block" }),
            );
          }
        },
      }),
      // Inline Math Rule: $...$
      new InputRule({
        find: starInputRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1];
          // We need simple replacement here because regex includes the space if any
          // Actually paste/input rules differ.
          // If regex is /(?:^|\s)\$([^$]+)\$$/, match[0] is " $latex$"
          // match[1] is "latex".
          // We should preserve the leading space if it exists.

          if (latex) {
            const fullMatch = match[0];
            const startOffset = fullMatch.startsWith(" ") ? 1 : 0;
            const start = range.from + startOffset;
            const end = range.to;
            tr.replaceWith(
              start,
              end,
              this.type.create({ latex, displayMode: "inline" }),
            );
          }
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      // Complex LaTeX Block Paste: \begin{env}...\end{env}
      new PasteRule({
        find: /\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const env = match[1];
          const content = match[2];

          if (env && content) {
            let latex = match[0];

            // Smart Transformation for KaTeX compatibility
            // KaTeX often prefers 'aligned' over 'align' for inline/display switching
            if (env === "align" || env === "align*") {
              // We replace the outer align with aligned
              latex = `\\begin{aligned}${content}\\end{aligned}`;
            } else if (env === "equation" || env === "equation*") {
              // Just strip equation wrappers, let $$ handle display
              latex = content.trim();
            }

            tr.replaceWith(
              range.from,
              range.to,
              this.type.create({ latex, displayMode: "block" }),
            );
          }
        },
      }),
      // Block Math Paste: $$...$$
      new PasteRule({
        find: /\$\$([\s\S]*?)\$\$/g, // Improved regex to catch multiline
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1];
          if (latex) {
            tr.replaceWith(
              range.from,
              range.to,
              this.type.create({ latex, displayMode: "block" }),
            );
          }
        },
      }),
      // LaTeX Display Math Paste: \[...\]
      new PasteRule({
        find: /\\\[([\s\S]*?)\\\]/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1];
          if (latex) {
            tr.replaceWith(
              range.from,
              range.to,
              this.type.create({ latex, displayMode: "block" }),
            );
          }
        },
      }),
      // LaTeX Inline Math Paste: \(...\)
      new PasteRule({
        find: /\\\(([\s\S]*?)\\\)/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1];
          if (latex) {
            tr.replaceWith(
              range.from,
              range.to,
              this.type.create({ latex, displayMode: "inline" }),
            );
          }
        },
      }),
      // Inline Math Paste: $...$
      new PasteRule({
        find: /(?:^|\s)\$([^$]+)\$(?:$|\s)/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1];
          if (latex) {
            tr.replaceWith(
              range.from,
              range.to,
              this.type.create({ latex, displayMode: "inline" }),
            );
          }
        },
      }),
    ];
  },
});
