import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

interface TableOfContentsProps {
  editor: Editor | null;
  floating?: boolean;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
  pos: number;
}

export const TableOfContents = ({
  editor,
  floating = true,
}: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items: HeadingItem[] = [];

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const id = `heading-${pos}`;
          items.push({
            id,
            text: node.textContent,
            level: node.attrs.level,
            pos,
          });
        }
      });

      setHeadings(items);
    };

    updateHeadings();

    // Subscribe to updates
    editor.on("update", updateHeadings);
    return () => {
      editor.off("update", updateHeadings);
    };
  }, [editor]);

  if (headings.length === 0) return null;

  const handleClick = (pos: number) => {
    if (editor) {
      editor.chain().focus().setTextSelection(pos).run();
      const dom = editor.view.nodeDOM(pos) as HTMLElement;
      if (dom && dom.scrollIntoView) {
        dom.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setTimeout(() => {
          const element = editor.view.dom.querySelector(".has-focus");
          if (element)
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
    }
  };

  return (
    <div
      className={twMerge(
        "p-4 duration-700",
        floating
          ? "hidden xl:block fixed right-8 top-32 w-64 animate-in fade-in slide-in-from-right-10"
          : "relative w-full border border-white/5 rounded-xl bg-black/20 mb-6",
      )}
    >
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        {!floating && (
          <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
        )}
        On this page
      </h3>
      <div className="space-y-1 relative">
        {/* Track line (only for floating or if desired, sticking to vertical line style) */}
        <div className="absolute left-0 top-2 bottom-2 w-px bg-white/5" />

        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => handleClick(heading.pos)}
            className={twMerge(
              "block text-left w-full text-sm transition-all duration-200 border-l-2 border-transparent pl-4 py-1",
              "text-gray-400 hover:text-white hover:border-white/20",
              heading.level === 1 && "font-semibold text-gray-200",
              heading.level === 2 && "ml-0",
              heading.level === 3 && "ml-2 text-xs",
              heading.level > 3 && "ml-4 text-xs tracking-tight",
            )}
            style={{
              marginLeft: `${(heading.level - 1) * 4}px`,
            }}
          >
            {heading.text || "Untitled"}
          </button>
        ))}
      </div>
    </div>
  );
};
