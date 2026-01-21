import { mergeAttributes, Node, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
import { useEffect, useRef, useState, useCallback } from "react";

// Input Rule Regex for $content$ -> (dollar signs)
// Matches content between two dollar signs (non-greedy)
export const inputRegex = /(?:\$)([^$]+)(?:\$)$/;

export const MathComponent = ({
  node,
  updateAttributes,
  selected,
  getPos,
  editor,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLatex, setTempLatex] = useState(node.attrs.latex);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if node changes externally
  useEffect(() => {
    setTempLatex(node.attrs.latex);
  }, [node.attrs.latex]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Set cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const save = useCallback(() => {
    if (tempLatex.trim()) {
      updateAttributes({ latex: tempLatex });
      setIsEditing(false);
      editor.commands.focus();
    } else {
      // If empty, remove the node? Or just close?
      // Standard behavior: Remove empty math node
      editor.commands.deleteRange({ from: getPos(), to: getPos() + 1 });
      setIsEditing(false);
      editor.commands.focus();
    }
  }, [tempLatex, updateAttributes, editor, getPos]);

  const cancel = useCallback(() => {
    setTempLatex(node.attrs.latex); // Revert
    setIsEditing(false);
    editor.commands.focus();
  }, [node.attrs.latex, editor]);

  // Keyboard Shortcuts inside the Popover
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Stop Tiptap from handling these
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const renderMath = (tex: string) => {
    try {
      return {
        __html: katex.renderToString(tex, {
          throwOnError: false,
          output: "html",
          displayMode: false, // Inline math
        }),
      };
    } catch (e) {
      return {
        __html: "<span class='text-red-400 font-mono'>Invalid Syntax</span>",
      };
    }
  };

  // Click outside listener to save/close
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        save(); // Save on click away (Notion style)
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, save]);

  return (
    <NodeViewWrapper className="inline-block mx-1 align-middle relative">
      {/* Popover Editor */}
      {isEditing && (
        <div
          ref={containerRef}
          className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)] z-[50] w-[320px] bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 ring-1 ring-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-white/5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Equation
            </span>
            <div className="flex gap-2">
              <span className="text-[10px] text-zinc-600">Enter to save</span>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Input Area */}
            <textarea
              ref={inputRef}
              value={tempLatex}
              onChange={(e) => setTempLatex(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#111] border border-zinc-800 rounded-lg p-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50 resize-y min-h-[80px] leading-relaxed selection:bg-cyan-900"
              placeholder="\sum_{i=0}^n i^2 = \frac{(n^2+n)(2n+1)}{6}"
            />

            {/* Live Preview */}
            <div className="bg-[#151515] rounded-lg p-3 border border-zinc-800/50 flex flex-col gap-2">
              <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">
                Preview
              </span>
              <div className="flex justify-center min-h-[30px] items-center overflow-x-auto text-lg text-white">
                <span
                  dangerouslySetInnerHTML={renderMath(tempLatex || "...")}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex p-2 bg-[#252525] border-t border-white/5 gap-2">
            <button
              onClick={cancel}
              className="flex-1 px-3 py-1.5 rounded text-xs font-medium text-zinc-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-1 px-3 py-1.5 rounded text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
            >
              Done
            </button>
          </div>

          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#252525] border-b border-r border-white/5 transform rotate-45"></div>
        </div>
      )}

      {/* Rendered View (The Node Itself) */}
      <span
        onClick={() => setIsEditing(true)}
        className={`
          inline-flex items-baseline cursor-pointer px-1 py-0.5 rounded transition-all duration-200
          ${selected || isEditing ? "bg-cyan-500/10 ring-1 ring-cyan-500/30" : "hover:bg-white/5"}
        `}
        title="Click to edit equation"
      >
        <span dangerouslySetInnerHTML={renderMath(node.attrs.latex)} />
      </span>
    </NodeViewWrapper>
  );
};

export const MathExtension = Node.create({
  name: "mathComponent",

  group: "inline",

  inline: true,

  atom: true,

  draggable: true, // Industry standard: equations should be draggable

  addAttributes() {
    return {
      latex: {
        default: "E=mc^2",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "math-component",
      },
      {
        tag: "span[data-type='math']", // Backward compat or general support
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["math-component", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addInputRules() {
    return [
      new InputRule({
        find: inputRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;
          const latex = match[1]; // Capture group 1 is the content

          if (latex) {
            tr.replaceWith(start, end, this.type.create({ latex }));
          }
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-e": () =>
        this.editor.commands.insertContent({ type: this.name }),
    };
  },
});
