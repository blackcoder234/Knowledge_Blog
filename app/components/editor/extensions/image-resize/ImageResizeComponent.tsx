import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React, { useState, useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";

export const ImageResizeComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  deleteNode,
}) => {
  const [resizing, setResizing] = useState(false);
  const [width, setWidth] = useState(node.attrs.width || "100%");
  const [alignment, setAlignment] = useState(node.attrs.textAlign || "center");

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with attributes
  useEffect(() => {
    setWidth(node.attrs.width || "100%");
    setAlignment(node.attrs.textAlign || "center");
  }, [node.attrs.width, node.attrs.textAlign]);

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);

    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!imgRef.current) return;

      const currentX = moveEvent.clientX;
      const diffX = currentX - startX;

      // Calculate new width
      // If dragging right handle: startWidth + diffX
      // If dragging left handle: startWidth - diffX
      const newWidth = direction.includes("right")
        ? startWidth + diffX
        : startWidth - diffX;

      // Simple constraint
      if (newWidth > 50) {
        // Update local state for smoothness
        setWidth(`${newWidth}px`);
      }
    };

    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      // Save final width to attributes
      if (imgRef.current) {
        updateAttributes({ width: `${imgRef.current.offsetWidth}px` });
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const setAlign = (align: "left" | "center" | "right") => {
    updateAttributes({ textAlign: align });
    setAlignment(align);
  };

  return (
    <NodeViewWrapper
      className={twMerge(
        "relative my-6 group leading-none",
        alignment === "left" && "flex justify-start",
        alignment === "center" && "flex justify-center",
        alignment === "right" && "flex justify-end",
      )}
    >
      <div
        ref={containerRef}
        className={twMerge(
          "relative inline-block transition-all duration-200",
          selected ? "ring-2 ring-blue-500/50" : "ring-0",
        )}
        style={{ width: width === "100%" ? "100%" : width, maxWidth: "100%" }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          className="rounded-lg shadow-lg border border-white/10 w-full h-auto block"
        />

        {/* Floating Toolbar (Only on selection) */}
        {selected && !resizing && (
          <div className="absolute top-2 right-2 flex gap-1 bg-black/80 backdrop-blur rounded-lg border border-white/10 p-1 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setAlign("left")}
              className={twMerge(
                "p-1.5 rounded hover:bg-white/10 text-gray-300",
                alignment === "left" && "bg-white/20 text-white",
              )}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => setAlign("center")}
              className={twMerge(
                "p-1.5 rounded hover:bg-white/10 text-gray-300",
                alignment === "center" && "bg-white/20 text-white",
              )}
              title="Align Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => setAlign("right")}
              className={twMerge(
                "p-1.5 rounded hover:bg-white/10 text-gray-300",
                alignment === "right" && "bg-white/20 text-white",
              )}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
            <div className="w-px h-full bg-white/10 mx-0.5" />
            <button
              onClick={deleteNode}
              className="p-1.5 rounded hover:bg-red-500/20 text-red-300 hover:text-red-200"
              title="Delete Image"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Resize Handles (Only on selection) */}
        {selected && (
          <>
            {/* Corners */}
            <div
              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nwse-resize z-10 shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, "top-left")}
            />
            <div
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nesw-resize z-10 shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, "top-right")}
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nesw-resize z-10 shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nwse-resize z-10 shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
            />

            {/* Sides (Optional for Word-like feel, mostly click handles are corners in web) */}
            <div
              className="absolute top-1/2 -right-1.5 w-1.5 h-6 -mt-3 bg-white border border-blue-500 rounded-full cursor-ew-resize z-10 shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, "right")}
            />
            <div
              className="absolute top-1/2 -left-1.5 w-1.5 h-6 -mt-3 bg-white border border-blue-500 rounded-full cursor-ew-resize z-10 shadow-sm"
              onMouseDown={(e) => handleMouseDown(e, "left")}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};
