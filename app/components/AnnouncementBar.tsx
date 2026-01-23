"use client";

import { X } from "lucide-react";
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
    <div className="relative bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black py-2.5 px-4 shadow-lg z-[100] animate-slide-down">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 pr-8">
        <span className="text-lg">📢</span>
        <p className="text-sm md:text-md font-bold tracking-tight text-center leading-tight">
          {message}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors"
        aria-label="Close Announcement"
      >
        <X size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
