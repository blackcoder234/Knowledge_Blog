"use client";

import Link from "next/link";
import { FileText, Sparkles, Edit3 } from "lucide-react";

interface DraftsTabProps {
  drafts: any[];
  onInspectReview: (postId: string) => void;
  onRegenerateImage: (postId: string, title?: string) => Promise<void>;
  regeneratingImageId: string | null;
}

export default function DraftsTab({
  drafts,
  onInspectReview,
  onRegenerateImage,
  regeneratingImageId,
}: DraftsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>AI-Assisted Draft Articles</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-white/5">
              {drafts.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Formatted in native TipTap JSON (`contentJson`). Fully editable in KnowledgeLog’s PostEditor.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0A0A0A]">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th className="p-3.5 pl-4">Title & Slug</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Quality Score</th>
              <th className="p-3.5">Reading Time</th>
              <th className="p-3.5 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {drafts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-500">
                  <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <div>No AI-assisted drafts waiting in the queue.</div>
                  <div className="text-[11px] text-zinc-600 mt-1">
                    Convert an opportunity to generate your first draft.
                  </div>
                </td>
              </tr>
            ) : (
              drafts.map((d) => (
                <tr key={d._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 pl-4">
                    <div className="flex items-center gap-3">
                      {d.image ? (
                        <img
                          src={d.image}
                          alt={d.title}
                          className="w-12 h-8 rounded object-cover border border-white/10 shrink-0 bg-zinc-800"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-600 text-[9px] shrink-0">
                          Cover
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white line-clamp-1">{d.title}</div>
                        <div className="text-[11px] text-zinc-500">/blog/{d.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-zinc-400">{d.category?.name || "General"}</td>
                  <td className="p-3.5">
                    {d.qualityScore !== undefined ? (
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          d.qualityScore >= 80
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {d.qualityScore}/100
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">Unreviewed</span>
                    )}
                  </td>
                  <td className="p-3.5 text-zinc-300 font-medium">{d.readTime || "5 min read"}</td>
                  <td className="p-3.5 pr-4 text-right space-x-2">
                    <button
                      onClick={() => onRegenerateImage(d._id, d.title)}
                      disabled={regeneratingImageId === d._id}
                      className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-white/10 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Generate or Regenerate AI Cover Image"
                    >
                      <Sparkles
                        className={`w-3 h-3 text-accent ${
                          regeneratingImageId === d._id ? "animate-spin" : ""
                        }`}
                      />
                      <span className="hidden sm:inline">Cover</span>
                    </button>
                    <button
                      onClick={() => onInspectReview(d._id)}
                      className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md border border-white/10 cursor-pointer"
                    >
                      Audit Scorecard
                    </button>
                    <Link
                      href={`/admin/posts/edit/${d._id}`}
                      className="px-3 py-1 text-xs bg-accent hover:bg-accent/90 text-black font-semibold rounded-md inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Edit</span>
                      <Edit3 className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

