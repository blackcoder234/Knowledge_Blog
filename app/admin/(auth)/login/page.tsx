"use client";

import { AuthLayout, AuthInput } from "@/app/components/AuthLayout";
import { Button } from "@/app/components/ui/Button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
              setError("Invalid credentials");
          } else {
              // Redirect specifically to admin dashboard
              router.push('/admin/dashboard');
          }
      } catch (err) {
          setError("Something went wrong");
      } finally {
          setLoading(false);
      }
  };

  return (
    <AuthLayout 
        title="Admin Access" 
        subtitle="Restricted area. Authorized personnel only."
    >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <AuthInput 
                label="Email" 
                type="email" 
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="admin@example.com" 
            />
            
            <div className="space-y-1">
                <AuthInput 
                    label="Password" 
                    type="password" 
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                />
            </div>

            {error && (
                <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20 text-center">{error}</div>
            )}

            <Button variant="primary" className="w-full mt-4 bg-red-600 hover:bg-red-700 border-red-500/50" size="lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
            
            <div className="text-center mt-6">
                 <p className="text-xs text-zinc-500">
                    Lost access? Contact the <a href="mailto:support@knowledgelog.com" className="text-zinc-400 hover:text-white underline">Super Admin</a>.
                 </p>
            </div>
        </form>
    </AuthLayout>
  );
}
