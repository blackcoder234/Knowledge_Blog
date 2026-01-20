"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { MathExtension } from "./extensions/MathExtension";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";

const lowlight = createLowlight(common);

import { useState, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Type,
  Underline as UnderlineIcon,
  Youtube as YoutubeIcon,
  Sigma,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export const RichTextEditor = ({
  value,
  onChange,
  onImageUpload,
}: RichTextEditorProps) => {
  // Editor Initialization
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      MathExtension,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-accent underline cursor-pointer",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      Youtube.configure({
        controls: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands or start writing...",
      }),
    ],
    content: value, // Initial content only
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6",
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/") && onImageUpload) {
            // Prevent default drop
            event.preventDefault();
            // Upload
            onImageUpload(file).then((url) => {
              if (url) {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (coordinates) {
                  const node = schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.insert(
                    coordinates.pos,
                    node,
                  );
                  view.dispatch(transaction);
                }
              }
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1 && onImageUpload) {
              const file = items[i].getAsFile();
              if (file) {
                onImageUpload(file).then((url) => {
                  if (url) {
                    editor?.chain().focus().setImage({ src: url }).run();
                  }
                });
                return true; // handled
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Hydrate content when value updates externally (e.g. loading from DB)
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      // We only update if the user isn't currently typing (focused)
      // OR if the editor is practically empty (initial load)
      // This allows external updates (like Draft Restore) to apply correctly
      if (!editor.isFocused || editor.isEmpty) {
        // Maintain cursor position if possible? No, setContent resets it usually.
        // Since we only do this when NOT focused, it's fine.
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  // Handle image upload via button
  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImageUpload) {
        try {
          const url = await onImageUpload(file);
          if (url) {
            editor?.chain().focus().setImage({ src: url }).run();
          }
        } catch (error) {
          console.error("Failed to upload image inside editor", error);
        }
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  // Handle Youtube
  const addYoutube = useCallback(() => {
    const url = prompt("Enter YouTube URL");
    if (url) {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  // Handle generic link addition
  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative group min-h-[600px] flex flex-col bg-[#0D0D0D] rounded-xl border border-white/10 overflow-hidden transition-all hover:border-cyan-500/30">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/5 bg-[#121212] sticky top-0 z-20">
        {/* History */}
        <div className="flex gap-1 pr-2 border-r border-white/5">
          <ToolBtn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon={<Undo size={18} />}
            tooltip="Undo"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon={<Redo size={18} />}
            tooltip="Redo"
          />
        </div>

        {/* Text Style */}
        <div className="flex gap-1 px-2 border-r border-white/5">
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            icon={<Bold size={18} />}
            tooltip="Bold (Cmd+B)"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            icon={<Italic size={18} />}
            tooltip="Italic (Cmd+I)"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            icon={<UnderlineIcon size={18} />}
            tooltip="Underline (Cmd+U)"
          />
          <ToolBtn
            onClick={setLink}
            isActive={editor.isActive("link")}
            icon={<LinkIcon size={18} />}
            tooltip="Link"
          />
        </div>

        {/* Headings */}
        <div className="flex gap-1 px-2 border-r border-white/5">
          <ToolBtn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            icon={<Heading1 size={18} />}
            tooltip="H1 Title"
          />
          <ToolBtn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            icon={<Heading2 size={18} />}
            tooltip="H2 Subtitle"
          />
        </div>

        {/* Alignment */}
        <div className="flex gap-1 px-2 border-r border-white/5">
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            icon={<AlignLeft size={18} />}
            tooltip="Align Left"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            icon={<AlignCenter size={18} />}
            tooltip="Align Center"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            icon={<AlignRight size={18} />}
            tooltip="Align Right"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            icon={<AlignJustify size={18} />}
            tooltip="Justify"
          />
        </div>

        {/* Lists & Quotes */}
        <div className="flex gap-1 px-2 border-r border-white/5">
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            icon={<List size={18} />}
            tooltip="Bullet List"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            icon={<ListOrdered size={18} />}
            tooltip="Ordered List"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            icon={<Quote size={18} />}
            tooltip="Quote"
          />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            icon={<Code size={18} />}
            tooltip="Code Block"
          />
        </div>

        {/* Media */}
        <div className="flex gap-1 px-2">
          <ToolBtn
            onClick={addImage}
            icon={<ImageIcon size={18} />}
            tooltip="Insert Image"
          />
          <ToolBtn
            onClick={addYoutube}
            icon={<YoutubeIcon size={18} />}
            tooltip="Insert Video"
          />
          <ToolBtn
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent({ type: "mathComponent" })
                .run()
            }
            icon={<Sigma size={18} />}
            tooltip="Insert Equation"
          />
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#0D0D0D] cursor-text">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2 bg-[#121212] border-t border-white/5 flex justify-between items-center text-xs text-zinc-500 font-medium">
        <div className="flex gap-4">
          <span>{editor.storage.characterCount?.words?.() || 0} words</span>
        </div>
      </div>
    </div>
  );
};

// Tool Button Helper
const ToolBtn = ({ icon, tooltip, onClick, isActive, disabled }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg transition-all group relative ${
      isActive
        ? "bg-cyan-500/20 text-cyan-500"
        : "text-zinc-400 hover:text-white hover:bg-white/5"
    } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
  >
    {icon}
    {tooltip && (
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {tooltip}
      </span>
    )}
  </button>
);
