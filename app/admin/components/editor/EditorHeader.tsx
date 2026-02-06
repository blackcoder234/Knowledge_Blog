"use client";

import {
  FileText,
  Minimize2,
  Maximize2,
  BookOpen,
  Globe,
  Calendar,
  Clock,
  X,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { useState, useRef, useEffect } from "react";

interface EditorHeaderProps {
  isEdit: boolean;
  status: string;
  isDirty: boolean;
  isZenMode: boolean;
  setIsZenMode: (val: boolean) => void;
  setShowGuide: (val: boolean) => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onScheduleConfirm: (date: string) => void;
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
  isDirty,
  isZenMode,
  setIsZenMode,
  setShowGuide,
  onPreview,
  onSaveDraft,
  onScheduleConfirm,
  onPublish,
  onValidate,
  isSubmitting,
  router,
}: EditorHeaderProps) {
  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  // Helper to format date for datetime-local input (Local Time: YYYY-MM-DDTHH:mm)
  const toLocalISOString = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [dateStr, setDateStr] = useState(() => {
    // Default to Current Time + 15 Minutes
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return toLocalISOString(d);
  });

  const handleScheduleClick = () => {
    if (!showSchedulePopover) {
      if (!onValidate()) return;
    }
    setShowSchedulePopover(!showSchedulePopover);
  };

  const handlePublishClick = () => {
    if (status === "scheduled") {
      setShowConflictConfirm(true);
    } else {
      if (onValidate()) onPublish();
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
                    ? "bg-green-500"
                    : status === "archived"
                      ? "bg-red-500"
                      : status === "scheduled"
                        ? "bg-amber-500"
                        : "bg-yellow-500"
                }`}
              ></span>
              <span className="capitalize text-zinc-300">
                {status === "scheduled" ? "Scheduled" : `${status} Mode`}
              </span>
            </div>
          </h1>

          <div className="flex items-center gap-3 text-[11px] mt-1">
            {status === "scheduled" && dateStr && (
              <span className="text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                <Calendar size={10} />
                {new Date(dateStr).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
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

        <Button
          variant="outline"
          size="sm"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="text-zinc-300 border-zinc-700 hover:bg-zinc-800"
        >
          Save Draft
        </Button>

        <div className="relative">
          <div className="flex items-center -space-x-px">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScheduleClick}
              disabled={isSubmitting}
              className={`rounded-r-none border border-white/10 px-3 z-0 hover:z-10 relative
                ${
                  showSchedulePopover
                    ? "bg-cyan-950/50 text-cyan-400 border-cyan-500/30"
                    : "bg-black/40 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-950/20"
                }`}
              title="Schedule Post"
            >
              <CalendarClock size={18} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-l-none px-6 font-bold text-black border-l border-white/10 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 z-0 hover:z-10"
              onClick={handlePublishClick}
              disabled={isSubmitting}
            >
              <span className="flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>...</span>
                  </>
                ) : status === "scheduled" ? (
                  "Update Schedule"
                ) : (
                  "Publish Now"
                )}
              </span>
            </Button>
          </div>

          {showSchedulePopover && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-[#121212] border border-white/10 rounded-xl p-0 shadow-2xl shadow-black/50 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="bg-zinc-900/50 p-3 border-b border-white/5 flex justify-between items-center rounded-t-xl">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-yellow-500" /> Schedule
                </span>
                <button
                  onClick={() => setShowSchedulePopover(false)}
                  className="text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-medium">
                    Publication Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    step="300"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 [color-scheme:dark]"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onScheduleConfirm(dateStr);
                    setShowSchedulePopover(false);
                  }}
                  disabled={isSubmitting || !dateStr}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                >
                  Confirm Schedule
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConflictConfirm}
        onClose={() => setShowConflictConfirm(false)}
        onConfirm={() => {
          onPublish();
          setShowConflictConfirm(false);
        }}
        title="Publish immediately?"
        description="This post is currently scheduled to be published later. Publishing it now will cancel the schedule and make it live immediately. Are you sure?"
        variant="warning"
        confirmText="Publish Now"
        cancelText="Keep Scheduled"
      />
    </div>
  );
}
