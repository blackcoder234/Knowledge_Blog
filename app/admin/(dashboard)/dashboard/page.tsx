"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Monitor,
  Globe,
  Smartphone,
  Activity,
  ArrowUpRight,
  Clock,
  Target,
  Server,
  Share2,
  LayoutDashboard,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Update Interface
interface Stats {
  totalVisitors: number;
  activeUsers: number;
  registeredUsers: number;
  subscribers: number;
  deviceStats: { _id: string; count: number }[];
  browserStats: { _id: string; count: number }[];
  osStats: { _id: string; count: number }[];
  countryStats: { _id: string; count: number }[];
  referrerStats: { _id: string; count: number }[];
  recentVisits: any[];
  topPosts: any[];
  uptime: number;
  dbStatus: boolean;
  unreadMessages: number;
  maintenanceMode: boolean; // New
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if ((session?.user as any)?.role === "editor") {
      router.replace("/admin/posts");
    }
  }, [session, status, router]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latency, setLatency] = useState<number>(0);

  const fetchStats = useCallback(async () => {
    try {
      const start = performance.now();

      // Parallel fetch stats and settings
      const [resStats, resSettings] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/settings"),
      ]);

      const end = performance.now();
      setLatency(Math.round(end - start));

      if (resStats.ok) {
        const data = await resStats.json();
        const settingsData = resSettings.ok ? await resSettings.json() : {};

        const safeData: Stats = {
          totalVisitors: data.metrics?.visitors || data.totalVisitors || 0,
          activeUsers: data.activeUsers || 0,
          registeredUsers: data.metrics?.users || 0,
          subscribers: data.metrics?.subscribers || 0,
          deviceStats: data.deviceStats || [],
          browserStats: data.browserStats || [],
          osStats: data.osStats || [],
          countryStats: data.countryStats || [],
          referrerStats: data.referrerStats || [],
          recentVisits: data.recentVisits || [],
          topPosts: data.topPosts || [],
          uptime: data.uptime || 0,
          dbStatus: data.dbStatus !== false,
          unreadMessages: data.unreadMessages || 0,
          maintenanceMode: !!settingsData.maintenance_mode, // New
        };
        setStats(safeData);
      }
    } catch (e) {
      console.error("Failed to load stats", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <div className="p-6 w-full space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            Network Overwatch
            {stats?.maintenanceMode && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-black tracking-widest uppercase animate-pulse">
                Maintenance Mode
              </span>
            )}
          </h1>
          <p className="text-zinc-500 flex items-center gap-2 text-sm">
            {stats?.maintenanceMode ? (
              <>
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                <span className="text-yellow-500 font-bold">
                  Public Site Offline • Development In Progress
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time Traffic Monitoring Active
              </>
            )}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* ... buttons ... */}
          <button
            onClick={handleRefresh}
            className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95 group"
            title="Refresh Data"
          >
            <RefreshCw
              size={16}
              className={`group-hover:rotate-180 transition-transform duration-500 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-xs text-zinc-400 hidden md:block">
            LATENCY:{" "}
            <span
              className={latency < 200 ? "text-green-400" : "text-yellow-400"}
            >
              {latency}ms
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-xs text-zinc-400 hidden md:block">
            DB:{" "}
            <span
              className={stats?.dbStatus ? "text-green-400" : "text-red-400"}
            >
              {stats?.dbStatus ? "CONNECTED" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Leads"
          value={stats?.totalVisitors}
          icon={Activity}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
          borderColor="border-cyan-500/20"
        />
        <StatsCard
          label="Registered Users"
          value={stats?.registeredUsers}
          icon={Users}
          color="text-indigo-400"
          bg="bg-indigo-500/10"
          borderColor="border-indigo-500/20"
        />
        <StatsCard
          label="Subscribers"
          value={stats?.subscribers}
          icon={Share2}
          color="text-pink-400"
          bg="bg-pink-500/10"
          borderColor="border-pink-500/20"
        />
        <StatsCard
          label="Live Users"
          value={stats?.activeUsers}
          icon={Zap}
          color="text-yellow-400"
          bg="bg-yellow-500/10"
          borderColor="border-yellow-500/20"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BreakdownCard
          title="Top Countries"
          icon={Globe}
          data={stats?.countryStats}
        />
        <BreakdownCard
          title="Traffic Sources"
          icon={Share2}
          data={stats?.referrerStats}
        />
        <BreakdownCard
          title="Device Distribution"
          icon={Monitor}
          data={stats?.deviceStats}
        />
        <BreakdownCard
          title="Top Content"
          icon={Globe}
          data={
            stats?.topPosts?.map((p: any) => ({
              _id: p.title,
              count: p.views,
            })) || []
          }
        />
      </div>

      {/* Recent Live Traffic */}
      <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h3 className="font-bold text-zinc-200 flex items-center gap-2 text-sm">
            <Target size={16} className="text-cyan-400" />
            Live Traffic Feed
          </h3>
          <div className="text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded">
            LAST 10 HITS
          </div>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Device Info</th>
                <th className="px-6 py-3 font-medium">Path</th>
                <th className="px-6 py-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {stats?.recentVisits?.map((visit: any, i: number) => (
                <tr
                  key={i}
                  className="hover:bg-zinc-900/30 transition-colors group"
                >
                  <td className="px-6 py-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>
                    <span className="text-zinc-300">
                      {visit.city !== "Unknown" ? `${visit.city}, ` : ""}
                      {visit.country}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-zinc-400 text-xs">
                    {visit.os} • {visit.browser}
                  </td>
                  <td className="px-6 py-3 text-zinc-500 font-mono text-xs">
                    {visit.path}
                  </td>
                  <td className="px-6 py-3 text-right text-zinc-600 text-xs font-mono">
                    {new Date(visit.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats?.recentVisits?.length === 0 && (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No recent traffic recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color, bg, borderColor }: any) {
  return (
    <div
      className={`p-6 rounded-xl border ${borderColor} ${bg} backdrop-blur-md relative overflow-hidden group`}
    >
      <div
        className={`absolute top-4 right-4 p-2 rounded-lg bg-black/20 ${color}`}
      >
        <Icon size={20} />
      </div>
      <div className="relative z-10">
        <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
          {label}
        </p>
        <h3 className="text-3xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
          {value}
        </h3>
      </div>
      {/* Glow effect */}
      <div
        className={`absolute -bottom-4 -right-4 w-24 h-24 ${color.replace("text-", "bg-")} blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`}
      ></div>
    </div>
  );
}

function BreakdownCard({ title, icon: Icon, data }: any) {
  // Safety check if data is undefined
  if (!data) return null;

  // Sort items by count descending
  const sortedData = [...data].sort((a: any, b: any) => b.count - a.count);
  const maxVal = Math.max(...sortedData.map((d: any) => d.count), 1);
  const total = sortedData.reduce((a: any, b: any) => a + (b.count || 0), 0);

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm p-4 h-full">
      <h3 className="text-zinc-300 font-bold text-sm mb-4 flex items-center gap-2">
        <Icon size={14} className="text-cyan-400" />
        <span>
          {title} <span className="text-zinc-500 ml-1">({total})</span>
        </span>
      </h3>
      <div className="space-y-3">
        {sortedData.slice(0, 5).map((item: any) => (
          <div key={item._id} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400">
                {item._id} <span className="text-zinc-500">({item.count})</span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-700 group-hover:bg-cyan-500 transition-colors rounded-full"
                style={{ width: `${(item.count / maxVal) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
        {sortedData.length === 0 && (
          <p className="text-zinc-600 text-xs italic">No data collected yet</p>
        )}
      </div>
    </div>
  );
}
