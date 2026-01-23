"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import {
  Calendar,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  MousePointer2,
  Eye,
  Globe2,
  Smartphone,
  Info,
  Users,
  MessageSquare,
  Heart,
  Activity,
  UserPlus,
  TrendingUp,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";

// --- Types ---
interface AnalyticsData {
  history: { _id: string; count: number }[]; // Visitors
  historyViews: { _id: string; count: number }[]; // Views
  historySignups: { _id: string; count: number }[]; // Signups
  historyComments: { _id: string; count: number }[]; // Comments
  pages: { _id: string; count: number }[];
  referrers: { _id: string; count: number }[];
  devices: { _id: string; count: number }[];
  os: { _id: string; count: number }[];
  countries: { _id: string; count: number }[];
  stats: {
    total: number; // Unique Visitors (Range)
    new: number;
    returning: number;
    bounceRate: number;
    live: number;
    avgDuration: number;
    totalUsers: number;
    totalComments: number;
    totalLikes: number;
    totalSubscribers: number;
    totalVisitorsAllTime: number; // Total Visitor DB Count
    conversionRate: string; // "2.50"
  };
}

const COLORS = [
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#e11d48",
  "#14b8a6",
];

const AUDIENCE_COLORS = ["#3f3f46", "#6366f1", "#ec4899"]; // Visitors (Dark Grey), Users (Indigo), Subs (Pink)

