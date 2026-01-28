"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function TrendingTicker({
  posts,
}: {
  posts: { title: string; slug: string }[];
}) {
  // Fallback if no posts
  const displayPosts =
    posts && posts.length > 0
      ? posts
      : [
          {
            title: "Welcome to KnowledgeLog. Start reading below...",
            slug: "welcome",
          },
        ];

  return (
    <div className="w-full bg-accent/10 border-b border-white/5 overflow-hidden py-2 relative z-20 mt-20">
      <div className="flex container mx-auto items-center gap-6">
        <span className="shrink-0 ml-2 bg-accent text-black text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
          Trending
        </span>

        <div className="flex-1 overflow-hidden relative group">
          <motion.div
            className="flex gap-16 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 30,
            }}
          >
            {[...displayPosts, ...displayPosts].map((post, i) => (
              <Link
                key={i}
                href={
                  post.slug === "welcome"
                    ? "#recent-writing"
                    : `/blog/${post.slug}`
                }
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-3 group/link"
              >
                <span>{post.title}</span>
                <span className="text-accent text-xs font-medium opacity-0 group-hover/link:opacity-100 transition-opacity">
                  Read Story &rarr;
                </span>
              </Link>
            ))}
          </motion.div>

          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
