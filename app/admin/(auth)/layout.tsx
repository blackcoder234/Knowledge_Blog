export default function AuthLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-background">
           {/* Static Background Elements for Admin Auth - Maybe slightly distinct color? */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 w-full h-full flex-1 flex flex-col">
            {children}
          </div>
      </main>
    );
  }
