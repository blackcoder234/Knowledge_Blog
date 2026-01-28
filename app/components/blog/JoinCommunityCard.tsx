"use client";

import { useToast } from "@/app/context/ToastContext";
import { PenTool } from "lucide-react";

export function JoinCommunityCard() {
  const { showToast } = useToast();

  const handleClick = () => {
    showToast("Community writing program coming soon!", "info");
  };

  return (
    <div
      className="relative group overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors p-1 cursor-pointer"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 group-hover:opacity-100 opacity-50 transition-opacity" />

      <div className="relative flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
            <PenTool
              size={16}
              className="text-white/80 group-hover:text-white transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-white leading-none mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all">
              Write for us
            </h4>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase group-hover:text-zinc-400">
              Join 500+ Authors
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
          <span className="-ml-0.5 mt-0.5 text-lg leading-none">↗</span>
        </div>
      </div>
    </div>
  );
}
