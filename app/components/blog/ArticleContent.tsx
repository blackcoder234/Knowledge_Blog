"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { JsonRenderer } from "./JsonRenderer";
import { HtmlRenderer } from "./HtmlRenderer";

interface ArticleContentProps {
  content: string; // HTML Fallback
  contentJson?: any; // Preferred
}

export const ArticleContent = ({
  content,
  contentJson,
}: ArticleContentProps) => {
  /* ---------------------------------------------------------------------------
   * TYPOGRAPHY SYSTEM (Medium-Style Editorial Theme)
   * Now handled centrally in globals.css via .prose-article
   * --------------------------------------------------------------------------- */
  const PROSE_STYLES = "prose-article";

  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const handleImageClick = (src: string) => {
    setZoomImage(src);
  };

  /* --------------------------------------------------------------------------------
   * UNIFIED RENDER
   * -------------------------------------------------------------------------------- */
  return (
    <>
      {contentJson ? (
        <div className={PROSE_STYLES}>
          <JsonRenderer content={contentJson} onImageClick={handleImageClick} />
        </div>
      ) : (
        <HtmlRenderer
          content={content}
          className={PROSE_STYLES}
          onImageClick={handleImageClick}
        />
      )}

      {/* Shared Image Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <button
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setZoomImage(null)}
            >
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomImage ?? undefined}
              alt="Zoomed"
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
