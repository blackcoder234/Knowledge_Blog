"use client";

import { useState } from "react";
import {
  Rss,
  Database,
  RefreshCw,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ResearchTabProps {
  sources: any[];
  onSyncFeeds: () => Promise<void>;
  onSeedSources: () => Promise<void>;
  onAddSource: (src: { name: string; url: string; publisher: string }) => Promise<void>;
  isPending: boolean;
}

export default function ResearchTab({
  sources,
  onSyncFeeds,
  onSeedSources,
  onAddSource,
  isPending,
}: ResearchTabProps) {
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    publisher: "",
  });
  const [addError, setAddError] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    try {
      await onAddSource(newSource);
      setShowAddSource(false);
      setNewSource({ name: "", url: "", publisher: "" });
    } catch (err: any) {
      setAddError(err.message || "Failed to add source");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Approved Research Feeds</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {sources.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Compliant internet sources queried for scientific, academic, and technical breakthroughs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onSeedSources}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
            title="Loads arXiv CS, Nature News, MIT Tech Review, and Hacker News"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Seed Top Feeds</span>
          </button>
          <button
            onClick={onSyncFeeds}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Sync Feeds</span>
          </button>
          <button
            onClick={() => setShowAddSource(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-black text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source</span>
          </button>
        </div>
      </div>

      {/* Sources Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0A0A0A]">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th className="p-3.5 pl-4">Feed / Publisher</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Trust Tier</th>
              <th className="p-3.5">Items Cached</th>
              <th className="p-3.5">Last Synced</th>
              <th className="p-3.5 pr-4 text-right">Approval Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sources.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  No approved research sources configured. Click &ldquo;Seed Top Feeds&rdquo; to populate initial verified sources.
                </td>
              </tr>
            ) : (
              sources.map((src) => (
                <tr key={src._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 pl-4">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{src.name}</span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-accent"
                        title={src.url}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-[11px] text-zinc-500">{src.publisher}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {src.sourceType}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                      {src.trustTier || "verified"}
                    </span>
                  </td>
                  <td className="p-3.5 text-zinc-300 font-mono">
                    {src.itemCount || 0} items
                  </td>
                  <td className="p-3.5 text-zinc-400 text-[11px]">
                    {src.lastFetchedAt
                      ? new Date(src.lastFetchedAt).toLocaleTimeString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </td>
                  <td className="p-3.5 pr-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{src.approvalStatus || "approved"}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Source Modal */}
      {showAddSource && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-white">Add Approved Research Feed</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Feeds must be valid HTTPS endpoints. Private IP addresses and loopback schemes are blocked.
            </p>

            {addError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Feed Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. arXiv Computer Science"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Feed URL (HTTPS Only)</label>
                <input
                  type="url"
                  required
                  placeholder="https://export.arxiv.org/rss/cs"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Publisher</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cornell University"
                  value={newSource.publisher}
                  onChange={(e) => setNewSource({ ...newSource, publisher: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSource(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 cursor-pointer disabled:opacity-50"
                >
                  Register Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

