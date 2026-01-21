"use client";

import { User } from "lucide-react";

interface AuthorSettingsProps {
  formData: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export const AuthorSettings = ({
  formData,
  handleChange,
}: AuthorSettingsProps) => {
  return (
    <div className="space-y-6 pt-6 border-t border-white/5 mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md bg-accent/10 border border-accent/20">
          <User size={16} className="text-accent" />
        </div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Author Details
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400">Job Title</label>
          <input
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Senior Editor"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400">
            Qualification
          </label>
          <input
            name="qualification"
            type="text"
            value={formData.qualification}
            onChange={handleChange}
            placeholder="e.g. PhD in Physics"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-zinc-400">
            Current Occupation
          </label>
          <input
            name="occupation"
            type="text"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="e.g. Freelance Science Writer"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div className="space-y-1 md:col-span-2 pt-4">
          <label className="text-xs font-medium text-zinc-400 flex justify-between items-center">
            <span>Article Signature</span>
            <span className="text-[10px] text-accent/60 italic lowercase">
              This appears at the end of every article you write.
            </span>
          </label>
          <textarea
            name="articleSignature"
            rows={3}
            value={formData.articleSignature || ""}
            onChange={handleChange}
            placeholder="e.g. John Doe is an editor at KnowledgeLog specializing in..."
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-all text-sm leading-relaxed"
          ></textarea>
        </div>
      </div>
    </div>
  );
};
