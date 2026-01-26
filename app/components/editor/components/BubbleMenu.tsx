import { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code2,
  Link as LinkIcon,
  Unlink,
  Heading2,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

interface BubbleMenuProps {
  editor: Editor | null;
}

const BubbleBtn = ({
  onClick,
  isActive,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={twMerge(
      "p-2 rounded transition-all text-gray-300 hover:text-white hover:bg-white/10",
      isActive && "bg-yellow-400 text-black shadow-lg font-medium",
    )}
  >
    {children}
  </button>
);

export const BubbleMenu = ({ editor }: BubbleMenuProps) => {
  if (!editor) return null;

  const setLink = () => {
    window.dispatchEvent(new Event("open-link-modal"));
  };

  return (
    <TiptapBubbleMenu
      editor={editor}
      className="glass-panel rounded-lg p-1 flex gap-1 animate-in fade-in slide-in-from-bottom-2 overflow-hidden"
    >
      {/* H2 as default heading option */}
      <BubbleBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 size={16} />
      </BubbleBtn>

      <div className="w-px h-auto bg-white/10 mx-1" />

      <BubbleBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
      >
        <Bold size={16} />
      </BubbleBtn>
      <BubbleBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
      >
        <Italic size={16} />
      </BubbleBtn>
      <BubbleBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
      >
        <Underline size={16} />
      </BubbleBtn>
      <BubbleBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
      >
        <Strikethrough size={16} />
      </BubbleBtn>
      <BubbleBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
      >
        <Code2 size={16} />
      </BubbleBtn>

      <div className="w-px h-auto bg-white/10 mx-1" />

      <BubbleBtn onClick={setLink} isActive={editor.isActive("link")}>
        <LinkIcon size={16} />
      </BubbleBtn>
      {editor.isActive("link") && (
        <BubbleBtn onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink size={16} />
        </BubbleBtn>
      )}
    </TiptapBubbleMenu>
  );
};
