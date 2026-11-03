"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Layers,
  Filter,
} from "lucide-react";

interface OpportunitiesTabProps {
  opportunities: any[];
  onSynthesize: () => Promise<void>;
  onConvert: (id: string) => Promise<void>;
  isPending: boolean;
  convertingId: string | null;
  conversionSuccess: any;
}

export default function OpportunitiesTab({
  opportunities,
  onSynthesize,
  onConvert,
  isPending,
  convertingId,
  conversionSuccess,
}: OpportunitiesTabProps) {
  const [filter, setFilter] = useState("all");

  const filtered = opportunities.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Ranked Content Opportunities</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/20">
              {filtered.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Synthesized from audience interest signals, evergreen momentum, and verified research feeds.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-lg border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1.5" />
            {["all", "new", "converted"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2.5 py-1 rounded capitalize transition-all cursor-pointer ${
                  filter === st
                    ? "bg-zinc-800 text-white font-medium shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={onSynthesize}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent/90 text-black text-xs font-semibold rounded-lg transition-all shadow-md shadow-accent/10 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>{isPending ? "Synthesizing..." : "Synthesize Ideas"}</span>
          </button>
        </div>
      </div>

      {/* Conversion Success Alert */}
      {conversionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Draft article generated successfully! Initial Quality Gate Score:{" "}
              <strong>{conversionSuccess.qualityScore}/100</strong>.
            </span>
          </div>
          <Link
            href={`/admin/posts/edit/${conversionSuccess.postId}`}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <span>Open in PostEditor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Opportunities List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-zinc-950/40">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No content opportunities found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Click &ldquo;Synthesize Ideas&rdquo; to analyze your audience trends and discover high-signal article topics.
          </p>
          <button
            onClick={onSynthesize}
            disabled={isPending}
            className="px-4 py-2 bg-accent text-black text-xs font-semibold rounded-lg hover:bg-accent/90 transition-all cursor-pointer"
          >
            Synthesize Ideas Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((opp) => (
            <div
              key={opp._id}
              className="p-5 rounded-xl border border-white/10 bg-[#0A0A0A] hover:border-white/20 transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                      {opp.category?.name || "Technology"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-white/5">
                      {opp.suggestedFormat || "deep-dive"}
                    </span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {opp.estimatedReadTime || "6 min read"}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Confidence: {opp.confidenceScore || 88}%
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white hover:text-accent transition-colors">
                    {opp.proposedTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-accent flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{opp.audienceInterestScore}/100</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">Audience Signal</div>
                  </div>

                  {opp.status === "converted" ? (
                    <Link
                      href={`/admin/posts/edit/${opp.convertedPostId?._id || opp.convertedPostId}`}
                      className="px-3.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Draft</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => onConvert(opp._id)}
                      disabled={convertingId === opp._id}
                      className="px-3.5 py-1.5 text-xs bg-accent hover:bg-accent/90 text-black font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${convertingId === opp._id ? "animate-spin" : ""}`} />
                      <span>{convertingId === opp._id ? "Drafting..." : "Generate Draft"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Angle & Why It Matters */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 space-y-1 text-xs">
                <div className="text-zinc-300">
                  <strong className="text-zinc-200">Angle: </strong>
                  {opp.whyItMattersNow}
                </div>
                {opp.audienceInterestSignals?.explanation && (
                  <div className="text-[11px] text-zinc-400">
                    <strong className="text-zinc-500">Signal: </strong>
                    {opp.audienceInterestSignals.explanation}
                  </div>
                )}
              </div>

              {/* Primary Sources & Tags */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs pt-1 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Tags:</span>
                  {(opp.tags || []).map((t: string) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-400 border border-white/5"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {opp.primarySources?.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Source: {opp.primarySources[0].publisher}</span>
                    <a
                      href={opp.primarySources[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline inline-flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

