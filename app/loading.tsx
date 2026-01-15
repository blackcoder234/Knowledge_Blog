export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d0d] text-white">
      <div className="relative flex items-center justify-center">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full scale-150 animate-pulse"></div>
        
        {/* Animated Rings */}
        <div className="h-16 w-16 rounded-full border-2 border-accent/30 border-t-accent animate-spin duration-1000"></div>
        <div className="absolute h-12 w-12 rounded-full border-2 border-accent/20 border-b-accent animate-spin duration-1000 direction-reverse"></div>
        
        {/* Center Dot */}
        <div className="absolute h-2 w-2 bg-accent rounded-full animate-ping"></div>
      </div>
      
      <p className="mt-8 text-xs font-medium text-zinc-500 tracking-[0.2em] animate-pulse">
        INITIALIZING SYSTEM
      </p>
    </div>
  );
}
