"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { useSession, signOut } from 'next-auth/react';

export const Header = () => {
  const { data: session } = useSession();
  const [userImage, setUserImage] = useState<string | null | undefined>(null);

  useEffect(() => {
    if (session?.user?.image) {
        setUserImage(session.user.image);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
        // Fetch latest profile validation to ensure image is up to date
        fetch('/api/user/profile/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.image) {
                    setUserImage(data.image);
                }
            })
            .catch(err => console.error("Header image sync error", err));
    }
  }, [session]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Blogs', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <Container>
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            KnowledgeLog
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                className="text-sm font-medium text-muted hover:text-foreground transition-colors uppercase tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA / User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                      <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-0.5">
                               <div className="text-sm font-bold text-white leading-none">{session.user?.name}</div>
                               {(session.user as any).role === 'admin' || (session.user as any).role === 'super_admin' ? (
                                   <Link href="/admin/dashboard" className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-black uppercase tracking-wider hover:bg-white transition-colors ${
                                       (session.user as any).role === 'super_admin' ? 'bg-red-500 text-white hover:text-black' : 'bg-accent'
                                   }`}>
                                       {(session.user as any).role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                   </Link>
                               ) : (session.user as any).role === 'editor' ? (
                                   <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/50 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                                       Editor
                                   </span>
                               ) : (
                                   <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                       Reader
                                   </span>
                               )}
                          </div>
                          <button onClick={() => signOut()} className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors uppercase font-bold tracking-wider">Sign Out</button>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden relative cursor-pointer hover:border-accent transition-colors group">
                          <Link href={`/profile/${(session.user as any).id}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {userImage ? (
                                 <img src={userImage} alt="User" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ): (
                                  <div className="h-full w-full flex items-center justify-center text-sm text-white font-bold uppercase">
                                      {session.user?.name?.charAt(0)}
                                  </div>
                              )}
                          </Link>
                      </div>
                  </div>
               </div>
            ) : (
                <div className="flex items-center gap-4">
                     <Link href="/login" className="text-sm font-medium text-white hover:text-accent transition-colors">
                        Log In
                     </Link>
                     <Link href="/signup">
                        <Button variant="primary" size="sm" className="cursor-pointer">
                        Subscribe
                        </Button>
                    </Link>
                </div>
            )}
          </div>
          
          {/* Mobile Menu Toggle (Placeholder) */}
          <button className="md:hidden text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </Container>
    </header>
  );
};
