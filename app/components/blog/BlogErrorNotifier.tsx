"use client";

import { useEffect } from "react";
import { useToast } from "@/app/context/ToastContext";

export default function BlogErrorNotifier({ error }: { error?: string }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error, showToast]);

  return null;
}
