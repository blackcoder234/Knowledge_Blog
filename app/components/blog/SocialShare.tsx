"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/context/ToastContext";

interface SocialShareProps {
  url: string;
  title: string;
  postId: string;
  initialLikes: number;
  layout?: "vertical" | "horizontal";
}

export const SocialShare = ({
  url,
  title,
  postId,
  initialLikes,
  layout = "vertical",
}: SocialShareProps) => {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { showToast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleShare = async (platform: string) => {
    let shareUrl = "";
    const text = encodeURIComponent(`Check out this article: ${title}`);
    const encodedUrl = encodeURIComponent(url);

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const handleLike = async () => {
    if (hasLiked || isLiking) return;
    setIsLiking(true);

    // Optimistic UI update
    setLikes((prev) => prev + 1);
    setHasLiked(true);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like");

      showToast("Thanks for the love!", "success");
    } catch (error) {
      // Revert on error
      setLikes((prev) => prev - 1);
      setHasLiked(false);
      showToast("Something went wrong.", "error");
    } finally {
      setIsLiking(false);
    }
  };

  if (layout === "horizontal") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`group flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all ${
            hasLiked
              ? "bg-accent text-black border-accent"
              : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:border-white/30"
          }`}
        >
          <svg
            className={`w-5 h-5 transition-transform group-active:scale-125 ${
              hasLiked ? "fill-current" : "none"
            }`}
            stroke="currentColor"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            ></path>
          </svg>
          <span className="font-bold text-sm">{likes} Likes</span>
        </button>

        {/* Share Buttons */}
        <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-zinc-400 hover:text-[#1DA1F2]"
          onClick={() => handleShare("twitter")}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
          Tweet
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-zinc-400 hover:text-white"
          onClick={handleCopyLink}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            ></path>
          </svg>
          Copy
        </Button>
      </div>
    );
  }

  // DEFAULT VERTICAL LAYOUT (Sidebar Style)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
        <span className="text-zinc-400 text-sm font-medium">
          Show your support
        </span>
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            hasLiked
              ? "bg-accent text-black scale-95"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <svg
            className={`w-5 h-5 ${hasLiked ? "fill-current" : "none"}`}
            stroke="currentColor"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            ></path>
          </svg>
          <span className="font-bold">{likes}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-white/10 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all text-zinc-400"
          onClick={() => handleShare("twitter")}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
          Twitter
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-white/10 hover:bg-[#0077b5]/20 hover:text-[#0077b5] hover:border-[#0077b5]/50 transition-all text-zinc-400"
          onClick={() => handleShare("linkedin")}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
          </svg>
          LinkedIn
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-white/10 hover:bg-white/10 hover:text-white transition-all text-zinc-400"
          onClick={handleCopyLink}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            ></path>
          </svg>
          Copy Link
        </Button>
      </div>
    </div>
  );
};
