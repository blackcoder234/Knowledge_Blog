"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit3,
  ExternalLink,
} from "lucide-react";

interface QualityGateTabProps {
  selectedReview: any;
  selectedReviewPost: any;
  onReaudit: (postId: string) => Promise<void>;
  onPublish: (postId: string) => Promise<void>;
  onRegenerateImage: (postId: string, title?: string) => Promise<void>;
  onNavigateToDrafts: () => void;
  reviewLoading: boolean;
  regeneratingImageId: string | null;
}

export default function QualityGateTab({
  selectedReview,
  selectedReviewPost,
  onReaudit,
  onPublish,
  onRegenerateImage,
  onNavigateToDrafts,
  reviewLoading,
  regeneratingImageId,
}: QualityGateTabProps) {
  if (!selectedReview) {
    return (
      <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-zinc-950/40 space-y-3">
        <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto" />
        <h3 className="text-sm font-semibold text-zinc-300">
          Select a draft to view its Quality Gate Scorecard
        </h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Head over to the &ldquo;Drafts&rdquo; tab and click &ldquo;Audit Scorecard&rdquo; on any post.
        </p>
        <button
          onClick={onNavigateToDrafts}
          className="px-4 py-2 bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          Go to Drafts
        </button>
      </div>
    );
  }

  const isPassed = selectedReview.passed;
  const isHighRisk = selectedReview.highRiskTopic;

  return (
    <div className="space-y-6 bg-[#0A0A0A] p-6 rounded-2xl border border-white/10">
      {/* Scorecard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-2xl font-black ${
                selectedReview.overallScore >= 80 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {selectedReview.overallScore}/100
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isPassed
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {isPassed ? "Passed Gate" : "Review Needed"}
            </span>

            {isHighRisk && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>High-Risk Topic</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Audited on {new Date(selectedReview.reviewedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onReaudit(selectedReview.postId)}
            disabled={reviewLoading}
            className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reviewLoading ? "animate-spin" : ""}`} />
            <span>Re-run Audit</span>
          </button>

          <button
            onClick={() => onPublish(selectedReview.postId)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish Post Live</span>
          </button>
        </div>
      </div>

      {/* Post Details & Cover Image Banner */}
      {selectedReviewPost && (
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {selectedReviewPost.image ? (
              <img
                src={selectedReviewPost.image}
                alt={selectedReviewPost.title}
                className="w-24 h-14 rounded-lg object-cover border border-white/10 shadow-md shrink-0 bg-zinc-800"
              />
            ) : (
              <div className="w-24 h-14 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 text-[10px] shrink-0">
                No Image
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{selectedReviewPost.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-zinc-400 font-mono">
                  /blog/{selectedReviewPost.slug}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-accent font-medium">
                  {selectedReviewPost.readTime || "5 min read"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onRegenerateImage(selectedReviewPost._id, selectedReviewPost.title)}
              disabled={regeneratingImageId === selectedReviewPost._id}
              className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles
                className={`w-3.5 h-3.5 text-accent ${
                  regeneratingImageId === selectedReviewPost._id ? "animate-spin" : ""
                }`}
              />
              <span>
                {regeneratingImageId === selectedReviewPost._id
                  ? "Generating..."
                  : "Regenerate AI Cover"}
              </span>
            </button>
            <Link
              href={`/admin/posts/edit/${selectedReviewPost._id}`}
              className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open in Editor</span>
            </Link>
          </div>
        </div>
      )}

      {/* Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Source Freshness</span>
            <span className="font-bold text-amber-400">
              {selectedReview.checks?.sourceFreshness?.score ?? "—"}/100
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            {selectedReview.checks?.sourceFreshness
              ? `${selectedReview.checks.sourceFreshness.staleCount} stale; ${selectedReview.checks.sourceFreshness.unknownCount} publication date(s) unknown.`
              : "Freshness data is not available for this review."}
          </p>
        </div>

        {/* 1. Source Coverage */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Source Coverage</span>
            <span className="font-bold text-emerald-400">
              {selectedReview.checks?.sourceCoverage?.score}/100
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            {selectedReview.checks?.sourceCoverage?.details}
          </p>
        </div>

        {/* 2. Unsupported Certainty */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Intellectual Humility & Tone</span>
            <span
              className={`font-bold ${
                selectedReview.checks?.unsupportedClaims?.detected
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {selectedReview.checks?.unsupportedClaims?.detected ? "Flagged" : "Clean"}
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            {selectedReview.checks?.unsupportedClaims?.detected
              ? `Phrasing: ${selectedReview.checks?.unsupportedClaims?.claims?.join(", ")}`
              : "Tone adheres to nuanced exposition without dogmatic certainty."}
          </p>
        </div>

        {/* 3. Duplicate Cannibalization */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Duplicate Cannibalization</span>
            <span className="font-bold text-emerald-400">
              {selectedReview.checks?.duplicateRisk?.score}% Risk
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            {selectedReview.checks?.duplicateRisk?.score > 40
              ? `Overlaps with: ${selectedReview.checks?.duplicateRisk?.conflictingPostTitle}`
              : "No significant content cannibalization against existing published articles."}
          </p>
        </div>

        {/* 4. Readability */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Flesch Readability</span>
            <span className="font-bold text-accent">
              {selectedReview.checks?.readabilityScore?.fleschScore}/100
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            Grade Level: {selectedReview.checks?.readabilityScore?.gradeLevel}
          </p>
        </div>

        {/* 5. Source Overlap / Citation Density */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">
              Source Overlap &amp; Citation Density
            </span>
            <span className="font-bold text-blue-400">
              {selectedReview.checks?.sourceOverlapRisk?.score ||
                selectedReview.checks?.plagiarismRisk?.score ||
                0}
              %
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            {selectedReview.checks?.sourceOverlapRisk?.details ||
              "Primary source references integrated with explicit attribution."}
          </p>
        </div>
      </div>

      {/* Claims Breakdown Table */}
      {selectedReview.claimsBreakdown?.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Claim-Level Factual Attribution
          </h4>
          <div className="rounded-xl border border-white/10 overflow-hidden bg-zinc-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 text-[10px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-3 pl-4">Claim / Assertion</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Source URL</th>
                  <th className="p-3 pr-4 text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[11px]">
                {selectedReview.claimsBreakdown.map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="p-3 pl-4 text-zinc-200 font-medium">{c.claim}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          c.status === "supported"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : c.status === "opinion"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400">
                      {c.sourceUrl ? (
                        <a
                          href={c.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <span className="truncate max-w-[200px]">{c.sourceUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-zinc-600">None</span>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <span
                        className={`uppercase text-[10px] font-bold ${
                          c.riskLevel === "high"
                            ? "text-rose-400"
                            : c.riskLevel === "medium"
                            ? "text-amber-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {c.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations Box */}
      {selectedReview.recommendations?.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Editorial Recommendations Before Publishing</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/80">
            {selectedReview.recommendations.map((rec: string, i: number) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
