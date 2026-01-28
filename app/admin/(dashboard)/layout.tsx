"use client";

import { useState } from "react";
import { AdminSidebar } from "../../components/AdminSidebar";
import { AdminAutoRefresher } from "@/app/components/admin/AdminAutoRefresher";

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#000000]">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Auto Refresh Data every 30 seconds */}
      <AdminAutoRefresher interval={30000} />

      <main className="flex-1 lg:ml-64 transition-all duration-300 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 border-b border-white/10 flex items-center px-4 justify-between bg-[#0A0A0A] sticky top-0 z-30">
          <div className="font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-accent text-black rounded flex items-center justify-center font-bold">
              K
            </span>
            <span>Admin Panel</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
