import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
import { useEffect, useRef, useState } from "react";

export const MathComponent = ({
  node,
  updateAttributes,
  selected,
  getPos,
  editor,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latex = node.attrs.latex || "E=mc^2";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length,
      );
    }
  }, [isEditing]);

  const renderMath = (tex: string) => {
    try {
      return {
        __html: katex.renderToString(tex, {
          throwOnError: false,
          output: "html",
        }),
      };
    } catch (e) {
      return { __html: "<span class='text-red-500'>Invalid Syntax</span>" };
    }
  };

  const handleDone = () => {
    setIsEditing(false);
    if (!latex.trim()) {
      editor.commands.deleteRange({ from: getPos(), to: getPos() + 1 });
    }
  };

  return (
    <NodeViewWrapper
      className={`inline-block mx-1 relative ${selected ? "ring-2 ring-cyan-500/50 rounded" : ""}`}
    >
      {/* Popover Editor */}
      {isEditing && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-[100] w-[300px] bg-[#1A1A1A] border border-white/10 shadow-2xl rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase">
              Edit Equation
            </span>
            <button
              onClick={handleDone}
              className="text-xs bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-black px-2 py-1 rounded transition-colors font-medium"
            >
              Done
            </button>
          </div>

          <textarea
            ref={inputRef}
            value={latex}
            onChange={(e) => updateAttributes({ latex: e.target.value })}
            onKeyDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-cyan-500/50 resize-y min-h-[80px]"
            placeholder="\sqrt{x^2 + y^2}"
          />

          <div className="bg-black/20 rounded p-2 flex justify-center border border-white/5 min-h-[40px] items-center">
            <span dangerouslySetInnerHTML={renderMath(latex)} />
          </div>

          {/* Arrow Pointer */}
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-[#1A1A1A] border-r border-b border-white/10 transform rotate-45"></div>
        </div>
      )}

      {/* Rendered View */}
      <span
        className={`cursor-pointer transition-opacity ${isEditing ? "opacity-20" : "hover:opacity-80"}`}
        onDoubleClick={() => setIsEditing(true)}
        title="Double click to edit"
        dangerouslySetInnerHTML={renderMath(latex)}
      />
    </NodeViewWrapper>
  );
};

export const MathExtension = Node.create({
  name: "mathComponent",

  group: "inline",

  inline: true,

  atom: true,

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
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["math-component", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-e": () =>
        this.editor.commands.insertContent({ type: this.name }),
    };
  },
});
