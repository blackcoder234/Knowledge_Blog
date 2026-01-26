"use client";

import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface EditorSEOProps {
  formData: any;
  handleChange: (e: any) => void;
  openMediaModal: (field: "image" | "ogImage" | "content") => void;
}

export function EditorSEO({
  formData,
  handleChange,
  openMediaModal,
}: EditorSEOProps) {
  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-8 space-y-6 shadow-2xl shadow-cyan-900/10 hover:border-cyan-500/30 transition-all duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Search size={18} className="text-cyan-500" /> SEO Configuration
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            SEO Title
          </label>
          <input
            type="text"
            name="seoTitle"
            value={formData.seoTitle}
            onChange={handleChange}
            placeholder={formData.title || "Default: Post Title"}
            className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Canonical URL
          </label>
          <input
            type="text"
            name="canonicalUrl"
            value={formData.canonicalUrl}
            onChange={handleChange}
            placeholder={
              formData.slug
                ? `https://knowledgelog.com/blog/${formData.slug}`
                : "https://..."
            }
            className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          SEO Description
        </label>
        <textarea
          name="seoDescription"
          value={formData.seoDescription}
          onChange={handleChange}
          rows={2}
          placeholder={formData.excerpt || "Default: Post Excerpt"}
          className="w-full bg-[#121212] border border-white/10 rounded-lg p-4 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            OpenGraph Image (Social Card)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="ogImage"
              value={formData.ogImage}
              onChange={handleChange}
              placeholder={formData.image || "Default: Featured Image"}
              className="flex-1 bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => openMediaModal("ogImage")}
              className="border-white/10 text-zinc-300"
            >
              Select
            </Button>
          </div>
        </div>

        <div className="space-y-2 pt-6">
          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <input
              type="checkbox"
              id="noindex"
              name="noindex"
              checked={formData.noindex}
              onChange={handleChange}
              className="h-4 w-4 bg-[#121212] border-red-500/50 rounded text-red-500 focus:ring-offset-0 focus:ring-0"
            />
            <div>
              <label
                htmlFor="noindex"
                className="block text-sm font-bold text-red-400"
              >
                NoIndex (Hide from Google)
              </label>
              <p className="text-[10px] text-red-400/70">
                Enable this to prevent search engines from indexing this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
