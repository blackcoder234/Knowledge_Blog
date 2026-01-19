"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/app/context/ToastContext";
import GlobalLoading from "@/app/loading";
import { Mail, MailOpen, Trash2 } from "lucide-react";

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        showToast("Failed to fetch messages", "error");
      }
    } catch (error) {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;

    try {
      const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
        showToast("Message deleted", "success");
      } else {
        showToast("Failed to delete", "error");
      }
    } catch (error) {
      showToast("Error deleting message", "error");
    }
  };

  const toggleRead = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !currentStatus }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m._id === id ? { ...m, read: !currentStatus } : m)),
        );
      }
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  if (loading) return <GlobalLoading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-zinc-400">View inquiries from the contact form.</p>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-[#111] text-xs uppercase font-bold text-white border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">From</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {messages.map((msg: any) => (
                <tr
                  key={msg._id}
                  className={`hover:bg-white/5 transition-colors ${
                    !msg.read ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleRead(msg._id, msg.read)}
                      className={`w-3 h-3 rounded-full ${
                        msg.read ? "bg-zinc-700" : "bg-accent animate-pulse"
                      }`}
                      title={msg.read ? "Mark as Unread" : "Mark as Read"}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`font-medium ${
                        !msg.read ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      {msg.firstName} {msg.lastName}
                    </div>
                    <div className="text-xs text-zinc-500">{msg.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                      {msg.subject}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 max-w-xs truncate"
                    title={msg.message}
                  >
                    {msg.message}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleRead(msg._id, msg.read)}
                        className={`p-2 rounded-lg transition-colors ${
                          msg.read
                            ? "text-zinc-500 hover:text-cyan-400 hover:bg-cyan-400/10"
                            : "text-cyan-400 hover:text-zinc-400 hover:bg-zinc-400/10"
                        }`}
                        title={msg.read ? "Mark as Unread" : "Mark as Read"}
                      >
                        {msg.read ? <Mail size={16} /> : <MailOpen size={16} />}
                      </button>

                      <button
                        onClick={() => handleDelete(msg._id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No messages received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
