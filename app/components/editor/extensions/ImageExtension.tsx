import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useRef, useState, useCallback, useEffect } from "react";
import ImageExtension from "@tiptap/extension-image";

const ImageNodeView = ({ node, updateAttributes, selected }: any) => {
  const [caption, setCaption] = useState(node.attrs.caption || "");
  const [width, setWidth] = useState(node.attrs.width || "100%");
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Sync state
  useEffect(() => {
    setCaption(node.attrs.caption);
    setWidth(node.attrs.width);
  }, [node.attrs.caption, node.attrs.width]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = containerRef.current.offsetWidth;
    // Store percentage basis if possible, or pixel.
    resizeRef.current = { startX, startWidth };

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeRef.current || !containerRef.current) return;

      const currentX = e.clientX;
      const diff = currentX - resizeRef.current.startX;
      const newWidth = resizeRef.current.startWidth + diff;

      // Convert to percentage of parent? Or keep px?
      // Tiptap images usually work well with %, but simple resize is often px.
      // Let's stick to percentage if parent is accessible, else px.
      // For simplicity, let's just write px for now, unless it was 100%.

      // Actually, simple constraint:
      const safeWidth = Math.max(100, Math.min(newWidth, 800)); // Min 100px, max 800px (or unbounded)

      updateAttributes({ width: `${safeWidth}px` });
      setWidth(`${safeWidth}px`);
    },
    [updateAttributes],
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeRef.current = null;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value);
    updateAttributes({ caption: e.target.value });
  };

  return (
    <NodeViewWrapper className="my-6 flex flex-col items-center">
      <figure
        ref={containerRef}
        className={`relative group transition-all duration-200 ${selected || isResizing ? "ring-2 ring-cyan-500 rounded-lg" : ""}`}
        style={{ width: width, maxWidth: "100%" }}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt}
          className="rounded-lg w-full h-auto object-cover"
        />

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute right-2 bottom-2 w-4 h-4 bg-white/20 hover:bg-cyan-500 rounded-full cursor-se-resize backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
          title="Drag to resize"
        >
          <div className="w-2 h-2 bg-white rounded-full pointer-events-none" />
        </div>
      </figure>

      <input
        type="text"
        placeholder="Type caption..."
        value={caption}
        onChange={handleCaptionChange}
        className="mt-2 text-center text-sm text-zinc-500 bg-transparent border-none focus:ring-0 focus:text-zinc-300 placeholder:text-zinc-700 w-full"
      />
    </NodeViewWrapper>
  );
};

export const CustomImageExtension = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        renderHTML: (attributes) => ({
          width: attributes.width,
        }),
      },
      height: {
        default: null,
      },
      caption: {
        default: "",
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
