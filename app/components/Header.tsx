"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";
import { useSession, signOut } from "next-auth/react";
import { UserBadge } from "./ui/UserBadge";

export const Header = () => {
  const { data: session } = useSession();
  const [userImage, setUserImage] = useState<string | null | undefined>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.image) {
      setUserImage(session.user.image);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/profile/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.image) {
            setUserImage(data.image);
          }
        })
        .catch((err) => console.error("Header image sync error", err));
    }
  }, [session]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const [siteTitle, setSiteTitle] = useState("KnowledgeLog");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.site_title?.value) {
          setSiteTitle(data.site_title.value);
        }
      })
      .catch((err) => console.error("Header site title fetch error", err));
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Blogs", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <Container>
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-serif font-bold tracking-tight text-white z-50 relative"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {siteTitle}
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
                  {/* Write Post Button for Authors */}
                  {["admin", "super_admin", "editor"].includes(
                    (session.user as any).role,
                  ) && (
                    <Link
                      href="/admin/posts/create"
                      className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-400/10 hover:shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)] transition-all duration-300 group mr-2 relative"
                      title="Write New Post"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:scale-110 transition-transform"
                      >
                        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </Link>
                  )}

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-0.5">
                      <div className="text-sm font-bold text-white leading-none">
                        {session.user?.name}
                      </div>
                      <UserBadge
                        role={(session.user as any).role}
                        showLabel={false}
                        className="scale-90"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-1">
                      {["admin", "super_admin"].includes(
                        (session.user as any).role,
                      ) && (
                        <Link
                          href="/admin/dashboard"
                          className="text-[10px] text-zinc-500 hover:text-accent transition-colors uppercase font-bold tracking-wider"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors uppercase font-bold tracking-wider"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden relative cursor-pointer hover:border-accent transition-colors group">
                    <Link href={`/profile/${(session.user as any).id}`}>
                      {userImage ? (
                        <img
                          src={userImage}
                          alt="User"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
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
                <Link
                  href="/login"
                  className="text-sm font-medium text-white hover:text-accent transition-colors"
                >
                  Log In
                </Link>
                <Link href="/signup">
                  <Button
                    variant="primary"
                    size="sm"
                    className="cursor-pointer"
                  >
                    Subscribe
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden z-50 relative text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-0 left-0 w-full h-screen bg-black/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center opacity-100 transition-all duration-300">
          <nav className="flex flex-col items-center gap-8 mb-12">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-3xl font-bold text-white hover:text-accent transition-colors tracking-tight"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-6 p-8 border-t border-white/10 w-full max-w-xs">
            {session ? (
              <div className="text-center w-full">
                <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white/10">
                  {userImage ? (
                    <img
                      src={userImage}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-white">
                      {session.user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  {session.user?.name}
                </h4>
                <Link
                  href={`/profile/${(session.user as any).id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm text-accent hover:underline mb-6 block"
                >
                  View Profile
                </Link>

                <div className="grid grid-cols-2 gap-4 w-full">
                  {(session.user as any).role === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                      >
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className="w-full justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-center h-12 text-lg"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="primary"
                    className="w-full justify-center h-12 text-lg"
                  >
                    Subscribe
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
