"use client";

import { useEffect } from "react";

export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed_${slug}`;
    const hasViewed = sessionStorage.getItem(key);

    if (!hasViewed) {
      // Mark as viewed immediately to prevent double-firing
      sessionStorage.setItem(key, "true");

      fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch((err) => console.error("Failed to track view", err));
    }
  }, [slug]);

  return null; // Invisible component
}
