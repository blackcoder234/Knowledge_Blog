export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-8 animate-fade-in">
        {/* Animated Construction Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-zinc-900 border border-yellow-500/30 rounded-full p-6 flex items-center justify-center h-full w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M16.338 3.449a24 24 0 00-5.96 5.96m5.96-5.96a24.026 24.026 0 01-5.808 5.474M3.21 21L7 17.21m8.183-8.183l-3.328-3.328m-4.093 9.47L21.36 5.34"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
          Under Construction
        </h1>

        <p className="text-zinc-400 text-lg font-light">
          We are currently implementing major upgrades to the system.
          <br className="hidden md:block" />
          Please check back shortly.
        </p>

        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-8 opacity-50"></div>

        <p className="text-xs text-zinc-600 font-mono pt-4">
          SYSTEM UPGRADE IN PROGRESS
        </p>
      </div>
    </div>
  );
}
