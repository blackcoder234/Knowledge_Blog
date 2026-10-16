"use client";

import {
  FileText,
  Minimize2,
  Maximize2,
  BookOpen,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface EditorHeaderProps {
  isEdit: boolean;
  status: string;
  slug?: string;
  isDirty: boolean;
  isZenMode: boolean;
  setIsZenMode: (val: boolean) => void;
  setShowGuide: (val: boolean) => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onValidate: () => boolean;
  isSubmitting: boolean;
  router: any;
  onHistory: () => void;
  showHistory: boolean;
}

export function EditorHeader({
  isEdit,
  status,
  slug,
  isDirty,
  isZenMode,
  setIsZenMode,
  setShowGuide,
  onPreview,
  onSaveDraft,
  onPublish,
  onValidate,
  isSubmitting,
  router,
}: EditorHeaderProps) {
  const handlePublishClick = () => {
    if (onValidate()) {
      onPublish();
    }
  };

  return (
    <div className="sticky top-0 z-[100] bg-[#000000]/95 backdrop-blur-xl border-b border-white/5 -mx-4 lg:-mx-8 -mt-4 lg:-mt-8 px-4 lg:px-8 py-6 mb-8 flex items-center justify-between shadow-2xl shadow-black/50">
      <div className="flex items-center gap-4">
        <div
          onClick={() => router.back()}
          className="cursor-pointer hover:opacity-80"
        >
          <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-500 font-bold">
            <FileText size={20} />
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white font-sans flex items-center gap-3">
            {isEdit ? "Edit Post" : "Create New Post"}
            <span className="h-4 w-px bg-white/10 hidden md:block"></span>
            <div className="flex items-center gap-2 text-xs font-normal">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "published"
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    : status === "archived"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              ></span>
              <span className="capitalize text-zinc-300 font-medium">
                {status === "published"
                  ? "Published"
                  : status === "archived"
                    ? "Archived"
                    : "Draft"}
              </span>
            </div>
          </h1>

          <div className="flex items-center gap-3 text-[11px] mt-1">
            <span
              className={`transition-colors flex items-center gap-1.5 ${isDirty ? "text-yellow-500" : "text-zinc-500"}`}
            >
              <div
                className={`w-1 h-1 rounded-full ${isDirty ? "bg-yellow-500" : "bg-zinc-600"}`}
              ></div>
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsZenMode(!isZenMode)}
          className={`flex items-center gap-2 ${isZenMode ? "text-cyan-400 bg-cyan-950/30" : "text-zinc-400 hover:text-cyan-400"}`}
          title="Toggle Focus Mode"
        >
          {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          <span className="hidden md:inline">
            {isZenMode ? "Exit Focus" : "Focus"}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGuide(true)}
          className="text-zinc-400 hover:text-cyan-400 flex items-center gap-2"
        >
          <BookOpen size={18} />
          <span className="hidden md:inline">Guide</span>
        </Button>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex gap-2"
          onClick={onPreview}
        >
          <Globe size={16} /> Preview
        </Button>

        {status === "published" && slug && (
          <a
            href={`/blog/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-colors"
            title="View live published post"
          >
            <ExternalLink size={14} />
            <span>View Live</span>
          </a>
        )}

        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex gap-2 border-dashed border-zinc-700 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition-all group"
          onClick={() => window.open("/admin/posts/create", "_blank")}
        >
          <FileText
            size={16}
            className="group-hover:scale-110 transition-transform"
          />{" "}
          New Post
        </Button>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        {status !== "published" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            className="text-zinc-300 border-zinc-700 hover:bg-zinc-800"
          >
            Save Draft
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          className="px-6 font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 rounded-lg shadow-md hover:shadow-yellow-500/20 transition-all"
          onClick={handlePublishClick}
          disabled={isSubmitting}
        >
          <span className="flex items-center gap-2">
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>
                  {status === "published" ? "Updating..." : "Publishing..."}
                </span>
              </>
            ) : status === "published" ? (
              "Update Post"
            ) : (
              "Publish Now"
            )}
          </span>
        </Button>
      </div>
    </div>
  );
}