export default function InsightsPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"traffic" | "users" | "content">(
    "traffic",
  );

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  // --- Process Chart Data ---
  const chartData = useMemo(() => {
    if (!data) return [];

    const map = new Map();

    const process = (arr: any[], key: string) => {
      if (!arr) return;
      arr.forEach((d) => {
        if (!map.has(d._id))
          map.set(d._id, {
            date: d._id,
            visitors: 0,
            views: 0,
            signups: 0,
            comments: 0,
          });
        map.get(d._id)[key] = d.count;
      });
    };

    process(data.history, "visitors");
    process(data.historyViews, "views");
    process(data.historySignups, "signups");
    process(data.historyComments, "comments");

    const result = Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return result.map((item) => {
      // Ensure date is treated as UTC to prevent timezone shifts if needed
      // MongoDB returns partial ISO strings which Date() might treat as local or UTC depending on browser
      // Appending 'Z' ensures UTC interpretation
      const dateStr =
        item.date.includes("T") && !item.date.endsWith("Z")
          ? `${item.date}:00Z`
          : item.date;
      const dateObj = new Date(dateStr);

      let displayDate = "";
      if (range === "24h") {
        displayDate = dateObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        });
      } else if (range === "6m" || range === "1y") {
        displayDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      } else {
        displayDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      return {
        ...item,
        displayDate,
      };
    });
  }, [data, range]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8 font-sans space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Audience Insights
            <span className="text-xs font-mono font-normal bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">
              PRO
            </span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Deep dive into your traffic sources, content performance, and
            community growth.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Tabs */}
          <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-lg p-1 hidden md:flex">
            {[
              { id: "traffic", label: "Traffic", icon: Activity },
              { id: "users", label: "Growth", icon: Users },
              { id: "content", label: "Engagement", icon: Heart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-lg p-1">
            {["24h", "7d", "30d", "6m"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  range === r
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* --- TRAFFIC TAB --- */}
          {activeTab === "traffic" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  label="Unique Visitors"
                  value={data?.stats.total}
                  icon={MousePointer2}
                  color="text-cyan-400"
                />
                <KPICard
                  label="Total Page Views"
                  value={chartData.reduce((acc, curr) => acc + curr.views, 0)}
                  icon={Eye}
                  color="text-violet-400"
                />
                <KPICard
                  label="Avg. Session"
                  value={`${data?.stats.avgDuration}s`}
                  icon={Calendar}
                  color="text-emerald-400"
                />
                <KPICard
                  label="Live Users"
                  value={data?.stats.live}
                  icon={Activity}
                  color="text-red-400"
                  animate
                />
              </div>

              {/* Main Chart */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>{" "}
                  Visitors
                  <span className="w-2 h-2 rounded-full bg-violet-500/50 ml-2"></span>{" "}
                  Page Views
                </h3>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="colorVisitors"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#06b6d4"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#06b6d4"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorViews"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272a"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          value >= 1000
                            ? `${(value / 1000).toFixed(1)}k`
                            : value
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          borderColor: "#27272a",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorViews)"
                        activeDot={{ r: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVisitors)"
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sources */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-zinc-300 mb-4">
                    Traffic Sources
                  </h3>
                  <div className="space-y-4">
                    {data?.referrers.slice(0, 6).map((ref, i) => (
                      <div
                        key={i}
                        className="group flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Globe2 size={14} className="text-emerald-500/50" />
                          <span className="text-zinc-300 truncate">
                            {ref._id || "Direct / Unknown"}
                          </span>
                        </div>
                        <span className="text-zinc-400 font-mono">
                          {ref.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Devices & OS */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Devices */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm col-span-2 md:col-span-1">
                    <h3 className="text-sm font-bold text-zinc-300 mb-4">
                      Device Breakdown
                    </h3>
                    <div className="h-[200px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.devices.map((d) => ({
                              name: d._id,
                              value: d.count,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {data?.devices.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke="rgba(0,0,0,0.5)"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              borderColor: "#27272a",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: any) => [value, "Users"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Absolute Center Count for Top Device */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white mb-0 leading-none">
                          {data?.devices[0]?.count || 0}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                          {data?.devices[0]?._id || "Total"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-500 mt-2">
                      {data?.devices.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          ></div>
                          <span className="text-zinc-300">{d._id}</span>
                          <span className="font-mono text-zinc-500">
                            ({d.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OS */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm col-span-2 md:col-span-1">
                    <h3 className="text-sm font-bold text-zinc-300 mb-4">
                      OS Breakdown
                    </h3>
                    <div className="h-[200px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.os.map((d) => ({
                              name: d._id,
                              value: d.count,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {data?.os.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[(index + 3) % COLORS.length]}
                                stroke="rgba(0,0,0,0.5)"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#18181b",
                              borderColor: "#27272a",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: any) => [value, "Users"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {data?.os.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs text-zinc-600">
                            No OS Data
                          </span>
                        </div>
                      ) : (
                        /* Absolute Center Count for Top OS */
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-white mb-0 leading-none">
                            {data?.os[0]?.count || 0}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                            {data?.os[0]?._id || "Total"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-500 mt-2">
                      {data?.os.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{
                              backgroundColor: COLORS[(i + 3) % COLORS.length],
                            }}
                          ></div>
                          <span className="text-zinc-300">{d._id}</span>
                          <span className="font-mono text-zinc-500">
                            ({d.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- GROWTH TAB --- */}
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  label="Total Registered Users"
                  value={data?.stats.totalUsers}
                  icon={Users}
                  color="text-indigo-400"
                />
                <KPICard
                  label="Total Subscribers"
                  value={data?.stats.totalSubscribers}
                  icon={Mail}
                  color="text-pink-400"
                />
                <KPICard
                  label="New Signups (Period)"
                  value={
                    data?.stats.conversionRate === "0"
                      ? 0
                      : chartData.reduce((acc, curr) => acc + curr.signups, 0)
                  }
                  icon={UserPlus}
                  color="text-cyan-400"
                />
                <KPICard
                  label="Visitor Conversion Rate"
                  value={`${data?.stats.conversionRate}%`}
                  icon={TrendingUp}
                  color="text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Audience Composition Chart */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm col-span-1 lg:col-span-1">
                  <h3 className="text-sm font-bold text-zinc-300 mb-6">
                    Total Audience Composition
                  </h3>
                  <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Unknown Visitors",
                              value:
                                (data?.stats.totalVisitorsAllTime || 0) -
                                (data?.stats.totalUsers || 0),
                            },
                            {
                              name: "Registered Users",
                              value: data?.stats.totalUsers || 0,
                            },
                            {
                              name: "Subscribers",
                              value: data?.stats.totalSubscribers || 0,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell
                            fill={AUDIENCE_COLORS[0]}
                            stroke="rgba(0,0,0,0.5)"
                          />
                          <Cell
                            fill={AUDIENCE_COLORS[1]}
                            stroke="rgba(0,0,0,0.5)"
                          />
                          <Cell
                            fill={AUDIENCE_COLORS[2]}
                            stroke="rgba(0,0,0,0.5)"
                          />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#27272a",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: any) => [value, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-white mb-1 leading-none">
                        {(
                          (data?.stats.totalVisitorsAllTime || 0) +
                          (data?.stats.totalSubscribers || 0)
                        ).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        Total Reach
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: AUDIENCE_COLORS[0] }}
                        ></div>
                        <span className="text-zinc-400">
                          Anonymous Visitors
                        </span>
                      </div>
                      <span className="font-mono text-zinc-200">
                        {(
                          (data?.stats.totalVisitorsAllTime || 0) -
                          (data?.stats.totalUsers || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: AUDIENCE_COLORS[1] }}
                        ></div>
                        <span className="text-zinc-400">Registered Users</span>
                      </div>
                      <span className="font-mono text-zinc-200">
                        {data?.stats.totalUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: AUDIENCE_COLORS[2] }}
                        ></div>
                        <span className="text-zinc-400">
                          Newsletter Subscribers
                        </span>
                      </div>
                      <span className="font-mono text-zinc-200">
                        {data?.stats.totalSubscribers.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm col-span-1 lg:col-span-2">
                  <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>{" "}
                    New Signups
                    <span className="w-2 h-2 rounded-full bg-zinc-700 ml-2"></span>{" "}
                    Unique Visitors
                  </h3>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorSignups"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#27272a"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="displayDate"
                          stroke="#52525b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#52525b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#52525b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            value >= 1000
                              ? `${(value / 1000).toFixed(1)}k`
                              : value
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#27272a",
                            borderRadius: "8px",
                          }}
                          itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="signups"
                          name="New Signups"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSignups)"
                          activeDot={{ r: 6 }}
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="visitors"
                          name="Visitors"
                          stroke="#3f3f46"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          fill="none"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-zinc-300 mb-4">
                    Location Breakdown
                  </h3>
                  <div className="space-y-3">
                    {data?.countries.slice(0, 10).map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-zinc-400 flex items-center gap-3">
                          <div className="relative w-5 h-3.5 shadow-sm rounded-sm overflow-hidden flex-shrink-0">
                            <img
                              src={`https://flagcdn.com/w40/${c._id.toLowerCase()}.png`}
                              alt={c._id}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="truncate max-w-[150px]">
                            {c._id && c._id.length === 2
                              ? new Intl.DisplayNames(["en"], {
                                  type: "region",
                                }).of(c._id)
                              : c._id || "Unknown"}
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500/50 rounded-full"
                              style={{
                                width: `${(c.count / (data?.countries[0].count || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-zinc-200 font-mono w-8 text-right">
                            {c.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- ENGAGEMENT TAB --- */}
          {activeTab === "content" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPICard
                  label="Total Comments (All Time)"
                  value={data?.stats.totalComments}
                  icon={MessageSquare}
                  color="text-orange-400"
                />
                <KPICard
                  label="Total Likes (All Time)"
                  value={data?.stats.totalLikes}
                  icon={Heart}
                  color="text-pink-400"
                />
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>{" "}
                  Comments Activity
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272a"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#27272a", opacity: 0.4 }}
                        contentStyle={{
                          backgroundColor: "#18181b",
                          borderColor: "#27272a",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                      />
                      <Bar
                        dataKey="comments"
                        name="Comments"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-zinc-300 mb-4">
                  Top Content Performance
                </h3>
                <div className="space-y-4">
                  {data?.pages.slice(0, 8).map((page, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between text-sm p-2 hover:bg-white/5 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-zinc-500 font-mono w-4">
                          {i + 1}
                        </span>
                        <span className="text-zinc-300 truncate max-w-[300px] group-hover:text-cyan-400 transition-colors">
                          {page._id}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-zinc-500">VIEWS</span>
                          <span className="text-zinc-200 font-mono">
                            {page.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, icon: Icon, color, animate }: any) {
  return (
    <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl backdrop-blur-sm relative overflow-hidden group">
      {animate && (
        <div className="absolute top-2 right-2 flex mx-auto h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        <Icon size={16} className={`${color} opacity-80`} />
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
