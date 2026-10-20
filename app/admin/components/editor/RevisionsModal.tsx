import React, { useEffect, useState } from "react";
import { Clock, RotateCcw, Loader2, User } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface PostRevision {
  _id: string;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  excerpt: string;
  content: string;
  contentJson: any;
  tags: string[];
  image: string;
}

interface RevisionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onRestore: (revision: PostRevision) => void;
}

export function RevisionsModal({
  isOpen,
  onClose,
  postId,
  onRestore,
}: RevisionsModalProps) {
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      fetch(`/api/posts/${postId}/revisions`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load revisions");
          return res.json();
        })
        .then((data) => {
          setRevisions(data);
        })
        .catch((err) => {
          console.error(err);
          setError("Could not load revision history");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, postId]);

  const handleRestoreClick = (revision: PostRevision) => {
    onRestore(revision);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Clock className="text-cyan-400" size={18} />
            <h3 className="font-bold text-white">Version History</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs">Loading history...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400 text-sm">{error}</div>
          ) : revisions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No revision history available yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {revisions.map((rev) => (
                <div
                  key={rev._id}
                  className="p-4 hover:bg-white/5 transition-colors group flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span>{new Date(rev.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <User size={12} />
                      <span>{rev.author?.name || "Unknown Author"}</span>
                    </div>
                    {rev.title && (
                      <div className="text-xs text-zinc-500 mt-1 truncate max-w-[200px]">
                        {rev.title}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRestoreClick(rev)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-cyan-500/20"
                  >
                    <RotateCcw size={14} className="mr-2" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-zinc-900 border-t border-white/10 text-[10px] text-zinc-500 text-center">
          Restoring a version updates the editor but does not publish
          immediately.
        </div>
      </div>
    </div>
  );
}
