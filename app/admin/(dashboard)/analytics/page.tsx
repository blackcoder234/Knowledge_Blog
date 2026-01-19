"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Globe,
  Smartphone,
  Clock,
  Users,
  ArrowUpRight,
  Layout,
  Activity,
  MousePointer,
  Monitor,
  Chrome,
  Sparkles,
} from "lucide-react";

// Types matching the API response
interface AnalyticsData {
  history: { _id: string; count: number }[];
  historyNew?: { _id: string; count: number }[];
  historyReturning?: { _id: string; count: number }[];
  stats: {
    total: number;
    new: number;
    returning: number;
    bounceRate: string | number;
    live?: number;
    avgDuration?: number;
  };
  pages: { _id: string; count: number }[];
  referrers: { _id: string; count: number }[];
  devices: { _id: string; count: number }[];
  os: { _id: string; count: number }[];
  browsers: { _id: string; count: number }[];
  countries: { _id: string; count: number }[];
}

const RANGES = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "6m", value: "6m" },
  { label: "1y", value: "1y" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredData, setHoveredData] = useState<{
    x: number;
    y: number;
    item: any;
    index: number;
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData(range);
  }, [range]);

  const fetchData = async (selectedRange: string) => {
    setLoading(true);
    setHoveredData(null); // Reset hover on fetch
    try {
      const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        // Fallback for missing data structure during dev/migration
        const safeData: AnalyticsData = {
          history: json.history || [],
          historyNew: json.historyNew || [],
          historyReturning: json.historyReturning || [],
          stats: {
            total: json.stats?.total || 0,
            new: json.stats?.new || 0,
            returning: json.stats?.returning || 0,
            bounceRate: json.stats?.bounceRate || 0,
            live: json.stats?.live || 0,
            avgDuration: json.stats?.avgDuration || 0,
          },
          pages: json.pages || [],
          referrers: json.referrers || [],
          devices: json.devices || [],
          os: json.os || [],
          browsers: json.browsers || [],
          countries: json.countries || [],
        };
        setData(safeData);
      } else {
        console.error("Failed to fetch analytics");
        setData(null);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Data Processing & Normalization ---
  const chartData = useMemo(() => {
    if (!data?.history) return [];

    const now = new Date();
    const historyMap = new Map(
      data.history.map((item) => [item._id, item.count]),
    );
    const normalized = [];

    if (range === "24h") {
      // Need to reconstruct the last 24 hours hour-by-hour to ensure order and fill gaps
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(now.getHours() - i);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);

        // Format ID like backend: "HH:00"
        const id = `${d.getHours().toString().padStart(2, "0")}:00`;

        normalized.push({
          _id: id,
          fullDate: d,
          count: historyMap.get(id) || 0,
          label: id,
        });
      }
    } else if (range === "7d" || range === "30d") {
      const days = range === "7d" ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const id = d.toISOString().split("T")[0]; // YYYY-MM-DD

        normalized.push({
          _id: id,
          fullDate: d,
          count: historyMap.get(id) || 0,
          // Label logic
          label:
            range === "7d"
              ? d.toLocaleDateString("en-US", { weekday: "short" })
              : d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
        });
      }
    } else {
      // Months (6m, 1y) - Backend returns YYYY-MM
      const months = range === "6m" ? 6 : 12;
      // Generate last N months keys
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const id = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;

        normalized.push({
          _id: id,
          fullDate: d,
          count: historyMap.get(id) || 0,
          label: d.toLocaleDateString("en-US", { month: "short" }),
        });
      }
    }

    return normalized;
  }, [data, range]);

  // --- Chart Scaling ---
  const maxVal =
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.count)) : 0;

  // Adaptive Y-Axis Ticks (Integer Only)
  let yTicks: number[] = [];

  if (maxVal <= 4) {
    // Always show 0-4 for very small/empty data to maintain grid structure
    yTicks = [0, 1, 2, 3, 4];
  } else {
    // For larger numbers, use 4 intervals with "nice" integer steps
    const intervals = 4;
    const roughStep = maxVal / intervals;

    // Calculate magnitude (power of 10)
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / magnitude;

    // Round up to nearest nice integer multiplier
    let cleanStepMultiplier;
    if (normalizedStep <= 1) cleanStepMultiplier = 1;
    else if (normalizedStep <= 2) cleanStepMultiplier = 2;
    else if (normalizedStep <= 5) cleanStepMultiplier = 5;
    else cleanStepMultiplier = 10;

    const step = cleanStepMultiplier * magnitude;
    yTicks = [0, step, step * 2, step * 3, step * 4];
  }

  const yMax = yTicks[yTicks.length - 1];

  const getPoints = (currentHistory: typeof chartData) => {
    if (!currentHistory || currentHistory.length === 0) return "";

    // Normalize data
    const width = 1000; // viewBox width
    const height = 250; // viewBox height (drawing area)

    return currentHistory
      .map((point, index) => {
        const x = (index / (currentHistory.length - 1 || 1)) * width;
        const y = height - (point.count / yMax) * height;
        return `${x},${Math.min(Math.max(y, 0), height)}`;
      })
      .join(" ");
  };

  // Tooltip & Hover Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartData || chartData.length === 0 || !chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 8; // Adjust for padding
    const width = rect.width - 8;

    const count = chartData.length;
    if (count < 2) return;

    const index = Math.min(
      Math.max(0, Math.round((x / width) * (count - 1))),
      count - 1,
    );
    const item = chartData[index];

    const svgX = (index / (count - 1)) * 1000;
    const height = 250;
    const y = height - (item.count / yMax) * height;

    setHoveredData({
      x: svgX,
      y: Math.min(Math.max(y, 0), height),
      item,
      index,
    });
  };

  // Tooltip Formatter
  const getTooltipDate = (item: (typeof chartData)[0]) => {
    const d = item.fullDate;
    if (range === "24h") {
      // "Today, 14:00" or "Yesterday, 22:00"
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
      const dayStr = isToday ? "Today" : "Yesterday";
      return `${dayStr}, ${d.getHours().toString().padStart(2, "0")}:00`;
    } else if (range === "1y" || range === "6m") {
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      // 7d, 30d
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Format Duration helper
  const formatDuration = (sec: number) => {
    if (!sec) return "0s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="p-6 w-full space-y-8 animate-fade-in font-sans min-h-screen">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Traffic Analytics
          </h1>
          <p className="text-zinc-400 flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${data?.stats?.live && data.stats.live > 0 ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`}
            ></span>
            {data?.stats?.live
              ? `${data.stats.live} Users Active Now`
              : "Live Tracking"}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
          {RANGES.map((r) => {
            const isActive = range === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`relative px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="rangePill"
                    className="absolute inset-0 bg-cyan-400/60 shadow-md shadow-cyan-500/15 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area with localized loading state */}
      <div className="relative min-h-[400px]">
        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-start justify-center pt-32 pointer-events-none"
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto"
              >
                <div className="w-4 h-4 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin" />
                <span className="text-cyan-100 text-xs font-mono tracking-wider">
                  UPDATING LIVE DATA...
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`transition-all duration-500 ${loading && data ? "opacity-40 blur-sm scale-[0.99] grayscale-[0.5]" : "opacity-100 scale-100"}`}
        >
          {!data && loading ? (
            <div className="flex items-center justify-center h-96 w-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-mono text-xs animate-pulse">
                  Initializing...
                </p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Overview Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  label="Total Users"
                  value={data.stats.total.toLocaleString()}
                  subvalue={
                    range === "24h"
                      ? "Last 24 Hours"
                      : `Last ${range.replace("d", " Days").replace("m", " Months").replace("y", " Year")}`
                  }
                  icon={Activity}
                  color="text-cyan-400"
                  bg="bg-cyan-500/10"
                  borderColor="border-cyan-500/20"
                />
                <StatsCard
                  label="Avg. Session"
                  value={formatDuration(data.stats.avgDuration || 0)}
                  icon={Clock}
                  color="text-amber-400"
                  bg="bg-amber-500/10"
                  borderColor="border-amber-500/20"
                />
                <StatsCard
                  label="Returning"
                  value={data.stats.returning.toLocaleString()}
                  icon={Users}
                  color="text-violet-400"
                  bg="bg-violet-500/10"
                  borderColor="border-violet-500/20"
                  trend={calculateTrend(data.historyReturning || [])}
                />
                <StatsCard
                  label="New Visitors"
                  value={data.stats.new.toLocaleString()}
                  icon={Sparkles}
                  color="text-green-400"
                  bg="bg-green-500/10"
                  borderColor="border-green-500/20"
                  trend={calculateTrend(data.historyNew || [])}
                />
              </div>

              {/* Main Traffic Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-xl relative overflow-visible backdrop-blur-sm mb-8"
              >
                <div className="flex justify-between items-center mb-6 z-10 relative">
                  <h3 className="font-bold text-zinc-200 flex items-center gap-2 text-sm">
                    <BarChart3 size={16} className="text-cyan-400" />
                    Traffic Trend
                  </h3>

                  {/* Range Context Badge */}
                  <div className="text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded">
                    RANGE: {range.toUpperCase()}
                  </div>
                </div>

                <div className="flex">
                  {/* Y-Axis Labels */}
                  <div className="flex flex-col justify-between h-[250px] pr-4 text-right min-w-[30px] border-r border-zinc-800/50">
                    {yTicks
                      .slice()
                      .reverse()
                      .map((tick) => (
                        <span
                          key={tick}
                          className="text-xs text-zinc-400 font-medium h-[10px] leading-[0px] relative top-[5px]"
                        >
                          {/* Use shorter format for large numbers if needed */}
                          {tick >= 1000 ? (tick / 1000).toFixed(1) + "k" : tick}
                        </span>
                      ))}
                  </div>

                  <div
                    ref={chartRef}
                    className="w-full h-[340px] relative cursor-crosshair group pl-2" // increased height for labels
                    onMouseLeave={() => setHoveredData(null)}
                    onMouseMove={handleMouseMove}
                  >
                    <p className="absolute -top-3 left-0 text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                      USERS
                    </p>

                    {chartData.length > 0 ? (
                      <svg
                        className="w-full h-[250px]"
                        viewBox="0 0 1000 250"
                        preserveAspectRatio="none"
                        style={{ overflow: "visible" }}
                      >
                        <defs>
                          <linearGradient
                            id="chartGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#22d3ee"
                              stopOpacity="0.2"
                            />
                            <stop
                              offset="100%"
                              stopColor="#22d3ee"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        {yTicks.map((tick, i) => {
                          const yPos = 250 - (tick / yMax) * 250;
                          if (isNaN(yPos)) return null;
                          return (
                            <line
                              key={tick}
                              x1="0"
                              y1={yPos}
                              x2="1000"
                              y2={yPos}
                              stroke="rgba(161, 161, 170, 0.15)"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                          );
                        })}

                        {/* Area Fill */}
                        <motion.path
                          d={`M 0,250 L ${getPoints(chartData)} L 1000,250 Z`}
                          fill="url(#chartGradient)"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.8 }}
                          vectorEffect="non-scaling-stroke"
                        />

                        {/* Line Path */}
                        <motion.polyline
                          points={getPoints(chartData)}
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1 }}
                          vectorEffect="non-scaling-stroke"
                        />

                        {/* Hover Elements */}
                        {hoveredData && (
                          <>
                            <line
                              x1={hoveredData.x}
                              y1="0"
                              x2={hoveredData.x}
                              y2="250"
                              stroke="#22d3ee"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                              opacity="0.5"
                            />
                            <circle
                              cx={hoveredData.x}
                              cy={hoveredData.y}
                              r="5"
                              fill="#09090b"
                              stroke="#22d3ee"
                              strokeWidth="2"
                            />
                            <circle
                              cx={hoveredData.x}
                              cy={hoveredData.y}
                              r="8"
                              stroke="#22d3ee"
                              strokeWidth="1"
                              opacity="0.5"
                            >
                              <animate
                                attributeName="r"
                                values="8;12;8"
                                dur="1.5s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                values="0.5;0;0.5"
                                dur="1.5s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          </>
                        )}
                      </svg>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-zinc-600 text-xs">
                        No traffic data recorded
                      </div>
                    )}

                    {/* Tooltip */}
                    {hoveredData && (
                      <div
                        className="absolute bg-zinc-950/95 border border-zinc-800 p-3 rounded-lg shadow-2xl backdrop-blur-md pointer-events-none z-20 flex flex-col gap-1 min-w-[140px]"
                        style={{
                          left: `${(hoveredData.index / (chartData.length - 1)) * 100}%`,
                          top: 0,
                          transform: `translateX(${hoveredData.index / (chartData.length - 1) > 0.5 ? "-110%" : "10%"}) translateY(10px)`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                          <span className="text-sm font-bold text-zinc-100">
                            {hoveredData.item.count} Visitors
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono border-t border-zinc-900 pt-1 mt-1 block">
                          {getTooltipDate(hoveredData.item)}
                        </span>
                      </div>
                    )}

                    {/* X-Axis Labels */}
                    <div className="absolute top-[260px] w-full h-8 overflow-visible">
                      <div className="w-full h-full relative">
                        {chartData.map((d, i, arr) => {
                          const len = arr.length;
                          // Sparse labelling logic to prevent overlap
                          // Always show first and last.
                          // Then show others based on screen space assumption

                          let show = false;
                          const isFirst = i === 0;
                          const isLast = i === len - 1;

                          if (range === "24h") {
                            // Show every 4 hours (index 0, 4, 8, etc from end?)
                            // 24 items.
                            show = i % 4 === 0 || isLast;
                          } else if (range === "7d") {
                            show = true; // Show all 7 days
                          } else if (range === "30d") {
                            show = i % 5 === 0 || isLast; // Every 5 days
                          } else {
                            // 6m, 1y -> Show all months
                            show = true;
                          }

                          if (!show) return null;

                          return (
                            <span
                              key={i}
                              className={`absolute top-0 transform -translate-x-1/2 font-mono text-xs font-medium text-zinc-400 ${isLast ? "text-cyan-400 font-bold" : ""}`}
                              // Ensure first label doesn't get cut off left, last not cut off right if needed
                              style={{ left: `${(i / (len - 1)) * 100}%` }}
                            >
                              {isLast && range === "24h" ? "Now" : d.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Center Context Label (Below Axis) */}
                    <div className="absolute bottom-0 w-full text-center">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-950/50 px-4 py-1.5 rounded-full border border-zinc-800 shadow-lg">
                        {range === "24h" && "Last 24 Hours"}
                        {range === "7d" && "Last 7 Days"}
                        {range === "30d" && "Last 30 Days"}
                        {range === "6m" && "Last 6 Months"}
                        {range === "1y" && "Last Year"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Grid: Pages, Devices, etc */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Top Pages */}
                <BreakdownCard
                  title="Top Pages"
                  icon={Layout}
                  iconColor="text-violet-400"
                  items={data.pages
                    .slice(0, 5)
                    .map((p) => ({ label: p._id, count: p.count }))}
                  total={data.stats.total}
                />

                {/* Referrers */}
                <BreakdownCard
                  title="Top Referrers"
                  icon={Globe}
                  iconColor="text-emerald-400"
                  items={data.referrers
                    .slice(0, 5)
                    .map((r) => ({ label: r._id || "Direct", count: r.count }))}
                  total={data.stats.total}
                />

                {/* Devices */}
                <BreakdownCard
                  title="Devices"
                  icon={Smartphone}
                  iconColor="text-pink-400"
                  items={data.devices.map((d) => ({
                    label: d._id || "Unknown",
                    count: d.count,
                  }))}
                  total={data.stats.total}
                />

                {/* Operating Systems */}
                <BreakdownCard
                  title="Operating Systems"
                  icon={Monitor}
                  iconColor="text-blue-400"
                  items={data.os.map((o) => ({
                    label: o._id || "Unknown",
                    count: o.count,
                  }))}
                  total={data.stats.total}
                />

                {/* Browsers */}
                <BreakdownCard
                  title="Browsers"
                  icon={Chrome}
                  iconColor="text-orange-400"
                  items={data.browsers.map((b) => ({
                    label: b._id || "Unknown",
                    count: b.count,
                  }))}
                  total={data.stats.total}
                />

                {/* Top Countries */}
                <BreakdownCard
                  title="Top Countries"
                  icon={Globe}
                  iconColor="text-indigo-400"
                  items={data.countries.map((c) => ({
                    label: c._id || "Unknown",
                    count: c.count,
                  }))}
                  total={data.stats.total}
                />
              </div>
            </>
          ) : (
            <div className="text-center text-zinc-600 mt-20 text-sm font-semibold">
              No data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper for rough trend calculation
function calculateTrend(history: { count: number }[]) {
  if (!history || history.length < 2) return 0;
  const mid = Math.floor(history.length / 2);
  const firstHalf = history
    .slice(0, mid)
    .reduce((acc, curr) => acc + curr.count, 0);
  const secondHalf = history
    .slice(mid)
    .reduce((acc, curr) => acc + curr.count, 0);

  if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;

  return ((secondHalf - firstHalf) / firstHalf) * 100;
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  borderColor,
  trend,
}: any) {
  const isPositive = trend >= 0;
  const trendValue =
    typeof trend === "number" ? Math.abs(trend).toFixed(1) : null;

  return (
    <div
      className={`p-6 rounded-3xl border ${borderColor} ${bg} backdrop-blur-md relative overflow-hidden flex items-center justify-between h-[128px] transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="relative z-10 flex flex-col justify-center gap-1">
        <p className="text-zinc-300 text-sm font-bold uppercase tracking-widest">
          {label}
        </p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl font-black text-white tracking-tight">
            {value}
          </h3>

          {/* Trend Pill */}
          {trendValue && (
            <div
              className={`flex items-center gap-1 text-[14px] font-bold px-2.5 py-0.5 rounded-full border ${isPositive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-rose-500/20 text-rose-400 border-rose-500/20"}`}
            >
              {isPositive ? (
                <ArrowUpRight size={14} strokeWidth={2.5} />
              ) : (
                <ArrowUpRight
                  size={14}
                  className="rotate-90"
                  strokeWidth={2.5}
                />
              )}
              {trendValue}%
            </div>
          )}
        </div>
      </div>

      {/* Icon */}
      <div
        className={`p-2.5 rounded-2xl bg-white/5 ${color} border border-white/10 shadow-inner`}
      >
        <Icon size={24} strokeWidth={2.5} />
      </div>

      {/* Glow */}
      <div
        className={`absolute -bottom-6 -right-6 w-32 h-32 ${color.replace("text-", "bg-")} blur-[60px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity`}
      ></div>
    </div>
  );
}

function BreakdownCard({ title, icon: Icon, iconColor, items, total }: any) {
  const maxVal = Math.max(...items.map((i: any) => i.count), 0);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md p-6 h-full flex flex-col hover:border-zinc-700/80 transition-colors font-sans">
      <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-3 border-b border-zinc-800/50 pb-4">
        <div
          className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800 ${iconColor} shadow-[0_0_15px_-3px_rgba(0,0,0,0.5)]`}
        >
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <span className="tracking-wide text-zinc-100">{title}</span>
      </h3>
      <div className="space-y-5">
        {items.length > 0 ? (
          items.map((item: any, i: number) => {
            const percent =
              total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
            const barPercent = maxVal > 0 ? (item.count / maxVal) * 100 : 0;

            return (
              <div key={i} className="group">
                <div className="flex items-center justify-between text-xs mb-2 font-medium">
                  <span className="text-zinc-300 truncate max-w-[180px] group-hover:text-white transition-colors text-[13px]">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-[13px]">
                      {item.count.toLocaleString()}
                    </span>
                    <span
                      className={`text-[11px] w-12 text-right font-medium ${parseInt(percent as string) > 50 ? "text-emerald-400" : "text-zinc-500"}`}
                    >
                      {percent}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-zinc-950/50 rounded-full overflow-hidden border border-zinc-900/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPercent}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full rounded-full ${iconColor.replace("text-", "bg-")} opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all`}
                  ></motion.div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-zinc-500 text-sm italic py-4 text-center">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
