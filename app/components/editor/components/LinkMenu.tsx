import { useState, useEffect, useRef, useCallback } from "react";
import { Link as LinkIcon, Check, Copy, Unlink } from "lucide-react";

export const LinkMenuComponent = ({ editor }: { editor: any }) => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Sync state with selection
  useEffect(() => {
    if (editor.isActive("link")) {
      setUrl(editor.getAttributes("link").href || "");
      // Get the text content of the link from the selection
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      setText(selectedText || "");

      // If the link is empty (newly created), trigger edit mode
      if (!editor.getAttributes("link").href) {
        setIsEditing(true);
      }
    } else {
      // Reset if we lose focus, though component might unmount
      setUrl("");
      setText("");
      setIsEditing(false);
    }
  }, [editor.state.selection]);

  const handleSave = useCallback(() => {
    // 1. Remove Link if URL is empty
    if (!url) {
      editor.chain().focus().unsetLink().run();
      setIsEditing(false);
      return;
    }

    let finalUrl = url;
    // Basic protocol check
    if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    // 2. If Text is provided, we need to replace the selection with new text + link
    if (text) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .insertContent({
          type: "text",
          text: text,
          marks: [{ type: "link", attrs: { href: finalUrl } }],
        })
        .setLink({ href: finalUrl }) // Ensure link is set if insertContent behaves oddly with marks
        .run();
    } else {
      // 3. If no text changed (or empty), just update the HREF on existing text?
      // Logic: if text is empty in input, maybe user wants to delete text?
      // Standard behavior: if text input is cleared, it typically deletes the node or reverts.
      // Let's assume user wants to keep existing text if they cleared the text field? No, that's confusing.
      // If text field is empty, we should probably warn or just set link on whatever was there?
      // Let's default to: Just set link on current selection.
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalUrl })
        .run();
    }

    setIsEditing(false);
  }, [editor, url, text]);

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setIsEditing(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
  };

  if (!editor.isActive("link")) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 w-72">
      {isEditing ? (
        <>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider ml-1">
                Text to display
              </label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-700"
                placeholder="Link Text"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider ml-1">
                Link URL
              </label>
              <div className="relative">
                <LinkIcon
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  ref={urlInputRef}
                  type="text"
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-sm text-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-700"
                  placeholder="www.example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
            >
              Save Link
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm text-blue-400 hover:underline truncate font-medium"
          >
            {url}
          </a>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Edit Link"
          >
            <Check size={14} className="hidden" />
            <span className="text-xs font-medium px-1">Edit</span>
          </button>
          <button
            onClick={copyLink}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Copy URL"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={removeLink}
            className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
            title="Unlink"
          >
            <Unlink size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
