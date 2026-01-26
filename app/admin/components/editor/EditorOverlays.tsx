"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileText, Save, Minimize2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface RestoreDraftPromptProps {
  show: boolean;
  onDiscard: () => void;
  onRestore: () => void;
}

export function RestoreDraftPrompt({
  show,
  onDiscard,
  onRestore,
}: RestoreDraftPromptProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="mb-8 overflow-hidden"
        >
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-cyan-200">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <FileText size={20} className="text-cyan-400" />
              </div>
              <div className="text-sm">
                <p className="font-bold">Unsaved changes found</p>
                <p className="opacity-80">
                  We found a newer version of this post on your device.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDiscard}
                className="text-zinc-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Discard Local
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={onRestore}
                className="bg-cyan-500 text-black hover:bg-cyan-400"
              >
                Restore Version
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ZenModeOverlayProps {
  isZenMode: boolean;
  children: React.ReactNode;
}

export function ZenModeOverlay({ isZenMode, children }: ZenModeOverlayProps) {
  if (!isZenMode) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col animate-in fade-in duration-300">
      <div className="flex-1 overflow-hidden w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
