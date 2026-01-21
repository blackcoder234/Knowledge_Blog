"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { List, AlignLeft } from "lucide-react";

interface TableOfContentsProps {
  editor: Editor | null;
}

export const TableOfContents = ({ editor }: TableOfContentsProps) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateTableOfContents = () => {
      const headings: any[] = [];
      const transaction = editor.state.tr;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          headings.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });

      setItems(headings);
    };

    updateTableOfContents();

    editor.on("update", updateTableOfContents);
    editor.on("selectionUpdate", updateTableOfContents);

    return () => {
      editor.off("update", updateTableOfContents);
      editor.off("selectionUpdate", updateTableOfContents);
    };
  }, [editor]);

  const handleItemClick = (pos: number) => {
    if (editor) {
      editor.commands.setTextSelection(pos);
      editor.commands.scrollIntoView();
      // Optional: focus
      editor.commands.focus();
    }
  };

  if (!editor || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-white/5 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 text-zinc-400">
        <AlignLeft size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">
          Contents
        </span>
      </div>
      <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item.pos)}
            className={`
              block w-full text-left text-sm py-1 transition-colors truncate
              ${item.level === 1 ? "font-bold text-white" : ""}
              ${item.level === 2 ? "pl-3 text-zinc-300 hover:text-cyan-400" : ""}
              ${item.level >= 3 ? "pl-6 text-zinc-500 hover:text-zinc-300" : ""}
            `}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
};
