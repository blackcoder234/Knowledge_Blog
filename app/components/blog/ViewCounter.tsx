"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function ViewCounter({ slug }: { slug: string }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // 1. Wait for session to load
    if (status === "loading") return;

    // 2. Ignore views from staff members (Admins, Editors, Authors)
    const userRole = (session?.user as any)?.role;
    if (["super_admin", "admin", "editor", "author"].includes(userRole)) {
      return;
    }

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
  }, [slug, status, session]);

  return null; // Invisible component
}
