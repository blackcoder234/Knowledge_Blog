"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Power, Save, Hammer } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import GlobalLoading from "@/app/loading";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    const role = (session?.user as any)?.role;
    if (role !== "admin" && role !== "super_admin") {
      router.replace("/admin/dashboard");
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(!!data.maintenance_mode);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    setUpdating(true);
    const newValue = !maintenanceMode;

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "maintenance_mode",
          value: newValue,
        }),
      });

      if (res.ok) {
        setMaintenanceMode(newValue);
        showToast(
          newValue ? "Maintenance Mode ENABLED" : "Maintenance Mode DISABLED",
          "success",
        );
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      showToast("Failed to update settings", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <GlobalLoading />;
  }

  return (
    <div className="p-6 w-full space-y-8 animate-fade-in font-sans min-h-screen max-w-4xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-zinc-800 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Hammer className="text-zinc-500" />
          System Settings
        </h1>
        <p className="text-zinc-400 text-sm">
          Manage global application configuration.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Maintenance Mode Card */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-300 ${maintenanceMode ? "bg-yellow-500/10 border-yellow-500/30" : "bg-zinc-900/40 border-zinc-800"}`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3
                className={`text-xl font-bold flex items-center gap-2 ${maintenanceMode ? "text-yellow-400" : "text-white"}`}
              >
                <AlertTriangle size={24} />
                Maintenance Mode
              </h3>
              <p className="text-zinc-400 text-sm max-w-lg">
                When enabled, the public website renders a "Under Construction"
                page. Admin routes (`/admin`) remain accessible to staff.
              </p>
            </div>

            <button
              onClick={toggleMaintenance}
              disabled={updating}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                maintenanceMode
                  ? "bg-yellow-500 hover:bg-yellow-400 focus:ring-yellow-500"
                  : "bg-zinc-700 hover:bg-zinc-600 focus:ring-cyan-500"
              }`}
            >
              <span
                className={`${
                  maintenanceMode ? "translate-x-7" : "translate-x-1"
                } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          {maintenanceMode && (
            <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-200 text-sm flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              Site is currently in OFF-LINE mode. Public users cannot access
              content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
