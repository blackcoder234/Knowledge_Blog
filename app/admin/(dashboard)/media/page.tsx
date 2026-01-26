"use client";

import { useEffect, useState, useRef } from "react";
import {
  Image as ImageIcon,
  Copy,
  Trash2,
  Upload,
  Loader2,
  FileImage,
  Search,
} from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

// Types
interface MediaItem {
  _id: string;
  url: string;
  filename: string;
  folder: string;
  size: number;
  format: string;
  createdAt: string;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast() || { showToast: console.log };

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        setMedia(await res.json());
      }
    } catch (error) {
      console.error("Failed to load media", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "general"); // Or let user choose? Defaulting for simple UX.

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        showToast("Image uploaded successfully", "success");
        fetchMedia(); // Refresh list
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      showToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: string) => {
    setConfirmId(id);
  };

  const executeDelete = async () => {
    if (!confirmId) return;

    try {
      const res = await fetch(`/api/admin/media?id=${confirmId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMedia((prev) => prev.filter((item) => item._id !== confirmId));
        showToast("Image deleted", "success");
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      showToast("Failed to delete image", "error");
    } finally {
      setConfirmId(null);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("URL copied to clipboard", "success");
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const filteredMedia = media.filter(
    (item) =>
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.format.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 w-full space-y-8 animate-fade-in font-sans min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
          <p className="text-zinc-400">
            Manage your uploaded images and assets.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-sm text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500/50 w-full md:w-64 transition-colors"
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "Uploading..." : "Upload New"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-cyan-500 animate-spin" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-xl">
          <FileImage size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">No media files found</p>
          <p className="text-sm">Upload an image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence>
            {filteredMedia.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all shadow-sm hover:shadow-xl"
              >
                {/* Image Preview */}
                <div className="aspect-square relative overflow-hidden bg-black/50">
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 backdrop-blur-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-3">
                  <p
                    className="text-xs font-medium text-zinc-300 truncate mb-1"
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <span>{item.format?.toUpperCase()}</span>
                    <span>{formatBytes(item.size)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={executeDelete}
        title="Delete Image?"
        description="Are you sure you want to permanently delete this image? This cannot be undone."
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
