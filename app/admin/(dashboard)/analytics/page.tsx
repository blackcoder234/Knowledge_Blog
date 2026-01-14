"use client";

import { useEffect, useState } from 'react';
import { Container } from '@/app/components/ui/Container';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Re-use the same stats API for now, but in reality we might want a detailed one
    // We can fetch the same data and visualize it differently or more deeply
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-zinc-500">Loading analytics...</div>;

  return (
    <div className="animate-fade-in">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-zinc-400">Deep dive into your traffic and user engagement.</p>
        </div>

        {/* Detailed Charts */}
        <div className="grid grid-cols-1 gap-8">
            
            {/* Visitors Graph (Large) */}
            <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-8">Visitor Growth (Last 7 Days)</h3>
                
                <div className="h-96 flex items-end justify-between gap-4">
                    {data?.charts?.visitors.map((day: any) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-4 group">
                             <div 
                                className="w-full bg-accent/20 border-t border-x border-accent/50 rounded-t-lg transition-all duration-500 hover:bg-accent/40 relative group"
                                style={{ height: `${Math.max(day.visitors * 10, 5)}%` }}
                             >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-sm font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {day.visitors} Visitors
                                </div>
                             </div>
                             <span className="text-xs text-zinc-500 font-mono">{day.date}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Platform / Device Split (Mock Data for now as we just started storing UA) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-6">
                     <h3 className="text-lg font-bold text-white mb-6">Device Breakdown</h3>
                     <div className="space-y-4">
                         {['Desktop', 'Mobile', 'Tablet'].map((dev, i) => (
                             <div key={dev}>
                                 <div className="flex justify-between text-sm text-zinc-400 mb-2">
                                     <span>{dev}</span>
                                     <span>{100 - i * 30}%</span>
                                 </div>
                                 <div className="w-full bg-white/5 rounded-full h-2">
                                     <div className="bg-accent h-2 rounded-full" style={{ width: `${100 - i * 30}%` }}></div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>

                 <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-6">
                     <h3 className="text-lg font-bold text-white mb-6">Top Countries</h3>
                     <div className="space-y-4">
                         {['United States', 'India', 'United Kingdom', 'Germany'].map((country, i) => (
                             <div key={country} className="flex items-center justify-between p-3 border border-white/5 rounded-lg">
                                 <div className="flex items-center gap-3">
                                     <span className="text-white font-medium text-sm">{country}</span>
                                 </div>
                                 <span className="text-xs font-mono text-zinc-500">{1000 - i * 150} views</span>
                             </div>
                         ))}
                     </div>
                 </div>
            </div>

        </div>
    </div>
  );
}
