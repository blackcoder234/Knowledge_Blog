"use client";

import { useEffect, useState } from 'react';
import { Container } from '@/app/components/ui/Container';

// Helper to format large numbers
const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
};

const StatsCard = ({ label, value, trend, loading }: { label: string, value: string, trend?: string, loading?: boolean }) => (
    <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-6 relative overflow-hidden">
        {loading && <div className="absolute inset-0 bg-black/50 animate-pulse z-10"></div>}
        <p className="text-sm font-medium text-zinc-400 mb-1">{label}</p>
        <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            {trend && (
                <div className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                    {trend}
                </div>
            )}
        </div>
    </div>
);

import { useSession } from 'next-auth/react';

// ... (existing imports/code)

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-zinc-400">Welcome back, <span className="text-white font-semibold">{session?.user?.name}</span>! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
                label="Total Users" 
                value={loading ? '-' : formatNumber(data?.metrics?.users)} 
                trend="+12%" 
                loading={loading} 
            />
            <StatsCard 
                label="Total Posts" 
                value={loading ? '-' : formatNumber(data?.metrics?.posts)} 
                loading={loading} 
            />
            <StatsCard 
                label="Subscribers" 
                value={loading ? '-' : formatNumber(data?.metrics?.subscribers)} 
                trend="Active" 
                loading={loading} 
            />
            <StatsCard 
                label="Total Page Views" 
                value={loading ? '-' : formatNumber(data?.metrics?.visitors)} 
                trend="+5%" 
                loading={loading} 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
             {/* Simple Chart Visualization (Placeholder for now) */}
             <div className="lg:col-span-2 bg-[#0D0D0D] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Traffic Overview (Last 7 Days)</h3>
                <div className="h-64 flex items-end gap-2">
                    {loading ? (
                         <div className="w-full h-full bg-white/5 animate-pulse rounded"></div>
                    ) : (
                        data?.charts?.visitors.map((day: any) => (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                                <div 
                                    className="w-full bg-accent/20 border-t border-accent rounded-t-sm transition-all duration-500 hover:bg-accent/40 relative"
                                    style={{ height: `${Math.max(day.visitors * 10, 5)}%` }} // Simple scaling
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {day.visitors}
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-500">{day.date.split('-')[2]}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Posts List */}
            <div className="bg-[#0D0D0D] border border-white/5 rounded-xl overflow-hidden p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Posts</h3>
                <div className="space-y-4">
                     {loading ? (
                         [1,2,3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded"></div>)
                     ) : (
                         data?.recentActivity?.posts.map((post: any) => (
                             <div key={post._id} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                 <div className="w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
                                     {/* eslint-disable-next-line @next/next/no-img-element */}
                                     {post.image && <img src={post.image} alt="" className="w-full h-full object-cover" />}
                                 </div>
                                 <div className="min-w-0">
                                     <p className="text-sm text-white font-medium truncate">{post.title}</p>
                                     <p className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                 </div>
                             </div>
                         ))
                     )}
                </div>
            </div>
        </div>
    </div>
  );
}
