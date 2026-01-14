"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '../../components/ui/Button';
import { Container } from '../../components/ui/Container';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
      if (status === 'unauthenticated') {
          router.push('/login');
      }
  }, [status, router]);

  if (status === 'loading') {
      return (
          <Container className="py-20 text-center">
              <div className="text-zinc-500">Loading profile...</div>
          </Container>
      );
  }

  if (!session) return null;

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Load initial user data specifically (beyond session)
    useEffect(() => {
        if (session) {
            // We could just use session, but fetching fresh data is better for edits
            // For now, let's assume we can augment session or just fetch self
             const fetchSelf = async () => {
                const res = await fetch(`/api/users/${(session.user as any).id || (session.user as any)._id}`, {
                    // Note: This endpoint might be admin-only currently. 
                    // Let's rely on session + local state for MVP or assume we add a "me" endpoint.
                    // Actually, simpler: just use session data initially and update local state
                });
                // Since we don't have a dedicated /me endpoint yet, we set from session
                // Ideally we should add GET /api/user/profile. 
                // Let's implement that fetch in the Patch route or similar.
                // For this step, I'll rely on session data + a refresh mechanism.
            };
        }
    }, [session]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const title = (form.elements.namedItem('title') as HTMLInputElement).value;
        const bio = (form.elements.namedItem('bio') as HTMLTextAreaElement).value;

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, title, bio })
            });
            
            if (res.ok) {
                alert('Profile updated! Please sign out and in to see changes in session.');
                router.refresh();
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        setUploading(true);
        const data = new FormData();
        data.append('file', file);
    
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const json = await res.json();
            if (json.url) {
                // Update profile immediately with new image
                await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: json.url })
                });
                // Force reload or manual update of UI ideally
                window.location.reload(); 
            }
        } catch (err) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

  return (
    <Container className="py-20">
        <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Profile Settings</h1>
            <p className="text-zinc-400 max-w-2xl">Manage your personal information, security preferences, and account settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Avatar & Basic Info */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-card border border-white/5 rounded-xl p-8 text-center bg-[#0D0D0D]">
                    <div className="relative inline-block mb-6">
                        <div className="h-32 w-32 rounded-full bg-zinc-800 border-4 border-[#121212] flex items-center justify-center text-4xl font-bold text-white overflow-hidden text-clip relative group cursor-pointer shadow-xl mx-auto">
                            {session.user?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <span>{session.user?.name?.charAt(0)}</span>
                            )}
                            
                            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 cursor-pointer">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                {uploading ? (
                                    <span className="text-xs text-white">...</span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                    </svg>
                                )}
                            </label>
                        </div>
                        <div className="absolute bottom-2 right-1/2 translate-x-10 h-6 w-6 rounded-full bg-green-500 border-4 border-[#121212]" title="Online"></div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">{session.user?.name}</h2>
                    
                     {/* Dynamic Badge */}
                     <div className="mb-4">
                        {(session.user as any).role === 'super_admin' ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-wider">
                                Super Admin
                            </span>
                        ) : (session.user as any).role === 'admin' ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-accent/20 border border-accent/50 text-accent text-xs font-bold uppercase tracking-wider">
                                Administrator
                            </span>
                        ) : (
                            <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                                Reader
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-zinc-400 mb-6">{session.user?.email}</p>
                    
                    <div className="flex justify-center gap-2 mb-4">
                        <span className="text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10 text-zinc-400">San Francisco, CA</span>
                    </div>

                    {((session.user as any).role === 'admin' || (session.user as any).role === 'super_admin') && (
                        <div className="border-t border-white/10 pt-6 mt-6">
                            <Button 
                                variant="primary" 
                                className="w-full"
                                onClick={() => router.push('/admin/dashboard')}
                            >
                                Enter Admin Dashboard
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Edit Forms */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-card border border-white/5 rounded-xl p-6 bg-[#0D0D0D]">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Personal Details</h3>
                    <form className="space-y-4" onSubmit={handleUpdateProfile}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Full Name</label>
                                <input name="name" type="text" defaultValue={session.user?.name || ''} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Job Title</label>
                                <input name="title" type="text" placeholder="e.g. Senior Editor" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50" />
                             </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-400">Email Address</label>
                            <input type="email" defaultValue={session.user?.email || ''} readOnly className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed focus:outline-none" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-400">Bio</label>
                            <textarea name="bio" rows={4} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 text-sm" placeholder="Tell us about yourself..."></textarea>
                         </div>
                         <div className="pt-4 flex justify-end">
                             <Button variant="primary" disabled={isLoading}>
                                 {isLoading ? 'Saving...' : 'Save Changes'}
                             </Button>
                         </div>
                    </form>
                </div>

                <div className="bg-card border border-white/5 rounded-xl p-6 bg-[#0D0D0D]">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Security</h3>
                    <form className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-400">Current Password</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">New Password</label>
                                <input type="password" placeholder="New password" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Confirm Password</label>
                                <input type="password" placeholder="Confirm password" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50" />
                             </div>
                        </div>
                         <div className="pt-4 flex justify-between items-center">
                             <button type="button" className="text-xs text-red-500 hover:text-red-400 font-medium">Deactivate Account</button>
                             <Button variant="outline">Update Password</Button>
                         </div>
                    </form>
                </div>
            </div>
        </div>
    </Container>
  );
}
