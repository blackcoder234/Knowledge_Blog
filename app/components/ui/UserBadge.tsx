"use client";

import { Shield, PenTool, BookOpen, Crown } from "lucide-react";

interface UserBadgeProps {
  role?: string; // "super_admin" | "admin" | "editor" | "user" | undefined
  className?: string; // Allow external styling overrides
  showLabel?: boolean; // Option to hide text and show only icon
}

export const UserBadge = ({
  role = "user",
  className = "",
  showLabel = true,
}: UserBadgeProps) => {
  // Config map for each role
  const badgeConfig = {
    super_admin: {
      icon: Crown,
      label: "Super Admin",
      styles: "bg-red-500/10 text-red-500 border-red-500/20 ring-red-500/20",
    },
    admin: {
      icon: Shield,
      label: "Administrator",
      styles:
        "bg-amber-500/10 text-amber-500 border-amber-500/20 ring-amber-500/20",
    },
    editor: {
      icon: PenTool, // Keeping PenTool or switching to Feather? User asked for "Golden Pen". PenTool is closer to a pen.
      label: "Author",
      styles:
        "bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 text-amber-400 border-amber-500/30 ring-amber-500/20 shadow-[0_0_10px_-4px_rgba(251,191,36,0.3)] relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-200%] after:animate-[shimmer_3s_infinite]",
    },
    user: {
      icon: BookOpen,
      label: "Member",
      styles:
        "bg-zinc-800/80 text-zinc-300 border border-white/5 ring-1 ring-white/10 shadow-sm relative overflow-hidden group hover:bg-zinc-800 transition-colors",
    },
  };

  // Safe fallback if role is unknown
  const config =
    badgeConfig[role as keyof typeof badgeConfig] || badgeConfig.user;
  const Icon = config.icon;

  return (
    <span
      className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
      border ring-1 ring-inset text-[10px] uppercase font-bold tracking-wider 
      ${config.styles} 
      ${className}
    `}
    >
      <Icon size={12} strokeWidth={2.5} />
      {showLabel && config.label}
    </span>
  );
};
