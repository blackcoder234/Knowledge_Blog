export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
       {/* Header Skeleton */}
       <div className="mb-8 space-y-2">
          <div className="h-8 w-48 bg-zinc-800 rounded"></div>
          <div className="h-4 w-96 bg-zinc-900 rounded"></div>
       </div>

       {/* Stats Grid Skeleton */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
             <div key={i} className="bg-[#0D0D0D] border border-white/5 rounded-xl p-6 h-32 flex flex-col justify-between">
                <div className="h-4 w-24 bg-zinc-800 rounded"></div>
                <div className="h-8 w-16 bg-zinc-800 rounded"></div>
             </div>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Chart Skeleton */}
            <div className="lg:col-span-2 bg-[#0D0D0D] border border-white/5 rounded-xl p-6 h-[400px]">
               <div className="h-6 w-32 bg-zinc-800 rounded mb-8"></div>
               <div className="h-full w-full bg-zinc-900/50 rounded flex items-end justify-between p-4 gap-2">
                  {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-full bg-zinc-800 rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                  ))}
               </div>
            </div>

            {/* List Skeleton */}
            <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-6 h-[400px]">
                <div className="h-6 w-32 bg-zinc-800 rounded mb-6"></div>
                <div className="space-y-4">
                   {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded bg-zinc-800 shrink-0"></div>
                         <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-zinc-800 rounded"></div>
                            <div className="h-3 w-1/4 bg-zinc-900 rounded"></div>
                         </div>
                      </div>
                   ))}
                </div>
            </div>
       </div>
    </div>
  );
}
