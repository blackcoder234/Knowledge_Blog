"use client";

import { X, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";

interface AnnouncementBarProps {
  message: string;
}

export default function AnnouncementBar({ message }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Optional: Hide if user has already dismissed it in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("announcement-dismissed");
    if (dismissed === message) {
      setIsVisible(false);
    }
  }, [message]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("announcement-dismissed", message);
  };

  if (!isVisible || !message) return null;

  return (
    <div className="relative bg-accent text-black py-4 px-6 shadow-[0_4px_20px_rgba(255,215,0,0.2)] z-[100] border-b border-black/5 overflow-hidden animate-slide-down">
      {/* Subtle Animated Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 pr-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 shrink-0 animate-pulse">
          <Megaphone size={20} className="text-black" />
        </div>
        <p className="text-sm md:text-lg lg:text-xl font-black tracking-widest text-center leading-tight max-w-4xl uppercase italic">
          {message}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-black/10 rounded-full transition-all duration-300 hover:scale-110"
        aria-label="Close Announcement"
      >
        <X size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
