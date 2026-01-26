import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { ArrowLeftRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

export const MathEquationComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [source, setSource] = useState(node.attrs.latex || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isBlock = node.attrs.isBlock;

  // Sync source with node attributes
  useEffect(() => {
    setSource(node.attrs.latex || "");
  }, [node.attrs.latex]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Small timeout to ensure DOM is ready and focus sticks
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isEditing]);

  const renderMath = useCallback(
    (latex: string) => {
      try {
        const k = (katex as any).default || katex;
        const html = k.renderToString(latex, {
          throwOnError: true,
          displayMode: isBlock,
          errorColor: "#cc0000",
        });
        return { html, error: null };
      } catch (e: any) {
        return { html: "", error: e.message || "Invalid Equation" };
      }
    },
    [isBlock],
  );

  const saveAndRender = () => {
    updateAttributes({ latex: source });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setSource(node.attrs.latex || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to save (shift+enter for newline if needed, though usually equations are one-linerish in this context)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveAndRender();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
    e.stopPropagation();
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isEditing) {
          saveAndRender();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, source]);

  const { html: displayHtml, error: displayError } = renderMath(
    node.attrs.latex || "",
  );

  // Dynamic height for textarea
  const adjustTextareaHeight = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  return (
    <NodeViewWrapper
      className={twMerge(
        "relative transition-all duration-200",
        isBlock ? "block my-4 mx-0" : "inline-block mx-1 align-middle",
      )}
    >
      <div
        ref={containerRef}
        className={twMerge(
          "relative group flex items-stretch transition-all duration-200 border rounded-sm",
          // Word-like styles:
          "bg-[#F5F5F7]/5 hover:bg-[#F5F5F7]/10", // Subtle background
          isEditing || selected
            ? "border-blue-500/50 ring-1 ring-blue-500/20 shadow-sm"
            : "border-transparent",
          isBlock ? "w-full" : "min-w-[20px] px-0.5",
        )}
        onMouseDown={(e) => {
          // Use onMouseDown to capture the interacton before Tiptap selection.
          // This fixes the "Double Click" issue.
          if (!isEditing) {
            e.stopPropagation();
            setIsEditing(true);
          }
        }}
      >
        {/* Main Content Area */}
        <div
          className={twMerge(
            "flex-grow flex items-center min-h-[2em] px-2 py-1",
            isBlock && "justify-center",
          )}
        >
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type equation..."
              className={twMerge(
                "w-full bg-transparent text-sm font-mono text-gray-200 outline-none resize-none overflow-hidden leading-relaxed placeholder:text-gray-600",
                isBlock && "text-center",
              )}
              style={{ height: "1.5em" }}
              rows={1}
            />
          ) : (
            <div
              className={twMerge(
                "cursor-pointer",
                !node.attrs.latex && "text-gray-500 italic text-sm",
              )}
            >
              {displayError ? (
                <span className="text-red-400 text-xs bg-red-900/10 px-1 rounded">
                  {node.attrs.latex} (?)
                </span>
              ) : !node.attrs.latex ? (
                "Type equation..."
              ) : (
                <span dangerouslySetInnerHTML={{ __html: displayHtml }} />
              )}
            </div>
          )}
        </div>

        {/* Floating Toolbar (Preview + Toggle) */}
        {isEditing && (
          <div className="absolute left-0 bottom-full mb-1.5 flex flex-col items-start gap-1 z-50">
            {/* Top Bar: Preview + Controls */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded shadow-xl flex items-center overflow-hidden">
              {/* Toggle Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateAttributes({ isBlock: !isBlock });
                  // Keep focus
                  setTimeout(() => inputRef.current?.focus(), 10);
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] uppercase font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors border-r border-white/10"
                title="Toggle Display Mode"
              >
                <ArrowLeftRight size={10} />
                {isBlock ? "Block" : "Inline"}
              </button>

              {/* Preview Content */}
              {source && (
                <div className="px-3 py-1.5 bg-[#1a1a1a] min-w-[20px]">
                  {(() => {
                    const { html, error } = renderMath(source);
                    if (error)
                      return (
                        <span className="text-red-400 text-xs">{error}</span>
                      );
                    return <span dangerouslySetInnerHTML={{ __html: html }} />;
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
