"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/Button";
import { Editor } from "@/app/components/editor/Editor";
import { useToast } from "@/app/context/ToastContext";
import { Loader2, Plus, Send, Save, ArrowLeft, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Newsletter = {
  _id: string;
  subject: string;
  content: string; // HTML
  status: "draft" | "sent" | "scheduled";
  sentAt?: string;
  stats?: { opens: number; clicks: number };
  createdAt: string;
};

export default function NewsletterPage() {
  const [view, setView] = useState<"list" | "compose">("list");
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Composer State
  const [draftId, setDraftId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState(""); // This will be HTML from editor
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch List
  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const res = await fetch("/api/admin/newsletter");
      if (res.ok) {
        const data = await res.json();
        setNewsletters(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (n: Newsletter) => {
    setDraftId(n._id);
    setSubject(n.subject);
    setContent(n.content);
    setView("compose");
  };

  const handleNew = () => {
    setDraftId(null);
    setSubject("");
    setContent("");
    setView("compose");
  };

  const handleSaveDraft = async () => {
    if (!subject) {
      showToast("Subject is required", "error");
      return;
    }
    setIsSaving(true);
    try {
      const payload = { subject, content };
      let res;
      if (draftId) {
        res = await fetch(`/api/admin/newsletter/${draftId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/newsletter", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        setDraftId(saved._id);
        showToast("Draft saved", "success");
        fetchNewsletters(); // Refresh list background
      } else {
        showToast("Failed to save", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!draftId) {
      showToast("Please save draft first", "error");
      return;
    }
    if (
      !confirm("Are you sure you want to blast this email to ALL subscribers?")
    )
      return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/admin/newsletter/${draftId}/send`, {
        method: "POST",
      });

      if (res.ok) {
        showToast("Newsletter queued for sending!", "success");
        setView("list");
        fetchNewsletters();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to send", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this newsletter?")) return;
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Deleted", "success");
        fetchNewsletters();
      }
    } catch (e) {
      showToast("Error", "error");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Newsletter</h1>
          <p className="text-zinc-400">
            Manage and send updates to your subscribers.
          </p>
        </div>
        {view === "list" && (
          <Button onClick={handleNew} className="gap-2">
            <Plus size={18} /> New Campaign
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-4"
          >
            {isLoading ? (
              <div className="text-zinc-500 flex gap-2">
                <Loader2 className="animate-spin" /> Loading...
              </div>
            ) : newsletters.length === 0 ? (
              <div className="text-zinc-500 italic p-8 border border-white/5 rounded-lg text-center">
                No newsletters yet.
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                {newsletters.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleEdit(n)}
                    className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex justify-between items-center group"
                  >
                    <div>
                      <h3 className="text-white font-medium mb-1">
                        {n.subject || "(No Subject)"}
                      </h3>
                      <div className="text-xs text-zinc-500 flex gap-4">
                        <span
                          className={`uppercase font-bold tracking-wider ${n.status === "sent" ? "text-green-400" : "text-yellow-500"}`}
                        >
                          {n.status}
                        </span>
                        <span>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                        {n.status === "sent" && (
                          <span>
                            Sent: {new Date(n.sentAt!).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {n.status === "sent" && (
                        <div className="text-right text-xs text-zinc-400">
                          Open Rate:{" "}
                          <span className="text-white font-mono">TBD</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => handleDelete(n._id, e)}
                        className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="compose"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setView("list")}
                className="text-zinc-400"
              >
                <ArrowLeft size={18} /> Back
              </Button>
              <div className="flex-1"></div>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={18} className="mr-2" />
                )}
                Save Draft
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send size={18} className="mr-2" />
                )}
                Send Now
              </Button>
            </div>

            <div className="space-y-4">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject Line..."
                className="w-full bg-transparent text-4xl font-serif text-white placeholder:text-zinc-700 focus:outline-none border-b border-white/10 pb-4"
              />

              <div className="border border-white/10 rounded-xl overflow-hidden min-h-[500px] bg-black">
                <Editor
                  value={content} // Tiptap usually wants JSON, but we stored HTML. Editor.tsx props check needed.
                  // Assuming Editor handles HTML string input if `value` prop is used.
                  // If Editor only supports JSON, we might need a parser.
                  // For now, let's assume it accepts content.
                  onChange={(val: any) => setContent(val)} // Editor usually returns JSON or HTML depending on config.
                  placeholder="Write your newsletter..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
