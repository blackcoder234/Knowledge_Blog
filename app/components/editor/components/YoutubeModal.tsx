import { useState, useEffect, useRef } from "react";
import { X, Youtube } from "lucide-react";
import { Editor } from "@tiptap/react";

interface YoutubeModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const YoutubeModal = ({
  editor,
  isOpen,
  onClose,
}: YoutubeModalProps) => {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen || !editor) return null;

  const handleSave = () => {
    if (!url) {
      return;
    }

    editor.commands.setYoutubeVideo({
      src: url,
      width: 640,
      height: 480,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-white/10 p-6 rounded-2xl w-[400px] shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Youtube className="text-red-500" size={20} />
          Insert Video
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              YouTube URL
            </label>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-blue-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-700 font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
          >
            Embed Video
          </button>
        </div>
      </div>
    </div>
  );
};
