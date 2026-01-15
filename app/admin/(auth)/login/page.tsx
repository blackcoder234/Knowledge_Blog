"use client";

import { Button } from "@/app/components/ui/Button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
          const res = await signIn('credentials', {
              email,
              password,
              redirect: false,
          });

          if (res?.error) {
              setError("Unauthorized Access detected.");
          } else {
              router.push('/admin/dashboard');
          }
      } catch (err) {
          setError("Connection refused.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 z-0 opacity-20">
             <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-red-900/20 blur-[100px] rounded-full"></div>
             <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-zinc-800/20 blur-[100px] rounded-full"></div>
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

        <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 shadow-2xl rounded-2xl p-8 relative z-10">
            <div className="flex flex-col items-center mb-8">
                {/* Logo or Icon */}
                <div className="h-12 w-12 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
                <p className="text-zinc-500 text-sm mt-2">Secure Gateway • Authorized Personnel Only</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Identity</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@system.internal"
                        className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-mono text-sm"
                    />
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Credential</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-mono text-sm"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/30 p-3 rounded border border-red-900/50">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                )}

                <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-0 shadow-lg shadow-red-900/20 h-11" disabled={loading}>
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 bg-white rounded-full animate-bounce"></span>
                            Verifying Keys...
                        </span>
                    ) : 'Authenticate Session'}
                </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-between items-center">
                 <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Return to Site
                 </Link>
                 <span className="text-[10px] text-zinc-700 font-mono">
                    VER: 2.0.4.SECURE
                 </span>
            </div>
        </div>
    </div>
  );
}
