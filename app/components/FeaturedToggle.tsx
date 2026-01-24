"use client";

import { useState } from "react";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";

interface FeaturedToggleProps {
  id: string;
  initialFeatured: boolean;
}

export const FeaturedToggle = ({
  id,
  initialFeatured,
}: FeaturedToggleProps) => {
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const toggleFeatured = async () => {
    setIsLoading(true);
    // Optimistic Update
    const prevFeatured = isFeatured;
    setIsFeatured(!isFeatured);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !prevFeatured }),
      });

      if (!res.ok) throw new Error("Failed to update featured status");

      showToast(
        !prevFeatured ? "Post marked as Featured ⭐" : "Removed from Featured",
        "success",
      );
      router.refresh();
    } catch (error) {
      // Revert
      setIsFeatured(prevFeatured);
      showToast("Failed to update featured status", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFeatured}
      disabled={isLoading}
      title={isFeatured ? "Unfeature Post" : "Feature Post"}
      className={`p-1.5 rounded-lg transition-all border ${
        isFeatured
          ? "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
          : "bg-zinc-800/50 border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10"
      } ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};
