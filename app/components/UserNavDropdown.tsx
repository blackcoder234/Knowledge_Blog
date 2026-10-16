"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Crown,
  Shield,
  PenTool,
  BookOpen,
  User,
  LayoutDashboard,
  PlusCircle,
  Bookmark,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";

interface UserNavDropdownProps {
  session: any;
  userImage?: string | null;
}

export const UserNavDropdown = ({ session, userImage }: UserNavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!session?.user) return null;

  const user = session.user;
  const role = (user as any).role || "user";
  const userId = (user as any).id;
  const userName = user.name || "User";
  const userEmail = user.email || "";

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";
  const isSuperOrAdmin = isSuperAdmin || isAdmin;
  const isWriter = role === "editor";
  const canWrite = isSuperOrAdmin || isWriter;

  // Role Icon on trigger button
  const renderTriggerRoleIcon = () => {
    if (isSuperAdmin) {
      return (
        <span title="Super Admin" className="inline-flex items-center flex-shrink-0">
          <Crown
            size={15}
            className="text-amber-400 fill-amber-400/20"
          />
        </span>
      );
    }
    if (isAdmin) {
      return (
        <span title="Administrator" className="inline-flex items-center flex-shrink-0">
          <Shield
            size={14}
            className="text-amber-400"
          />
        </span>
      );
    }
    if (isWriter) {
      return (
        <span title="Author" className="inline-flex items-center flex-shrink-0">
          <PenTool
            size={13}
            className="text-amber-400"
          />
        </span>
      );
    }
    return null;
  };

  // Role Badge inside dropdown header
  const renderRoleBadge = () => {
    if (isSuperAdmin) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
          <Crown size={10} />
          Super Admin
        </span>
      );
    }
    if (isAdmin) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <Shield size={10} />
          Admin
        </span>
      );
    }
    if (isWriter) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
          <PenTool size={10} />
          Writer
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-white/10 flex items-center gap-1">
        <BookOpen size={10} />
        Member
      </span>
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full transition-all duration-200 cursor-pointer group border ${
          isOpen
            ? "bg-white/10 border-white/20 shadow-lg"
            : "hover:bg-white/5 border-transparent hover:border-white/10"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/15 overflow-hidden flex-shrink-0 relative">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-white font-bold uppercase bg-gradient-to-br from-zinc-700 to-zinc-900">
              {userName.charAt(0)}
            </div>
          )}
        </div>

        {/* Name & Crown / Role Icon */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white max-w-[130px] lg:max-w-[160px] truncate leading-none">
            {userName}
          </span>
          {renderTriggerRoleIcon()}
        </div>

        {/* Chevron */}
        <ChevronDown
          size={14}
          className={`text-zinc-400 group-hover:text-white transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-[#0d0d10]/95 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85)] p-2 z-50 flex flex-col ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
        >
          {/* Header section with Signed in email */}
          <div className="px-3 py-2.5 bg-white/[0.03] rounded-xl mb-1 border border-white/5">
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Signed in as
              </span>
              {renderRoleBadge()}
            </div>
            <p
              className="text-xs font-semibold text-white truncate"
              title={userEmail}
            >
              {userEmail}
            </p>
          </div>

          <div className="h-px bg-zinc-800/80 my-1 mx-1" />

          {/* Links Section */}
          <div className="flex flex-col gap-0.5">
            {/* Admin Dashboard */}
            {isSuperOrAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
                role="menuitem"
              >
                <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <LayoutDashboard size={14} />
                </div>
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* Writers Hub */}
            {canWrite && (
              <Link
                href="/admin/posts"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
                role="menuitem"
              >
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <PenTool size={14} />
                </div>
                <span>Writers Hub</span>
              </Link>
            )}

            {/* Create New Post (For Authors & Admins) */}
            {canWrite && (
              <Link
                href="/admin/posts/create"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
                role="menuitem"
              >
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <PlusCircle size={14} />
                </div>
                <span>Create New Post</span>
              </Link>
            )}

            {/* View Profile (Everyone) */}
            <Link
              href={userId ? `/profile/${userId}` : "/profile"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
              role="menuitem"
            >
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <User size={14} />
              </div>
              <span>View Profile</span>
            </Link>

            {/* My Bookmarks (Everyone) */}
            <Link
              href={userId ? `/profile/${userId}?tab=bookmarks` : "/profile"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
              role="menuitem"
            >
              <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Bookmark size={14} />
              </div>
              <span>My Bookmarks</span>
            </Link>

            {/* Settings (For Readers / Normal Users) */}
            {!canWrite && (
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group"
                role="menuitem"
              >
                <div className="p-1 rounded-lg bg-zinc-700/30 text-zinc-400 group-hover:bg-zinc-700/50 transition-colors">
                  <Settings size={14} />
                </div>
                <span>Account Settings</span>
              </Link>
            )}
          </div>

          <div className="h-px bg-zinc-800/80 my-1 mx-1" />

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group cursor-pointer text-left"
            role="menuitem"
          >
            <div className="p-1 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
              <LogOut
                size={14}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
