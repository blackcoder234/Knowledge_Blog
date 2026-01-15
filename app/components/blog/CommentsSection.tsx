"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    image?: string;
    role: "user" | "admin";
  };
}

export const CommentsSection = ({ postId }: { postId: string }) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, postId }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments([comment, ...comments]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-white/5 pt-10 max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-white mb-8">
        Comments{" "}
        <span className="text-zinc-500 text-lg font-normal">
          ({comments.length})
        </span>
      </h3>

      {/* Comment Form */}
      <div className="mb-12">
        {session ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white/5 rounded-xl p-6 border border-white/5"
          >
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white text-xs">
                    {session.user?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full bg-transparent border-0 text-white placeholder:text-zinc-500 focus:ring-0 resize-none h-24 p-0 text-base"
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
                  <span className="text-xs text-zinc-500">
                    Be respectful and constructive.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-white/5 rounded-xl p-8 text-center border border-white/5">
            <h4 className="text-lg font-bold text-white mb-2">
              Join the conversation
            </h4>
            <p className="text-zinc-400 mb-6">
              Sign in to share your thoughts and interact with other readers.
            </p>
            <div className="flex justify-center gap-4">
              <Link href={`/login?callbackUrl=${pathname}`}>
                <Button variant="primary">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button variant="ghost">Create Account</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center text-zinc-500 py-10">
            Loading comments...
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4 group">
              <div className="h-10 w-10 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden ring-2 ring-white/5">
                {comment.author.image &&
                comment.author.image.startsWith("http") ? (
                  <img
                    src={comment.author.image}
                    alt={comment.author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white text-xs">
                    {comment.author.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">
                    {comment.author.name}
                  </span>
                  {comment.author.role === "admin" && (
                    <span className="bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-accent/20">
                      Admin
                    </span>
                  )}
                  <span className="text-zinc-500 text-xs">
                    •{" "}
                    {new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="text-zinc-300 text-sm leading-relaxed">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-zinc-500 italic">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
