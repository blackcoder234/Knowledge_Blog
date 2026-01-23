"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  Database,
  Eye,
  FileText,
  Globe,
  HardDrive,
  LayoutDashboard,
  MessageSquare,
  Users,
  Zap,
  Radio,
} from "lucide-react";
import { motion } from "framer-motion";

export default function NewDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [vercelStatus, setVercelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const start = performance.now();
      try {
        // Parallel fetch: internal stats + Vercel status
        const [res, vercelRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("https://www.vercel-status.com/api/v2/status.json"),
        ]);

        const end = performance.now();
        setLatency(Math.round(end - start));

        if (res.ok) {
          const json = await res.json();
          setData(json);
        }

        if (vercelRes.ok) {
          const vJson = await vercelRes.json();
          setVercelStatus(vJson.status?.description || "Unknown");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Live Uptime Ticker
  const [clientUptime, setClientUptime] = useState<number>(0);

  useEffect(() => {
    if (data?.uptime) {
      setClientUptime(data.uptime);
      const interval = setInterval(() => {
        setClientUptime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [data?.uptime]);

  // Format chart data for sparklines
  const sparklineData = useMemo(() => {
    if (!data?.charts?.visitors) return [];
    return data.charts.visitors.map((d: any) => ({
      date: new Date(d.date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      }),
      value: d.visitors,
    }));
  }, [data]);

  // Format top posts for bar chart
  const topPostsData = useMemo(() => {
    if (!data?.topPosts) return [];
    return data.topPosts.slice(0, 5).map((p: any) => ({
      name: p.title.substring(0, 15) + "...",
      views: p.views,
    }));
  }, [data]);

  // Calculate visitor trend (Last 3 days vs First 3 days of the week)
  const visitorTrend = useMemo(() => {
    if (!data?.charts?.visitors || data.charts.visitors.length < 4) return 0;
    const visits = data.charts.visitors.map((d: any) => d.visitors);
    const last3 = visits.slice(-3).reduce((a: number, b: number) => a + b, 0);
    const first3 = visits
      .slice(0, 3)
      .reduce((a: number, b: number) => a + b, 0);

    if (first3 === 0) return last3 > 0 ? 100 : 0;
    return Math.round(((last3 - first3) / first3) * 100);
  }, [data]);

  // Determine most viewed section
  const mostViewedSection = useMemo(() => {
    if (!data?.recentVisits || data.recentVisits.length === 0) return "Content";
    const paths = data.recentVisits.map((v: any) => v.path);
    const blogCount = paths.filter((p: string) => p.includes("/blog/")).length;
    if (blogCount >= paths.length / 2) return "Blog Posts";
    return "Main Site";
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm font-mono animate-pulse">
            Initializing Command Center...
          </p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(" ");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 lg:p-10 font-sans selection:bg-yellow-500/30">
      {/* Top Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm flex items-center gap-2">
            <Clock size={14} />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
            Overview of your platform's performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
              data?.maintenanceMode
                ? "bg-amber-900/20 border-amber-500/20 text-amber-500"
                : "bg-emerald-900/20 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data?.maintenanceMode ? "bg-amber-500" : "bg-emerald-400"}`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${data?.maintenanceMode ? "bg-amber-500" : "bg-emerald-500"}`}
              ></span>
            </span>
            {data?.maintenanceMode ? "Maintenance Mode" : "System Live"}
          </div>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <BarChart3 size={16} className="fill-current" />
            View Reports
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* --- LEFT COL (Main Stats) --- */}
        <div className="md:col-span-8 space-y-6">
          {/* Hero Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Visual Card 1: Visitors */}
            <div className="col-span-2 relative overflow-hidden bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl group">
              {/* BGD Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-yellow-500/20 transition-all duration-1000"></div>

              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-zinc-500 font-medium text-xs uppercase tracking-wider mb-1">
                    Total Unique Visitors
                  </p>
                  <h3 className="text-4xl font-bold text-white tracking-tight">
                    {data?.totalVisitors?.toLocaleString()}
                  </h3>
                  <div
                    className={`flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded w-fit ${visitorTrend >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}
                  >
                    <ArrowUpRight
                      size={12}
                      className={visitorTrend < 0 ? "rotate-180" : ""}
                    />
                    {visitorTrend > 0 ? "+" : ""}
                    {visitorTrend}%{" "}
                    <span className="text-zinc-500 ml-1">7d trend</span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
                  <Users size={24} />
                </div>
              </div>

              {/* Sparkline Area */}
              <div className="h-24 w-full -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient
                        id="colorSpark"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#eab308"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#eab308"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#e4e4e7" }}
                      cursor={{ stroke: "#eab308", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#eab308"
                      strokeWidth={2}
                      fill="url(#colorSpark)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stat Card 2: Active Users */}
            <div className="col-span-1 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between group hover:border-zinc-700 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Radio size={20} />
                  </div>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {data?.activeUsers || 0}
                </h3>
                <p className="text-zinc-500 text-sm">Active Users Now</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
                <p className="text-xs text-zinc-400">
                  Most are viewing{" "}
                  <span className="text-zinc-200">{mostViewedSection}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatMiniCard
              label="Total Posts"
              value={data?.metrics?.posts}
              icon={FileText}
              color="text-blue-400"
            />
            <StatMiniCard
              label="Subscribers"
              value={data?.metrics?.subscribers}
              icon={Users}
              color="text-pink-400"
            />
            <StatMiniCard
              label="Comments"
              value={data?.metrics?.comments}
              icon={MessageSquare}
              color="text-orange-400"
            />
            <StatMiniCard
              label="Total Page Views"
              value={data?.metrics?.visitors}
              icon={Eye}
              color="text-teal-400"
            />
          </div>

          {/* Demographics Row (New) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Countries */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Globe size={16} className="text-cyan-400" />
                Top Countries
              </h3>
              <div className="space-y-3">
                {data?.countryStats?.slice(0, 5).map((c: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-300 flex items-center gap-3">
                      <div className="relative w-5 h-3.5 shadow-sm rounded-sm overflow-hidden flex-shrink-0">
                        <img
                          src={`https://flagcdn.com/w40/${c._id.toLowerCase()}.png`}
                          alt={c._id}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="truncate max-w-[120px]">
                        {(c._id && c._id.length === 2
                          ? new Intl.DisplayNames(["en"], {
                              type: "region",
                            }).of(c._id)
                          : c._id) || c._id}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500/50 rounded-full"
                          style={{
                            width: `${(c.count / (data.countryStats[0].count || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-zinc-400 font-mono text-xs w-6 text-right">
                        {c.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audience Distribution (Replaces Device Stats) */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users size={16} className="text-zinc-400" />
                Audience Composition
              </h3>
              <div className="flex items-center justify-between h-40">
                {/* Donut Chart */}
                <div className="h-40 w-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Visitors",
                            value:
                              (data?.totalVisitors || 0) -
                              (data?.metrics?.users || 0),
                          },
                          { name: "Users", value: data?.metrics?.users || 0 },
                          {
                            name: "Subs",
                            value: data?.metrics?.subscribers || 0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#3493f3c2" />
                        <Cell fill="#067d34ff" />
                        <Cell fill="#f93152db" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          borderColor: "#27272a",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "#e4e4e7" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-zinc-500 font-medium">
                      TOTAL
                    </span>
                    <span className="text-lg font-bold text-white">
                      {(data?.totalVisitors || 0) +
                        (data?.metrics?.subscribers || 0) >=
                      1000
                        ? `${(
                            ((data?.totalVisitors || 0) +
                              (data?.metrics?.subscribers || 0)) /
                            1000
                          ).toFixed(1)}k`
                        : (data?.totalVisitors || 0) +
                          (data?.metrics?.subscribers || 0)}
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 ml-6 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span className="text-zinc-400">Visitors</span>
                    </div>
                    <span className="font-mono text-zinc-200">
                      {(data?.totalVisitors || 0) - (data?.metrics?.users || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#067d34ff]"></div>
                      <span className="text-zinc-400">Users</span>
                    </div>
                    <span className="font-mono text-zinc-200">
                      {data?.metrics?.users || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <span className="text-zinc-400">Subscribers</span>
                    </div>
                    <span className="font-mono text-zinc-200">
                      {data?.metrics?.subscribers || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Live Feed Table */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe size={16} className="text-zinc-400" />
                Live Traffic Feed
              </h3>
              <Link
                href="/admin/analytics"
                className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
              >
                View Full Report &rarr;
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-zinc-900/20">
                <thead className="bg-white/5 border-b border-white/5 text-zinc-400 uppercase font-medium">
                  <tr>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Page</th>
                    <th className="px-6 py-3">Device</th>
                    <th className="px-6 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {data?.recentVisits?.slice(0, 5).map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 font-medium text-white">
                        {v.city !== "Unknown" ? v.city : v.country}
                      </td>
                      <td className="px-6 py-3 truncate max-w-[200px] text-zinc-400">
                        {v.path}
                      </td>
                      <td className="px-6 py-3">{v.device || "Desktop"}</td>
                      <td className="px-6 py-3 text-right font-mono text-zinc-500">
                        {new Date(v.lastSeen).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentVisits || data.recentVisits.length === 0) && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-zinc-600 italic"
                      >
                        No recent traffic recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- RIGHT COL (Side Panel) --- */}
        <div className="md:col-span-4 space-y-6">
          {/* Top Posts Widget */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 size={16} className="text-zinc-400" />
              Trending Content
            </h3>
            <div className="space-y-5">
              {data?.topPosts?.map((post: any, i: number) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-start text-sm mb-1">
                    <Link
                      href={`/admin/posts/${post._id}`}
                      className="font-medium text-zinc-300 group-hover:text-yellow-400 transition-colors line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <span className="font-mono text-xs text-zinc-500">
                      {post.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500/50 rounded-full group-hover:bg-yellow-500 transition-colors"
                      style={{
                        width: `${(post.views / (data.topPosts[0].views || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {(!data?.topPosts || data.topPosts.length === 0) && (
                <p className="text-zinc-600 text-xs">No posts available.</p>
              )}
            </div>
            <Link
              href="/admin/posts"
              className="block mt-6 text-center text-xs text-zinc-500 hover:text-white transition-colors border-t border-white/5 pt-4"
            >
              Manage All Posts
            </Link>
          </div>

          {/* System Health Widget */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Database size={16} className="text-zinc-400" />
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${data?.dbStatus ? "bg-emerald-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-sm text-zinc-300">Database</span>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {data?.dbStatus ? "CONNECTED" : "ERROR"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-zinc-300">API Latency</span>
                </div>
                <span
                  className={`text-xs font-mono ${(latency || 0) < 200 ? "text-emerald-500" : "text-amber-500"}`}
                >
                  {latency !== null ? `${latency}ms` : "..."}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${vercelStatus === "All Systems Operational" ? "bg-emerald-500" : "bg-amber-500"}`}
                  ></div>
                  <span className="text-sm text-zinc-300">Vercel Status</span>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {vercelStatus
                    ? vercelStatus === "All Systems Operational"
                      ? "OPERATIONAL"
                      : vercelStatus.toUpperCase()
                    : "CHECKING..."}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest flex justify-between items-center">
                <span>Server Uptime</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  {formatUptime(clientUptime)}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/users"
              className="bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
            >
              <Users size={20} className="text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">Users</span>
            </Link>
            <Link
              href="/admin/settings"
              className="bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
            >
              <LayoutDashboard size={20} className="text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">Theme</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, icon: Icon, color, suffix }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <Icon size={16} className={`${color} opacity-80`} />
      </div>
      <div>
        <h4 className="text-2xl font-bold text-white tracking-tight">
          {value?.toLocaleString() || 0}
          {suffix && (
            <span className="text-xs font-normal text-zinc-500 ml-1 align-baseline">
              {suffix}
            </span>
          )}
        </h4>
        <p className="text-xs text-zinc-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
