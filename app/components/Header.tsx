"use client";

import Link from 'next/link';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { useSession, signOut } from 'next-auth/react';

export const Header = () => {
  const { data: session } = useSession();

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
                               {(session.user as any).role === 'admin' ? (
                                   <Link href="/admin/dashboard" className="px-1.5 py-0.5 rounded bg-accent text-[10px] font-bold text-black uppercase tracking-wider hover:bg-white transition-colors">
                                       Admin
                                   </Link>
                               ) : (
                                   <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                       Reader
                                   </span>
                               )}
                          </div>
                          <button onClick={() => signOut()} className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors uppercase font-bold tracking-wider">Sign Out</button>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {session.user?.image ? (
                             <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                          ): (
                              <div className="h-full w-full flex items-center justify-center text-sm text-white font-bold uppercase">
                                  {session.user?.name?.charAt(0)}
                              </div>
                          )}
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
