"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/app/components/ui/Button";

/**
 * ConfirmDialog - "Deep Glass" & "Scroll-Through" Edition
 *
 * Features:
 * - NO scroll-locking (Fixes all layout shift issues 100%).
 * - User can scroll background, but overlay captures clicks.
 * - Premium "Deep Glass" aesthetic.
 * - 60fps Native-like animation curve.
 */

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  variant?: "danger" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = "danger",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Escape Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  // -- STYLING CONFIG --
  const getStyleConfig = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400",
          btnClass:
            "bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-900/40 border border-red-500/20",
          ringColor: "ring-red-500/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/20",
          iconColor: "text-amber-400",
          btnClass:
            "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-900/40 border border-amber-400/20",
          ringColor: "ring-amber-500/20",
        };
      case "info":
      default:
        return {
          iconBg: "bg-blue-500/20",
          iconColor: "text-blue-400",
          btnClass:
            "bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-500/20",
          ringColor: "ring-blue-500/20",
        };
    }
  };

  const style = getStyleConfig();
  const Icon =
    variant === "danger"
      ? Trash2
      : variant === "warning"
        ? AlertTriangle
        : Info;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* 1. Backdrop layer - Smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* 2. Dialog Container - Snappy Scale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="relative w-full max-w-[400px] will-change-transform" // FORCE GPU
          >
            {/* 
               THE GLASS CARD 
               - Optimized for FPS: backdrop-blur-lg instead of xl
            */}
            <div
              className={`
              overflow-hidden rounded-2xl 
              bg-zinc-900/85 backdrop-blur-lg 
              border border-white/10 
              shadow-2xl 
              ring-1 ${style.ringColor}
            `}
            >
              {/* Top ambient lighting gradient */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              <div className="relative p-6 pt-8 text-center">
                {/* Icon Wrapper with Glow */}
                <div
                  className={`
                  mx-auto mb-5 flex h-14 w-14 items-center justify-center 
                  rounded-full ${style.iconBg} 
                  shadow-[0_0_20px_-5px_currentColor] ${style.iconColor}
                  border border-white/5
                `}
                >
                  <Icon className="h-7 w-7" strokeWidth={2} />
                </div>

                {/* Typography */}
                <h2 className="text-lg font-bold tracking-tight text-white/95 drop-shadow-sm">
                  {title}
                </h2>
                {description && (
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                    {description}
                  </p>
                )}
              </div>

              {/* Footer / Actions */}
              <div className="grid grid-cols-2 gap-3 p-6 pt-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full border border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  {cancelText}
                </Button>

                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full ${style.btnClass}`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Processing</span>
                    </div>
                  ) : (
                    confirmText
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
