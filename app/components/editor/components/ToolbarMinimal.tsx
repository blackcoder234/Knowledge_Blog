import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Quote,
  Undo,
  Redo,
  List,
  ListOrdered,
  Image as ImageIcon,
  Images,
  Upload,
  ChevronDown,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useRef, useState, useEffect } from "react";

interface ToolbarMinimalProps {
  editor: Editor | null;
  onSave?: () => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  onImageUpload?: (file: File) => Promise<string>;
  onOpenMediaLibrary?: () => void;
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  disabled,
  title,
  className,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={twMerge(
      "p-1.5 rounded-md transition-all text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-sm active:scale-95",
      isActive && "bg-blue-500/20 text-blue-400 shadow-glow font-semibold",
      className,
    )}
  >
    {children}
  </button>
);

const Divider = () => (
  <div className="w-px h-5 bg-white/10 mx-1.5 self-center" />
);

const ImageDropdown = ({
  editor,
  onImageUpload,
  onOpenMediaLibrary,
}: {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<string>;
  onOpenMediaLibrary?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleTrigger = () => {
      fileInputRef.current?.click();
    };
    window.addEventListener("trigger-image-upload", handleTrigger);
    return () =>
      window.removeEventListener("trigger-image-upload", handleTrigger);
  }, []);

  const handleOpenMedia = () => {
    setIsOpen(false);
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary();
    } else {
      window.dispatchEvent(
        new CustomEvent("open-media-modal", { detail: { field: "content" } }),
      );
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (onImageUpload) {
        onImageUpload(file);
      } else {
        const url = URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
    if (event.target.value) {
      event.target.value = "";
    }
    setIsOpen(false);
  };

  const handleInsertUrl = () => {
    setIsOpen(false);
    const url = window.prompt("Enter image URL:");
    if (url && url.trim()) {
      editor.chain().focus().setImage({ src: url.trim() }).run();
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Insert Image (Media Library, Device, URL)"
        className={twMerge(
          "p-1.5 rounded-md transition-all text-gray-400 hover:bg-white/10 hover:text-white flex items-center gap-0.5 active:scale-95",
          isOpen && "bg-white/15 text-white",
        )}
      >
        <ImageIcon size={18} />
        <ChevronDown size={11} className="opacity-60" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-[60] flex flex-col gap-1 backdrop-blur-2xl">
          <button
            type="button"
            onClick={handleOpenMedia}
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-left text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
          >
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
              <Images size={15} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white">Media Library</span>
              <span className="text-[10px] text-zinc-400">
                Reuse uploaded or select existing
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-left text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
          >
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <Upload size={15} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white">Upload from Computer</span>
              <span className="text-[10px] text-zinc-400">
                Upload image file from device
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleInsertUrl}
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-left text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
          >
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
              <LinkIcon size={15} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white">Insert from URL</span>
              <span className="text-[10px] text-zinc-400">
                Paste an external image link
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export const ToolbarMinimal = ({
  editor,
  onSave,
  saveStatus,
  onImageUpload,
  onOpenMediaLibrary,
}: ToolbarMinimalProps) => {
  if (!editor) return null;

  const setLink = () => {
    window.dispatchEvent(new Event("open-link-modal"));
  };

  return (
    <div className="border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 py-2 shadow-sm">
      {/* History */}
      <div className="flex gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={18} />
        </ToolbarButton>
      </div>

      <Divider />

      {/* Headings */}
      <div className="flex gap-0.5">
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </ToolbarButton>
      </div>

      <Divider />

      {/* Basic Marks */}
      <div className="flex gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline"
        >
          <Underline size={18} />
        </ToolbarButton>
      </div>

      <Divider />

      {/* Lists & Quote */}
      <div className="flex gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote size={18} />
        </ToolbarButton>
      </div>

      <Divider />

      {/* Media */}
      <div className="flex gap-0.5">
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          title="Link"
        >
          <LinkIcon size={18} />
        </ToolbarButton>

        <ImageDropdown
          editor={editor}
          onImageUpload={onImageUpload}
          onOpenMediaLibrary={onOpenMediaLibrary}
        />
      </div>
    </div>
  );
};
