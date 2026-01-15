"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Button } from '../ui/Button';
import { useState, useCallback } from 'react';

// Icons
const Icons = {
    Bold: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
    Italic: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="19"/><line x1="14" y1="4" x2="5" y2="19"/></svg>,
    Link: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    Code: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    OrderedList: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>,
    H1: () => <span className="font-bold text-sm">H1</span>,
    H2: () => <span className="font-bold text-sm">H2</span>,
    Quote: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>,
    Undo: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
    Redo: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>,
    PaintBucket: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>,
    Highlighter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 7-3-3-9 9 3 3 9-9Z"/></svg>
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export const RichTextEditor = ({ value, onChange, onImageUpload }: RichTextEditorProps) => {
    
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
          openOnClick: false,
          HTMLAttributes: {
             class: 'text-accent underline cursor-pointer'
          }
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: 'Write something amazing...',
      }),
    ],
    content: value,
    editorProps: {
        attributes: {
            class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]',
        },
    },
    immediatelyRender: false, // Fix for SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Handle image upload via button
  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
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
                alert("Failed to upload image");
            }
        } else if (file) {
            // Fallback if no uploader provided: Base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                editor?.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
  }, [editor, onImageUpload]);

  // Handle generic link addition
  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative group min-h-[600px] flex flex-col bg-card rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 shadow-2xl shadow-black/50">
      
      {/* Premium Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/5 bg-[#121212] sticky top-0 z-10">
        
        {/* History */}
        <div className="flex gap-1 pr-2 border-r border-white/5">
            <ToolBtn 
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                icon={<Icons.Undo/>} 
                tooltip="Undo" 
            />
            <ToolBtn 
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                icon={<Icons.Redo/>} 
                tooltip="Redo" 
            />
        </div>

        {/* Text Style */}
        <div className="flex gap-1 px-2 border-r border-white/5">
            <ToolBtn 
                onClick={() => editor.chain().focus().toggleBold().run()} 
                isActive={editor.isActive('bold')}
                icon={<Icons.Bold/>} 
                tooltip="Bold" 
            />
            <ToolBtn 
                onClick={() => editor.chain().focus().toggleItalic().run()} 
                isActive={editor.isActive('italic')}
                icon={<Icons.Italic/>} 
                tooltip="Italic" 
            />
            <ToolBtn 
                onClick={setLink} 
                isActive={editor.isActive('link')}
                icon={<Icons.Link/>} 
                tooltip="Link" 
            />
        </div>

        {/* Headings */}
        <div className="flex gap-1 px-2 border-r border-white/5">
            <ToolBtn 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                isActive={editor.isActive('heading', { level: 1 })}
                icon={<Icons.H1/>} 
                tooltip="Heading 1" 
            />
            <ToolBtn 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                isActive={editor.isActive('heading', { level: 2 })}
                icon={<Icons.H2/>} 
                tooltip="Heading 2" 
            />
        </div>

        {/* Lists & Quotes */}
        <div className="flex gap-1 px-2 border-r border-white/5">
             <ToolBtn 
                onClick={() => editor.chain().focus().toggleBulletList().run()} 
                isActive={editor.isActive('bulletList')}
                icon={<Icons.List/>} 
                tooltip="Bullet List" 
            />
            <ToolBtn 
                onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                isActive={editor.isActive('orderedList')}
                icon={<Icons.OrderedList/>} 
                tooltip="Ordered List" 
            />
            <ToolBtn 
                onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                isActive={editor.isActive('blockquote')}
                icon={<Icons.Quote/>} 
                tooltip="Quote" 
            />
             <ToolBtn 
                onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                isActive={editor.isActive('codeBlock')}
                icon={<Icons.Code/>} 
                tooltip="Code Block" 
            />
        </div>

         {/* Colors */}
         <div className="flex gap-1 px-2 border-r border-white/5 items-center">
            {/* Highlighting */}
            <div className="flex gap-1">
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button 
                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#facc15' }).run()} // Yellow
                    className={`w-6 h-6 rounded border border-white/10 bg-yellow-400 hover:scale-110 transition-transform ${editor.isActive('highlight', { color: '#facc15' }) ? 'ring-2 ring-white' : ''}`}
                    title="Highlight Yellow"
                ></button>
                <button 
                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#4ade80' }).run()} // Green
                    className={`w-6 h-6 rounded border border-white/10 bg-green-400 hover:scale-110 transition-transform ${editor.isActive('highlight', { color: '#4ade80' }) ? 'ring-2 ring-white' : ''}`}
                    title="Highlight Green"
                ></button>
                <button 
                    onClick={() => editor.chain().focus().toggleHighlight({ color: '#f472b6' }).run()} // Pink
                    className={`w-6 h-6 rounded border border-white/10 bg-pink-400 hover:scale-110 transition-transform ${editor.isActive('highlight', { color: '#f472b6' }) ? 'ring-2 ring-white' : ''}`}
                    title="Highlight Pink"
                ></button>
            </div>

             {/* Text Color */}
             <div className="flex gap-1 ml-2">
                 <button 
                    onClick={() => editor.chain().focus().setColor('#f87171').run()} // Red Text
                    className="text-red-400 font-bold hover:bg-white/10 p-1 rounded" title="Red Text"
                >A</button>
                 <button 
                    onClick={() => editor.chain().focus().setColor('#60a5fa').run()} // Blue Text
                    className="text-blue-400 font-bold hover:bg-white/10 p-1 rounded" title="Blue Text"
                >A</button>
                  <button 
                    onClick={() => editor.chain().focus().unsetColor().run()} // Reset
                    className="text-zinc-400 font-bold hover:bg-white/10 p-1 rounded text-xs" title="Reset Color"
                >x</button>
            </div>
        </div>

        {/* Media */}
        <div className="flex gap-1 px-2">
            <ToolBtn 
                onClick={addImage} 
                icon={<Icons.Image/>} 
                tooltip="Insert Image" 
            />
        </div>

      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#0D0D0D] p-8 cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} className="min-h-[400px]" />
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
                ? 'bg-accent/20 text-accent' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
        } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
        {icon}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {tooltip}
        </span>
    </button>
);
