"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This component silently refreshes the page data every X seconds
// Ideally placed in the Admin Layout
export function AdminAutoRefresher({
  interval = 30000,
}: {
  interval?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      // router.refresh() triggers a re-fetch of server components
      // without losing client-side state (like scroll position)
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  return null; // It's invisible
}
