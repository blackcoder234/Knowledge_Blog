"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ClientTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Debounce or just fire? Fire once per navigation.
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    // Send hit to API
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: url,
        referrer: document.referrer,
      }),
    }).catch((err) => console.error("Tracking error:", err));
  }, [pathname, searchParams]);

  return null;
}
