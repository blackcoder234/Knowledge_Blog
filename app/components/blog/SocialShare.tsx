"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/context/ToastContext";
import { useSession } from "next-auth/react";
import { Bookmark, Heart, Share2 } from "lucide-react";

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
  const { data: session } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const { showToast } = useToast();

  // Check initial status
  useEffect(() => {
    if (session?.user) {
      // Authenticated user: Check DB status
      fetch("/api/user/interactions?type=ids")
        .then((res) => {
          if (res.ok) return res.json();
          return { liked: [], bookmarked: [] };
        })
        .then((data) => {
          if (data.liked?.includes(postId)) setHasLiked(true);
          if (data.bookmarked?.includes(postId)) setIsBookmarked(true);
        })
        .catch((err) => console.error(err));
    } else {
      // Guest: Check localStorage
      const localLikes = JSON.parse(
        localStorage.getItem("guest_likes") || "[]",
      );
      if (localLikes.includes(postId)) setHasLiked(true);
    }
  }, [postId, session]);

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
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic UI update
    const previousLikes = likes;
    const previousHasLiked = hasLiked;

    setLikes((prev) => (hasLiked ? prev - 1 : prev + 1));
    setHasLiked(!hasLiked);

    try {
      const action = hasLiked ? "unlike" : "like"; // Based on PREVIOUS state (if previously liked, now unliking)
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error("Failed to like");

      const data = await res.json();

      // Sync with server source of truth for count
      setLikes(data.likes);

      // Handle Guest Persistence
      if (!session) {
        setHasLiked(!previousHasLiked); // Keep UI state we just toggled
        const localLikes = JSON.parse(
          localStorage.getItem("guest_likes") || "[]",
        );
        if (!previousHasLiked) {
          // Just liked
          if (!localLikes.includes(postId)) {
            localLikes.push(postId);
            localStorage.setItem("guest_likes", JSON.stringify(localLikes));
          }
        } else {
          // Just unliked
          const filtered = localLikes.filter((id: string) => id !== postId);
          localStorage.setItem("guest_likes", JSON.stringify(filtered));
        }
      } else {
        // Logged in user sync
        setHasLiked(data.hasLiked);
      }

      if (!previousHasLiked) {
        showToast("Thanks for the love! ❤️", "success");
      } else {
        showToast("Unliked 😢", "info");
      }
    } catch (error) {
      // Revert on error
      setLikes(previousLikes);
      setHasLiked(previousHasLiked);
      showToast("Something went wrong.", "error");
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!session) {
      showToast("Please login to bookmark", "error");
      return;
    }
    if (isBookmarking) return;
    setIsBookmarking(true);

    // Optimistic
    const previousState = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      const res = await fetch(`/api/posts/${postId}/bookmark`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to bookmark");
      const data = await res.json();
      setIsBookmarked(data.isBookmarked);
      showToast(data.message, "success");
    } catch (error) {
      setIsBookmarked(previousState);
      showToast("Failed to bookmark", "error");
    } finally {
      setIsBookmarking(false);
    }
  };

  if (layout === "horizontal") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`group flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all ${
            hasLiked
              ? "bg-accent/10 text-accent border-accent"
              : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:border-white/30"
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-transform group-active:scale-125 ${
              hasLiked ? "fill-current" : ""
            }`}
          />
          <span className="font-bold text-sm">{likes}</span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`group flex items-center justify-center w-10 h-10 rounded-full border transition-all ${
            isBookmarked
              ? "bg-purple-500/10 border-purple-500 text-purple-500"
              : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:border-white/30"
          }`}
          title="Bookmark"
        >
          <Bookmark
            className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
          />
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
          <Share2 className="w-4 h-4" />
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
        <div className="flex gap-2">
          <button
            onClick={handleBookmark}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
              isBookmarked
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white"
            }`}
            title="Bookmark"
          >
            <Bookmark
              className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
            />
          </button>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              hasLiked
                ? "bg-accent text-black scale-95"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`} />
            <span className="font-bold">{likes}</span>
          </button>
        </div>
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
          <Share2 className="w-4 h-4" />
          Copy Link
        </Button>
      </div>
    </div>
  );
};
