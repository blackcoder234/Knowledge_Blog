"use client";

import { Editor, EditorContent } from "@tiptap/react";
import { useState, useEffect } from "react";
import { Toolbar } from "../components/Toolbar";
import { BubbleMenu } from "../components/BubbleMenu";
import { LinkModal } from "../components/LinkModal";
import { TableMenu } from "../components/TableMenu";
import { YoutubeModal } from "../components/YoutubeModal";
import { TableOfContents } from "../components/TableOfContents";
import { StatsModal } from "../components/StatsModal";
import { SearchReplace } from "../components/SearchReplace";
import { twMerge } from "tailwind-merge";
import { Loader2, CheckCircle2, Columns, Info } from "lucide-react";
import "../editor.css";

interface CMSEditorLayoutProps {
  editor: Editor;
  saveStatus?: "saved" | "saving" | "unsaved";
  onSave?: () => void;
  onToggleZenMode?: () => void;
  lastSaved?: Date;
  title?: string;
  onTitleChange?: (val: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onOpenMediaLibrary?: () => void;
  modals: {
    link: {
      isOpen: boolean;
      onClose: () => void;
      data: { text: string; url: string };
    };
    youtube: {
      isOpen: boolean;
      onClose: () => void;
    };
    stats: {
      isOpen: boolean;
      onClose: () => void;
      onOpen: () => void;
    };
  };
}

export const CMSEditorLayout = ({
  editor,
  saveStatus = "saved",
  onSave,
  onToggleZenMode,
  lastSaved,
  title,
  onTitleChange,
  onImageUpload,
  onOpenMediaLibrary,
  modals,
}: CMSEditorLayoutProps) => {
  const [isFocusMode, setFocusMode] = useState(false);
  const [isWideMode, setWideMode] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<"EN" | "BN">("EN");

  const detectLanguage = (text: string) => {
    const bnRegex = /[\u0980-\u09FF]/;
    return bnRegex.test(text) ? "BN" : "EN";
  };

  useEffect(() => {
    if (!editor) return;

    const handleLanguageUpdate = () => {
      const text = editor.getText();
      const detected = detectLanguage(text);
      setDetectedLanguage(detected);
    };

    editor.on("update", handleLanguageUpdate);
    return () => {
      editor.off("update", handleLanguageUpdate);
    };
  }, [editor]);

  const wordCount = editor.storage.characterCount?.words() || 0;
  const readingTime = Math.ceil(wordCount / 225);

  return (
    <div className="h-full transition-colors duration-500 font-sans selection:bg-blue-500/30 bg-[#050505] text-gray-300">
      <div className="glow-bg" />
      <div
        className={twMerge(
          "flex flex-col h-full transition-all duration-500",
          isFocusMode ? "scale-100" : "",
        )}
      >
        <Toolbar
          editor={editor}
          isFocusMode={isFocusMode}
          toggleFocusMode={() => setFocusMode(!isFocusMode)}
          onSave={onSave}
          saveStatus={saveStatus}
          onExitZenMode={onToggleZenMode}
          onImageUpload={onImageUpload}
          onOpenMediaLibrary={onOpenMediaLibrary}
        />

        <main className="flex-1 w-full flex justify-center p-4 md:p-8 pb-32 overflow-y-auto">
          <div
            className={twMerge(
              "relative w-full transition-all duration-500 ease-in-out",
              isWideMode ? "max-w-6xl" : "max-w-3xl",
              isFocusMode && "py-20",
            )}
          >
            <div className="glass-panel min-h-[85vh] rounded-2xl p-8 md:p-16 relative shadow-2xl bg-black/40">
              <BubbleMenu editor={editor} />
              <TableMenu editor={editor} />

              <LinkModal
                editor={editor}
                isOpen={modals.link.isOpen}
                onClose={modals.link.onClose}
                initialText={modals.link.data.text}
                initialUrl={modals.link.data.url}
              />

              <YoutubeModal
                editor={editor}
                isOpen={modals.youtube.isOpen}
                onClose={modals.youtube.onClose}
              />

              <StatsModal
                editor={editor}
                isOpen={modals.stats.isOpen}
                onClose={modals.stats.onClose}
              />

              <SearchReplace editor={editor} />

              <div className="prose prose-invert prose-lg max-w-none">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </main>

        {!isFocusMode && <TableOfContents editor={editor} />}

        {!isFocusMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-white/5 h-9 px-4 flex items-center justify-between text-xs text-gray-500 z-50">
            <div className="flex items-center gap-5">
              <button
                onClick={modals.stats.onOpen}
                className="hover:text-gray-300 transition-colors flex items-center gap-2 hover:bg-white/5 rounded px-2 py-1"
                title="View Details"
              >
                <span className="font-medium text-gray-400">
                  {wordCount} words
                </span>
                <span className="text-gray-700">/</span>
                <span className="font-medium text-gray-400">
                  {readingTime} min read
                </span>
              </button>

              <div className="w-px h-3 bg-white/5" />

              <div className="flex items-center gap-2 min-w-[80px]">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1.5 text-blue-400/80">
                    <Loader2 size={11} className="animate-spin" />
                    <span className="uppercase tracking-widest text-[9px] font-bold">
                      Saving
                    </span>
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span
                    className="flex items-center gap-1.5 text-emerald-400/40"
                    title={`Saved at ${lastSaved?.toLocaleTimeString()}`}
                  >
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    <span className="uppercase tracking-widest text-[9px] font-bold">
                      Saved
                    </span>
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="flex items-center gap-1.5 text-amber-500/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="uppercase tracking-widest text-[9px] font-bold">
                      Unsaved
                    </span>
                  </span>
                )}
              </div>

              <div className="w-px h-3 bg-white/5" />

              <div className="text-gray-600 text-[11px] px-2 py-1 select-none cursor-default">
                {detectedLanguage === "BN" ? "Bengali(IN)" : "English(US)"}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setWideMode(!isWideMode)}
                className={twMerge(
                  "p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all",
                  isWideMode && "text-blue-400 bg-blue-500/10",
                )}
                title={isWideMode ? "Standard Width" : "Wide Mode"}
              >
                <Columns size={18} />
              </button>

              <div className="w-px h-3 bg-white/10 hidden md:block" />

              <div className="w-px h-3 bg-white/10 hidden md:block" />

              <div className="text-[12px] text-gray-600 font-mono hidden md:block select-none">
                Powered by KnowledgeLog
              </div>

              <div className="w-px h-3 bg-white/10 hidden md:block" />

              <div className="text-[10px] text-gray-600 font-mono hidden md:flex items-center gap-2 select-none">
                <span className="text-blue-400/70">💡 Tip:</span>
                <span>
                  Use{" "}
                  <a
                    href="https://www.google.com/inputtools/chrome/"
                    target="_blank"
                    className="hover:text-blue-400 underline decoration-blue-500/30"
                  >
                    Google Input Tools
                  </a>{" "}
                  for Bengali
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
