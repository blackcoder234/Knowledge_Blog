import { useRef, useEffect } from "react";
import { X, Type, FileText, Clock, AlignLeft } from "lucide-react";
import { Editor } from "@tiptap/react";

interface StatsModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal = ({ editor, isOpen, onClose }: StatsModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !editor) return null;

  const text = editor.getText();
  const wordCount = editor.storage.characterCount.words();
  // Custom manual counts for precision
  const charCountWithSpaces = text.length;
  const charCountNoSpaces = text.replace(/\s/g, "").length;
  const paragraphCount =
    editor.getJSON().content?.filter((node) => node.type === "paragraph")
      .length || 0;

  // Reading time (avg 225 wpm)
  const readingTime = Math.ceil(wordCount / 225);
  // Speaking time (avg 130 wpm)
  const speakingTime = Math.ceil(wordCount / 130);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-[#121212] border border-white/10 p-6 rounded-2xl w-[400px] shadow-2xl relative animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="text-blue-500" size={20} />
          Document Statistics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">
              {wordCount}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Words
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">
              {charCountWithSpaces}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Characters
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Type size={16} />
              <span>Characters (no spaces)</span>
            </div>
            <span className="text-gray-200 font-mono">{charCountNoSpaces}</span>
          </div>

          <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <AlignLeft size={16} />
              <span>Paragraphs</span>
            </div>
            <span className="text-gray-200 font-mono">{paragraphCount}</span>
          </div>

          <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={16} />
              <span>Reading Time</span>
            </div>
            <span className="text-gray-200 font-mono">{readingTime} min</span>
          </div>

          <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={16} />
              <span>Speaking Time</span>
            </div>
            <span className="text-gray-200 font-mono">{speakingTime} min</span>
          </div>
        </div>
      </div>
    </div>
  );
};
