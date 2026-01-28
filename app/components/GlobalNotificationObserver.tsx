"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { X, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NotificationSetting {
  active: boolean;
  message: string;
  type: "info" | "warning" | "success" | "error";
  id: string; // Unique ID to track dismissal
}

export function GlobalNotificationObserver() {
  // Poll for notifications every 60 seconds
  const { data } = useSWR("/api/settings/notification", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  const [isVisible, setIsVisible] = useState(false);
  const [notification, setNotification] = useState<NotificationSetting | null>(
    null,
  );

  useEffect(() => {
    if (data && data.active) {
      // Check if user has already dismissed this specific notification
      const dismissedId = sessionStorage.getItem("dismissed_notification_id");
      if (dismissedId !== data.id) {
        setNotification(data);
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [data]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (notification?.id) {
      sessionStorage.setItem("dismissed_notification_id", notification.id);
    }
  };

  if (!isVisible || !notification) return null;

  const bgColors = {
    info: "bg-blue-600",
    warning: "bg-amber-500",
    success: "bg-emerald-600",
    error: "bg-rose-600",
  };

  const icons = {
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />,
    success: <CheckCircle size={18} />,
    error: <AlertTriangle size={18} />,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`${bgColors[notification.type] || "bg-blue-600"} text-white relative z-50 overflow-hidden`}
      >
        <div className="container mx-auto px-4 py-3 flex items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icons[notification.type] || <Info size={18} />}
            <span className="font-medium text-sm md:text-base">
              {notification.message}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
