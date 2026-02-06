"use client";

import {
  useEditor,
  EditorContent,
  Editor as TiptapEditor,
} from "@tiptap/react";
import { useEffect, useState, forwardRef } from "react";
import { editorExtensions } from "./editor.config";
import { BubbleMenu } from "./components/BubbleMenu";
import { LinkModal } from "./components/LinkModal";
import { YoutubeModal } from "./components/YoutubeModal";
import { StatsModal } from "./components/StatsModal";
import { SearchReplace } from "./components/SearchReplace";
import { Toolbar } from "./components/Toolbar";
import { ToolbarMinimal } from "./components/ToolbarMinimal";
import { TableMenu } from "./components/TableMenu";
import { CMSEditorLayout } from "./cms-ui/CMSEditorLayout";
import { twMerge } from "tailwind-merge";
import "./editor.css";

interface EditorProps {
  value: string;
  onChange: (value: string, json?: any) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onEditorReady?: (editor: TiptapEditor) => void;
  onSave?: () => void;
  onToggleZenMode?: () => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  placeholder?: string;
  className?: string;
  isZenMode?: boolean;
  title?: string;
  onTitleChange?: (val: string) => void;
}

export const Editor = forwardRef<any, EditorProps>(
  (
    {
      value,
      onChange,
      onImageUpload,
      onEditorReady,
      onSave,
      onToggleZenMode,
      saveStatus = "saved",
      placeholder = "Start writing...",
      className,
      isZenMode = false,
      title,
      onTitleChange,
    },
    ref,
  ) => {
    // Modal States
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkModalData, setLinkModalData] = useState({ text: "", url: "" });
    const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

    // Optimistic Image Upload Handler
    const handleImageFile = async (file: File): Promise<string> => {
      if (!onImageUpload || !editor) return "";

      // 1. Create temporary preview
      const blobUrl = URL.createObjectURL(file);
      // const uniqueId = `img-upload-${Date.now()}`;

      // 2. Insert image immediately with "uploading" state
      editor.commands.command(({ tr, dispatch }) => {
        if (dispatch) {
          const node = editor.schema.nodes.image.create({
            src: blobUrl,
            class: "is-uploading", // Defined in editor.css
          });
          tr.replaceSelectionWith(node);
        }
        return true;
      });

      try {
        // 3. Perform actual upload
        const url = await onImageUpload(file);

        if (url) {
          // 4. Swap blob with real URL and remove class
          // We need to find the specific node.
          editor.view.state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs.src === blobUrl) {
              const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                src: url,
                class: null, // Remove the class
              });
              editor.view.dispatch(tr);
              return false; // Stop iteration
            }
            return true;
          });
          return url;
        }
      } catch (error) {
        console.error("Image upload failed", error);
        // Remove the failed image
        editor.view.state.doc.descendants((node, pos) => {
          if (node.type.name === "image" && node.attrs.src === blobUrl) {
            const tr = editor.view.state.tr.delete(pos, pos + node.nodeSize);
            editor.view.dispatch(tr);
            return false;
          }
          return true;
        });
      }
      return "";
    };

    const editor = useEditor({
      extensions: editorExtensions,
      content: value,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: twMerge(
            "prose prose-invert prose-xl max-w-none outline-none min-h-[500px] px-8 py-6",
            className,
          ),
        },
        handlePaste: (view, event) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item) =>
            item.type.startsWith("image/"),
          );

          if (imageItem && onImageUpload) {
            const file = imageItem.getAsFile();
            if (file) {
              event.preventDefault();
              handleImageFile(file); // Use optimistic handler
              return true;
            }
          }
          return false;
        },
        handleDrop: (view, event, _slice, moved) => {
          if (
            !moved &&
            event.dataTransfer &&
            event.dataTransfer.files &&
            event.dataTransfer.files[0]
          ) {
            const file = event.dataTransfer.files[0];
            if (file.type.startsWith("image/") && onImageUpload) {
              event.preventDefault();
              // Create a synthesized File object to pass to our handler if needed,
              // or just call handleImageFile directly?
              // handleImageFile relies on `editor` instance which might not be fully ready inside `editorProps` init?
              // Actually, `editor` variable in `useEditor` hook isn't available inside `editorProps` definition because it's const cyclic dependency.
              // BUT: `handleImageFile` is defined in the component scope. `useEditor` runs once.
              // We need to use the `view` passed to handleDrop to get the editor instance or just use logic inline?
              // `handleImageFile` uses `editor` state variable which is null initially!
              // FIX: Logic must be inline or use a ref that is stable?
              // Even better: Extract logic to a standalone function that takes `view`?
              // Let's inline the logic for Drop but using the `view` provided by Tiptap event.

              const blobUrl = URL.createObjectURL(file);

              // Insert Optimistic
              const { schema } = view.state;
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (coordinates) {
                const node = schema.nodes.image.create({
                  src: blobUrl,
                  class: "is-uploading",
                });
                const tr = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(tr);

                // Async Upload
                onImageUpload(file)
                  .then((url) => {
                    if (url) {
                      // Swap
                      view.state.doc.descendants((node, pos) => {
                        if (
                          node.type.name === "image" &&
                          node.attrs.src === blobUrl
                        ) {
                          const tr = view.state.tr.setNodeMarkup(
                            pos,
                            undefined,
                            { ...node.attrs, src: url, class: null },
                          );
                          view.dispatch(tr);
                          return false;
                        }
                        return true;
                      });
                    }
                  })
                  .catch((e) => {
                    // Fail
                    view.state.doc.descendants((node, pos) => {
                      if (
                        node.type.name === "image" &&
                        node.attrs.src === blobUrl
                      ) {
                        const tr = view.state.tr.delete(
                          pos,
                          pos + node.nodeSize,
                        );
                        view.dispatch(tr);
                        return false;
                      }
                      return true;
                    });
                  });
              }
              return true;
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const json = editor.getJSON();
        onChange(html, json);
      },
      onCreate: ({ editor }) => {
        if (onEditorReady) {
          onEditorReady(editor);
        }
      },
    });

    // Handle external value changes (e.g. initial load, restore draft, or reset)
    useEffect(() => {
      if (!editor) return;

      const currentContent = editor.getHTML();

      // SMART SYNC:
      // Only update content if it's truly different.
      // This prevents cursor jumping when the parent state updates (even if identical/normalized).
      // We removed the `editor.isEmpty` check because "Restore Draft" needs to overwrite
      // the default empty paragraph `<p></p>`.
      if (value && value !== currentContent) {
        // Additional check:
        // Tiptap might produce slightly different HTML than what was passed in due to normalization.
        // However, since `value` primarily comes FROM the editor (via onChange), they usually match.
        // In cases like "Restore Draft", `value` is completely different, so this triggers safely.
        editor.commands.setContent(value);
      }
    }, [value, editor]);

    // Track the ref if provided
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(editor);
        } else {
          (ref as any).current = editor;
        }
      }
    }, [editor, ref]);

    // Event Listeners for Modals (dispatched by Toolbar/Components)
    useEffect(() => {
      if (!editor) return;

      const handleOpenLinkModal = () => {
        let initialText = "";
        let initialUrl = "";
        const { from, to } = editor.state.selection;
        initialText = editor.state.doc.textBetween(from, to, " ");
        if (editor.isActive("link")) {
          initialUrl = editor.getAttributes("link").href;
        }
        setLinkModalData({ text: initialText, url: initialUrl });
        setIsLinkModalOpen(true);
      };

      const handleOpenYoutubeModal = () => setIsYoutubeModalOpen(true);
      const handleOpenStatsModal = () => setIsStatsModalOpen(true);

      window.addEventListener("open-link-modal", handleOpenLinkModal);
      window.addEventListener("open-youtube-modal", handleOpenYoutubeModal);
      window.addEventListener("open-stats-modal", handleOpenStatsModal);

      return () => {
        window.removeEventListener("open-link-modal", handleOpenLinkModal);
        window.removeEventListener(
          "open-youtube-modal",
          handleOpenYoutubeModal,
        );
        window.removeEventListener("open-stats-modal", handleOpenStatsModal);
      };
    }, [editor]);

    if (!editor) {
      return null;
    }

    if (isZenMode) {
      return (
        <CMSEditorLayout
          editor={editor}
          saveStatus={saveStatus}
          onSave={onSave}
          onToggleZenMode={onToggleZenMode}
          lastSaved={new Date()} // In a real app we might want to pass this prop too
          title={title}
          onTitleChange={onTitleChange}
          onImageUpload={handleImageFile}
          modals={{
            link: {
              isOpen: isLinkModalOpen,
              onClose: () => setIsLinkModalOpen(false),
              data: linkModalData,
            },
            youtube: {
              isOpen: isYoutubeModalOpen,
              onClose: () => setIsYoutubeModalOpen(false),
            },
            stats: {
              isOpen: isStatsModalOpen,
              onClose: () => setIsStatsModalOpen(false),
              onOpen: () => setIsStatsModalOpen(true),
            },
          }}
        />
      );
    }

    const wordCount = editor?.storage.characterCount?.words() || 0;
    const readingTime = Math.ceil(wordCount / 225);

    return (
      <div
        className={twMerge(
          "relative w-full flex flex-col transition-all duration-500 ease-in-out gap-4",
          className,
        )}
      >
        {/* Unified Card Container */}
        <div className="group flex flex-col w-full h-[750px] bg-[#09090b] border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all duration-200 hover:border-cyan-500/50">
          {/* 1. Header: Toolbar */}
          <div className="bg-[#09090b] border-b border-white/5">
            <ToolbarMinimal
              editor={editor}
              onSave={onSave}
              saveStatus={saveStatus}
              onImageUpload={handleImageFile}
            />
          </div>

          {/* 2. Body: Scrollable Content Area */}
          <div
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent p-4 md:p-8 cursor-text bg-gradient-to-b from-[#09090b] to-[#050505]"
            onClick={() => {
              if (!editor.isFocused) {
                editor.chain().focus().run();
              }
            }}
          >
            <div className="max-w-4xl mx-auto min-h-full">
              <BubbleMenu editor={editor} />
              <TableMenu editor={editor} />

              <EditorContent
                editor={editor}
                className="prose prose-invert prose-lg max-w-none outline-none pb-20"
              />
            </div>
          </div>

          {/* 3. Footer: Status Bar */}
          <div className="h-10 bg-[#09090b] border-t border-white/10 flex items-center justify-between px-4 text-xs font-mono select-none">
            <div className="flex items-center gap-4 text-zinc-500">
              <span className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
                <span className="font-semibold text-zinc-400">{wordCount}</span>{" "}
                words
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
                <span className="font-semibold text-zinc-400">
                  {readingTime}
                </span>{" "}
                min read
              </span>
            </div>

            <div className="flex items-center gap-3">
              {saveStatus === "saving" && (
                <span className="text-blue-500 animate-pulse">Saving...</span>
              )}
              {saveStatus === "unsaved" && (
                <span className="text-amber-500">Unsaved</span>
              )}
              {saveStatus === "saved" && (
                <span className="text-emerald-500 opacity-50">Saved</span>
              )}
            </div>
          </div>

          {/* Modals attached to standard mode */}
          <LinkModal
            editor={editor}
            isOpen={isLinkModalOpen}
            onClose={() => setIsLinkModalOpen(false)}
            initialText={linkModalData.text}
            initialUrl={linkModalData.url}
          />
          <YoutubeModal
            editor={editor}
            isOpen={isYoutubeModalOpen}
            onClose={() => setIsYoutubeModalOpen(false)}
          />
          <StatsModal
            editor={editor}
            isOpen={isStatsModalOpen}
            onClose={() => setIsStatsModalOpen(false)}
          />
          <SearchReplace editor={editor} />
        </div>
      </div>
    );
  },
);

Editor.displayName = "Editor";
