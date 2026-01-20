"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Trash2,
  ExternalLink,
  Check,
  X,
  Clock,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext";
import GlobalLoading from "@/app/loading";

export default function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { showToast } = useToast();

  const fetchComments = async () => {
    try {
      const res = await fetch("/api/admin/comments");
      if (res.ok) {
        const data = await res.json();
        // Ensure status exists (for old records)
        const normalized = data.map((c: any) => ({
          ...c,
          status: c.status || "pending",
        }));
        setComments(normalized);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load comments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== id));
        showToast("Comment deleted", "success");
      } else {
        showToast("Failed to delete", "error");
      }
    } catch (error) {
      showToast("Error deleting comment", "error");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic Update
    setComments((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c)),
    );

    try {
      const res = await fetch("/api/admin/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        showToast(`Marked as ${newStatus}`, "success");
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      showToast("Failed to update status", "error");
      fetchComments(); // Revert
    }
  };

  const filteredComments = comments.filter((c) =>
    filter === "all" ? true : c.status === filter,
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
            <Check size={12} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full border border-red-400/20">
            <X size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full border border-yellow-400/20">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  if (loading) return <GlobalLoading />;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Comments</h1>
          <p className="text-zinc-400">Moderate ongoing discussions.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm text-zinc-300">
          Total: {comments.length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-accent text-zinc-900 font-bold"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {f}{" "}
            {f !== "all" &&
              `(${comments.filter((c) => c.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        {filteredComments.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center text-zinc-500">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>No {filter !== "all" ? filter : ""} comments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-white/5 text-xs uppercase font-bold text-white">
                <tr>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Author</th>
                  <th className="px-6 py-3 w-1/3">Comment</th>
                  <th className="px-6 py-3">Post</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredComments.map((comment) => (
                  <tr
                    key={comment._id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      {getStatusBadge(comment.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 overflow-hidden">
                          {comment.author?.image ? (
                            <img
                              src={comment.author.image}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                              {comment.author?.name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {comment.author?.name || "Unknown"}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {comment.author?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="line-clamp-2 text-zinc-300 pr-4"
                        title={comment.content}
                      >
                        {comment.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {comment.post ? (
                        <Link
                          href={`/blog/${comment.post.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 hover:text-accent transition-colors"
                        >
                          <span className="truncate max-w-[150px]">
                            {comment.post.title}
                          </span>
                          <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <span className="text-red-500 italic">
                          Post Deleted
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-zinc-400">
                        {comment.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(comment._id, "approved")
                              }
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 hover:text-green-400 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(comment._id, "rejected")
                              }
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {comment.status === "rejected" && (
                          <button
                            onClick={() =>
                              handleStatusChange(comment._id, "approved")
                            }
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Restore (Approve)"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        {comment.status === "approved" && (
                          <button
                            onClick={() =>
                              handleStatusChange(comment._id, "rejected")
                            }
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <span className="w-px h-4 bg-white/10 mx-1"></span>
                        <button
                          onClick={() => handleDelete(comment._id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
