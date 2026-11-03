"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ClientTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let visitorId: string | undefined;
    try {
      visitorId = localStorage.getItem("visitor_id") || undefined;
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("visitor_id", visitorId);
      }
    } catch (error) {
      console.error("Could not persist analytics visitor ID:", error);
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer,
        visitorId,
      }),
    }).catch((err) => console.error("Tracking error:", err));
  }, [pathname]);

  return null;
}
