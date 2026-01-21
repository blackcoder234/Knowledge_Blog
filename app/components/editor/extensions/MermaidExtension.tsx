import { mergeAttributes, Node, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import mermaid from "mermaid";
import React, { useEffect, useRef, useState, useCallback, useId } from "react";
import { Code, Eye, Edit2, RotateCcw } from "lucide-react";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

const MermaidNodeView = ({
  node,
  updateAttributes,
  selected,
  getPos,
  editor,
}: any) => {
  const [code, setCode] = useState(
    node.attrs.code || "graph TD\nA[Start] --> B[End]",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, ""); // Ensure valid ID for mermaid

  // Render Diagram
  const renderDiagram = useCallback(async () => {
    try {
      const { svg } = await mermaid.render(`mermaid-${uniqueId}`, code);
      setSvgContent(svg);
      setError("");
    } catch (e: any) {
      console.error("Mermaid Render Error:", e);
      setError("Syntax Error");
      // Keep previous SVG if possible, or show error icon
    }
  }, [code, uniqueId]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  const handleSave = () => {
    updateAttributes({ code });
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="my-8 relative group">
      <div
        className={`relative rounded-xl overflow-hidden border transition-all ${
          selected
            ? "border-cyan-500 ring-1 ring-cyan-500/20"
            : "border-white/10"
        } ${isEditing ? "bg-[#1e1e1e]" : "bg-black/20 hover:border-white/20"}`}
      >
        {/* Header / Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-white/5 select-none">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="p-1 bg-pink-500/10 rounded text-pink-400">
              <Code size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">
              Mermaid Diagram
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title={isEditing ? "View Diagram" : "Edit Source"}
            >
              {isEditing ? <Eye size={14} /> : <Edit2 size={14} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 min-h-[100px] flex justify-center items-center overflow-x-auto bg-[#09090b]">
          {isEditing ? (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 bg-[#121212] text-zinc-300 font-mono text-sm p-4 rounded-lg focus:outline-none resize-none border border-white/10 focus:border-cyan-500/50"
              placeholder="Enter Mermaid syntax..."
              spellCheck={false}
            />
          ) : (
            <div className="w-full flex justify-center">
              {error ? (
                <div className="text-red-400 text-sm flex flex-col items-center gap-2 py-8">
                  <span className="font-bold">Rendering Error</span>
                  <span className="text-xs font-mono bg-red-500/10 px-2 py-1 rounded">
                    {error}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs underline text-zinc-500 mt-2"
                  >
                    Edit Source
                  </button>
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                  className="mermaid-svg-container [&>svg]:mx-auto [&>svg]:max-w-full"
                />
              )}
            </div>
          )}
        </div>

        {/* Save/Cancel Footer for Edit Mode */}
        {isEditing && (
          <div className="px-4 py-3 bg-[#18181b] border-t border-white/5 flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const MermaidExtension = Node.create({
  name: "mermaid",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      code: {
        default: "graph TD\nA[Start] --> B[End]",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='mermaid']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mermaid" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },

  addInputRules() {
    return [
      // Trigger with /mermaid or ```mermaid
      new InputRule({
        find: /^\/mermaid$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          tr.replaceWith(range.from, range.to, this.type.create());
        },
      }),
    ];
  },
});
