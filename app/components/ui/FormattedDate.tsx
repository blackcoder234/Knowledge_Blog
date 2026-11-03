"use client";

import { useEffect, useState } from "react";

interface FormattedDateProps {
  date: string | Date;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

export function FormattedDate({
  date,
  options = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  className = "",
}: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    if (!date) return;
    const d = new Date(date);
    // Defer state update to next tick to comply with React 19 effect purity rules
    const timer = setTimeout(() => {
      setFormatted(d.toLocaleString("en-US", options));
    }, 0);
    return () => clearTimeout(timer);
  }, [date, options]);

  // Return a placeholder or empty string during SSR to avoid hydration mismatch,
  // or return the server-rendered date if you want (but that causes mismatch).
  // Returning empty initially and filling it in is safest for "UTC vs Local" diffs.
  if (!formatted) {
    return <span className={`opacity-0 ${className}`}>--</span>;
  }

  return <span className={className}>{formatted}</span>;
}
