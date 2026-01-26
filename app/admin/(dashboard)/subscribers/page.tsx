"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Download,
  Trash2,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

interface Subscriber {
  _id: string;
  email: string;
  isVerified?: boolean; // If valid in schema
  status?: string; // If valid in schema, assuming Active
  createdAt: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmData, setConfirmData] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const { showToast } = useToast() || { showToast: console.log };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSubscribers(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchSubscribers = async (query = "") => {
    setLoading(true);
    try {
      const url = query
        ? `/api/admin/subscribers?q=${encodeURIComponent(query)}`
        : "/api/admin/subscribers";

      const res = await fetch(url);
      if (res.ok) {
        setSubscribers(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch subscribers", error);
      showToast("Failed to load subscribers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, email: string) => {
    setConfirmData({ id, email });
  };

  const executeDelete = async () => {
    if (!confirmData) return;

    try {
      const res = await fetch(`/api/admin/subscribers?id=${confirmData.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s._id !== confirmData.id));
        showToast("Subscriber removed", "success");
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      showToast("Failed to remove subscriber", "error");
    } finally {
      setConfirmData(null);
    }
  };

  const exportCSV = () => {
    const headers = ["ID,Email,Join Date,Status"];
    const rows = subscribers.map(
      (s) =>
        `${s._id},${s.email},${new Date(s.createdAt).toISOString()},Active`,
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `subscribers_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Subscriber list exported!", "success");
  };

  return (
    <div className="p-6 w-full space-y-8 animate-fade-in font-sans min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Mail size={32} className="text-pink-500" />
            Subscribers
          </h1>
          <p className="text-zinc-400">
            Manage your newsletter audience ({subscribers.length} total)
          </p>
        </div>

        <div className="flex gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-sm text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-pink-500/50 w-full md:w-64 transition-colors"
            />
          </div>

          <button
            onClick={exportCSV}
            disabled={loading || subscribers.length === 0}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/50 text-zinc-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Email Address</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Joined Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-4" />
                  <p className="text-zinc-500">Loading audience list...</p>
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 text-lg font-medium">
                    No subscribers found
                  </p>
                  <p className="text-zinc-600">
                    Share your blog to grow your audience!
                  </p>
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr
                  key={sub._id}
                  className="group hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 font-bold uppercase text-xs">
                        {sub.email.substring(0, 2)}
                      </div>
                      <span className="text-zinc-200 font-medium">
                        {sub.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                      <CheckCircle2 size={12} />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      {new Date(sub.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(sub._id, sub.email)}
                      className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Remove Subscriber"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        isOpen={!!confirmData}
        onClose={() => setConfirmData(null)}
        onConfirm={executeDelete}
        title="Remove Subscriber?"
        description={`Are you sure you want to remove ${confirmData?.email} from the list?`}
        variant="danger"
        confirmText="Remove"
      />
    </div>
  );
}
