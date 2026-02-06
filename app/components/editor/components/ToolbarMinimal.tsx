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
  Link as LinkIcon,
  Heading1,
  Heading2,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useRef } from "react";

interface ToolbarMinimalProps {
  editor: Editor | null;
  onSave?: () => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  onImageUpload?: (file: File) => Promise<string>;
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

export const ToolbarMinimal = ({
  editor,
  onSave,
  saveStatus,
  onImageUpload,
}: ToolbarMinimalProps) => {
  if (!editor) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (onImageUpload) {
        // Now just fire and forget, the Editor component handles the optimistic UI
        onImageUpload(file);
      } else {
        const url = URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
    if (event.target.value) {
      event.target.value = "";
    }
  };

  const setLink = () => {
    // Dispatch event to existing link modal handler in App.tsx
    // Or simpler: just standard prompt if we wanted to be vastly simpler,
    // but preserving the modal event is cleaner if App.tsx is wrapping this.
    // Since user said "do not need to link anywhere", I assume they mean "don't wire it up to App.tsx"
    // BUT usually a toolbar lives inside the App context.
    // I will use the same event dispatch pattern as it's the established way in this codebase.
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

      {/* Formatting */}
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

        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Image"
        >
          <ImageIcon size={18} />
        </ToolbarButton>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};
