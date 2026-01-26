import { useState, useEffect, useRef } from "react";
import { Search, X, Replace } from "lucide-react";
import { Editor } from "@tiptap/react";

interface SearchReplaceProps {
  editor: Editor | null;
}

export const SearchReplace = ({ editor }: SearchReplaceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        // If opening, focus next tick
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 50);
        } else {
          // If closing, clear search?
          // Maybe optional. User might want to keep highlighting.
          // But usually toggling off means finish.
          editor?.commands.clearSearch();
        }
      }

      if (isOpen && e.key === "Escape") {
        setIsOpen(false);
        editor?.commands.clearSearch();
        editor?.commands.focus();
      }
    };

    const handleToggleSearch = () => {
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        editor?.commands.clearSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-search", handleToggleSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-search", handleToggleSearch);
    };
  }, [isOpen, editor]);

  // Update highlight when search term changes
  useEffect(() => {
    if (editor && isOpen) {
      editor.commands.setSearchTerm(searchTerm);
    }
  }, [searchTerm, editor, isOpen]);

  // Clear on close
  useEffect(() => {
    if (!isOpen && editor) {
      editor.commands.clearSearch();
    }
  }, [isOpen, editor]);

  const replaceNext = () => {
    if (editor && searchTerm) {
      editor.commands.replaceSingle(searchTerm, replaceTerm);
    }
  };

  const replaceAll = () => {
    if (editor && searchTerm) {
      editor.commands.replaceAll(searchTerm, replaceTerm);
    }
  };

  if (!isOpen || !editor) return null;

  return (
    <div className="fixed top-20 right-8 z-50 bg-[#121212] border border-white/10 p-3 rounded-xl shadow-2xl w-80 animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={14}
          />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Find..."
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
          />
          <button
            onClick={() => {
              setIsOpen(false);
              editor.commands.clearSearch();
              editor.commands.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Replace Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Replace size={14} />
            </div>
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replace with..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-1 border-t border-white/5">
          <span className="text-[10px] text-gray-600 font-mono">
            {searchTerm ? "Enter search term" : "Type to highlight"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={replaceNext}
              disabled={!searchTerm}
              className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/5 hover:border-white/20 transition-all disabled:opacity-50"
              title="Replace Next"
            >
              Replace
            </button>
            <button
              onClick={replaceAll}
              disabled={!searchTerm}
              className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/5 hover:border-white/20 transition-all disabled:opacity-50"
              title="Replace All"
            >
              All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
