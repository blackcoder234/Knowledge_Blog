"use client";

import { useState } from "react";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

interface QuickStatusToggleProps {
  id: string;
  initialStatus: "published" | "draft" | "archived";
}

export const QuickStatusToggle = ({
  id,
  initialStatus,
}: QuickStatusToggleProps) => {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleUpdate = async (
    newStatus: "published" | "draft" | "archived",
  ) => {
    // If it's already in that status, do nothing
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(false);

    // Optimistic Update
    const prevStatus = status;
    setStatus(newStatus);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // We only send the status update
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      showToast(
        `Post ${newStatus === "published" ? "Published" : "Moved to Draft"}`,
        "success",
      );
      router.refresh();
    } catch (error) {
      // Revert
      setStatus(prevStatus);
      showToast("Failed to update status", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group/toggle">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full cursor-pointer transition-all border ${
          status === "published"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
            : status === "archived"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
              : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400 hover:bg-zinc-500/20"
        } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === "published"
              ? "bg-emerald-500"
              : status === "archived"
                ? "bg-rose-500"
                : "bg-zinc-500"
          }`}
        ></span>
        <span className="text-xs font-semibold capitalize tracking-wide select-none">
          {status}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3 h-3 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-full left-0 mt-2 w-32 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => handleUpdate("published")}
              className={`text-left px-3 py-2 text-xs font-medium rounded hover:bg-white/5 flex items-center gap-2 ${
                status === "published" ? "text-emerald-500" : "text-zinc-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Publish
            </button>
            <button
              onClick={() => handleUpdate("draft")}
              className={`text-left px-3 py-2 text-xs font-medium rounded hover:bg-white/5 flex items-center gap-2 ${
                status === "draft" ? "text-zinc-400" : "text-zinc-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              Draft
            </button>
            <button
              onClick={() => handleUpdate("archived")}
              className={`text-left px-3 py-2 text-xs font-medium rounded hover:bg-white/5 flex items-center gap-2 ${
                status === "archived" ? "text-rose-500" : "text-zinc-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Archived
            </button>
          </div>
        </>
      )}
    </div>
  );
};
