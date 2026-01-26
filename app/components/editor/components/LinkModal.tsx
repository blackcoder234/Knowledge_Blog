import { useState, useEffect, useRef } from "react";
import { X, Link as LinkIcon } from "lucide-react";
import { Editor } from "@tiptap/react";

interface LinkModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  initialUrl?: string;
}

export const LinkModal = ({
  editor,
  isOpen,
  onClose,
  initialText = "",
  initialUrl = "",
}: LinkModalProps) => {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Update effect when opening
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setUrl(initialUrl);
      // Focus logic
      setTimeout(() => {
        if (!initialText && !initialUrl) {
          // Creating new? maybe focus text
        } else {
          urlInputRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, initialText, initialUrl]);

  if (!isOpen || !editor) return null;

  const handleSave = () => {
    if (!url) {
      // If no URL but text exists, just insert text? Or do nothing?
      // Assuming we require URL for a link.
      return;
    }

    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    if (initialText && !text) {
      // User cleared the text? Remove link or insert just URL?
      // Let's assume extending invalidates it
    }

    // Logic for insertion vs update
    // If we are updating an entire selection or inserting new
    if (text) {
      // If there was a selection, we need to handle replacing it intelligently
      // Ideally we assume the "Text" field represents what should be there.
      editor
        .chain()
        .focus()
        // If we are in "Update" mode, we might want to extend to the full range of the link
        // BUT editor state might have changed if we clicked out.
        // Since this is a Modal, we likely preserved selection or need to restore it?
        // Tiptap maintains selection if we didn't blur the editor excessively,
        // but clicking the modal inputs blurs the editor.
        // However, transaction will apply to current selection.
        // If we opened modal, we should have locked selection/range.
        .extendMarkRange("link")
        .insertContent({
          type: "text",
          text: text,
          marks: [{ type: "link", attrs: { href: finalUrl } }],
        })
        .run();
    } else {
      // Fallback if user cleared text but kept URL? (Rare case)
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalUrl })
        .run();
    }

    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
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
          <LinkIcon className="text-blue-500" size={20} />
          {initialUrl ? "Edit Link" : "Insert Link"}
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Text to display
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: Google"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700"
              autoFocus={!initialText}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              URL Address
            </label>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Example: google.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700 font-medium"
              autoFocus={!!initialText}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          {initialUrl && (
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mr-auto"
            >
              Remove Link
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
