"use client";

import { Button } from "@/app/components/ui/Button";
import { RichTextEditor } from "@/app/components/editor/RichTextEditor";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import {
  Image as ImageIcon,
  X,
  Check,
  Search,
  Globe,
  Layout,
  FileText,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Interface for Media Items
interface MediaItem {
  _id: string;
  url: string;
  filename: string;
}

interface PostEditorProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PostEditor({
  initialData,
  isEdit = false,
}: PostEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // Track unsaved changes

  // Media Modal State
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearchTerm, setMediaSearchTerm] = useState("");
  const [targetImageField, setTargetImageField] = useState<"image" | "ogImage">(
    "image",
  );

  // Category State
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Artificial Intelligence",
    language: "English", // Default language
    tags: "",
    image: "",
    status: "draft", // draft, published, archived
    featured: false,
    // SEO Fields
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    ogImage: "",
    noindex: false,
  });

  useEffect(() => {
    // 1. Load from DB (Initial Data)
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        slug: initialData.slug || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        category: initialData.category || "Artificial Intelligence",
        language: initialData.language || "English",
        tags: Array.isArray(initialData.tags)
          ? initialData.tags.join(", ")
          : initialData.tags || "",
        image: initialData.image || "",
        status: initialData.status || "draft",
        featured: initialData.featured || false,
        seoTitle: initialData.seoTitle || "",
        seoDescription: initialData.seoDescription || "",
        canonicalUrl: initialData.canonicalUrl || "",
        ogImage: initialData.ogImage || "",
        noindex: initialData.noindex || false,
      });
      setIsDirty(false);

      // 2. Check for LocalStorage Draft (After loading DB data)
      const storageKey = `post_draft_${initialData._id}`;
      const localDraft = localStorage.getItem(storageKey);
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          // Simple check: is local content different?
          if (
            parsed.content !== initialData.content ||
            parsed.title !== initialData.title
          ) {
            const userWantsRestore = window.confirm(
              "Found an unsaved draft on this device that is newer than the database version. Would you like to restore it?",
            );
            if (userWantsRestore) {
              setFormData(parsed);
              setIsDirty(true);
              showToast("Restored unsaved local draft", "success");
            }
          }
        } catch (e) {
          console.error("Failed to parse local draft", e);
        }
      }
    } else if (!isEdit) {
      // New Post: Check for 'new' draft
      const storageKey = `post_draft_new`;
      const localDraft = localStorage.getItem(storageKey);
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          if (parsed.title || parsed.content) {
            setFormData(parsed);
            setIsDirty(true);
            showToast("Restored unsaved new post", "success");
          }
        } catch (e) {}
      }
    }
  }, [initialData, isEdit]);

  // Auto-Save Effect
  useEffect(() => {
    if (!isDirty) return;

    const storageKey = `post_draft_${initialData?._id || "new"}`;
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }, 1000); // Save every 1s of inactivity

    return () => clearTimeout(timer);
  }, [formData, isDirty, initialData]);

  // Prevent Navigation if Dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Fetch Categories based on Language
  useEffect(() => {
    setLoadingCategories(true);
    fetch(`/api/categories?language=${formData.language}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          // Auto-select first category if current one isn't available in new language
          // Only if we have data, to prevent resetting on initial load if async is slow
          if (data.length > 0) {
            const hasCurrent = data.some(
              (c: any) => c.name === formData.category,
            );
            if (!hasCurrent && !isEdit) {
              // Only auto-switch for new posts or if strictly invalid.
              // For edit, we might want to keep the old one even if invalid temporarily?
              // Let's just default to first one if invalid.
              // Actually, checking !hasCurrent is enough.
              setFormData((prev) => ({ ...prev, category: data[0].name }));
            }
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingCategories(false));
  }, [formData.language, isEdit]); // isEdit dependency to avoid overwriting heavily on mount? Maybe not needed if logic is sound.

  // Fetch Media when modal opens
  useEffect(() => {
    if (isMediaModalOpen && mediaLibrary.length === 0) {
      setLoadingMedia(true);
      fetch("/api/admin/media")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setMediaLibrary(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingMedia(false));
    }
  }, [isMediaModalOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (
      type === "checkbox" &&
      (e.target as HTMLInputElement).checked !== undefined
    ) {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }) as any);
    } else {
      // Form Field Change
      setFormData((prev) => ({ ...prev, [name]: value }) as any);
      setIsDirty(true);
    }
  };

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
    setIsDirty(true);
  };

  // Reusable Upload Helper (Direct Upload)
  const uploadFile = async (file: File): Promise<string> => {
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("folder", "posts");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.url) return json.url;
      throw new Error("No URL returned");
    } catch (err) {
      console.error("Upload failed", err);
      showToast("Image upload failed", "error");
      return "";
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (targetStatus?: string) => {
    if (!formData.title || !formData.slug) {
      showToast("Title and Slug are required.", "error");
      return;
    }

    const finalStatus = targetStatus || formData.status;

    // Validation for Publishing
    if (finalStatus === "published") {
      if (!formData.image) {
        showToast(
          "A Featured Image is required to publish this post.",
          "error",
        );
        return;
      }
      if (!formData.excerpt) {
        showToast(
          "A short excerpt/description is required before publishing.",
          "error",
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/posts/${initialData._id}` : "/api/posts";
      const method = isEdit ? "PATCH" : "POST";

      const submitData = {
        ...formData,
        status: finalStatus,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        // Ensure SEO defaults are saved to DB
        seoTitle: formData.seoTitle || formData.title,
        seoDescription: formData.seoDescription || formData.excerpt,
        ogImage: formData.ogImage || formData.image,
      };

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const data = await res.json();
        setIsDirty(false); // Saved

        // Clear Local Storage to prevent stale restore prompts
        const storageKey = `post_draft_${isEdit ? initialData?._id : "new"}`;
        localStorage.removeItem(storageKey);

        showToast(
          `Post ${finalStatus === "published" ? "Published" : "Saved"} successfully!`,
          "success",
        );

        if (finalStatus === "published") {
          router.push("/admin/posts");
          router.refresh();
        } else {
          // If this was a new post (not edit), redirect to the edit URL for this new post
          // so subsequent saves update it instead of creating duplicates.
          if (!isEdit && data._id) {
            router.replace(`/admin/posts/create?id=${data._id}`);
          }
          router.refresh();
        }
      } else {
        const error = await res.json();
        showToast(error.error || "Failed to save", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMediaModal = (field: "image" | "ogImage") => {
    setTargetImageField(field);
    setIsMediaModalOpen(true);
  };

  const selectMediaItem = (url: string) => {
    setFormData((prev) => ({ ...prev, [targetImageField]: url }));
    setIsMediaModalOpen(false);
  };

  const handlePreview = () => {
    if (!formData.slug) {
      showToast("Please add a URL slug first.", "error");
      return;
    }
    if (!isEdit && !initialData?._id) {
      showToast(
        "Please 'Save Draft' at least once to generate a preview.",
        "error",
      );
      return;
    }
    // Open in new tab
    window.open(`/blog/${formData.slug}`, "_blank");
  };

  const filteredMedia = mediaLibrary.filter((item) =>
    item.filename.toLowerCase().includes(mediaSearchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-20 font-sans animate-fade-in relative">
      {/* Media Selection Modal */}
      <AnimatePresence>
        {isMediaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ImageIcon size={18} className="text-cyan-400" />
                  Select Media
                </h3>
                <button
                  onClick={() => setIsMediaModalOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>

              <div className="p-4 border-b border-zinc-800 flex gap-4 bg-zinc-900">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search media..."
                    value={mediaSearchTerm}
                    onChange={(e) => setMediaSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <input
                  type="file"
                  id="modal-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;

                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      // We await each one to ensure sequential state updates or could trigger parallel
                      const url = await uploadFile(file);
                      if (url) {
                        setMediaLibrary((prev) => [
                          {
                            _id: `temp-${Date.now()}-${i}`,
                            url,
                            filename: file.name,
                          },
                          ...prev,
                        ]);
                      }
                    }
                  }}
                />
                <label
                  htmlFor="modal-upload"
                  className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-zinc-200 transition-colors flex items-center gap-2"
                >
                  {uploading ? "Uploading..." : "Upload New"}
                </label>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">
                {loadingMedia ? (
                  <div className="text-center py-20 text-zinc-500">
                    Loading media library...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredMedia.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => selectMediaItem(item.url)}
                        className="aspect-square relative group cursor-pointer border-2 border-transparent hover:border-cyan-500 rounded-xl overflow-hidden bg-black/50"
                      >
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste URL here..."
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (manualImageUrl) selectMediaItem(manualImageUrl);
                  }}
                >
                  Use URL
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Actions */}
      <div className="sticky top-0 z-30 bg-[#000000]/80 backdrop-blur-xl border-b border-white/10 -mx-8 px-8 py-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            onClick={() => router.back()}
            className="cursor-pointer hover:opacity-80"
          >
            <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-500 font-bold">
              <FileText size={20} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-sans">
              {isEdit ? "Edit Post" : "Create New Post"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  formData.status === "published"
                    ? "bg-green-500"
                    : formData.status === "archived"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              ></span>
              <span className="capitalize">{formData.status} Mode</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex gap-2"
            onClick={handlePreview}
          >
            <Globe size={16} /> Preview
          </Button>

          <div className="h-6 w-px bg-white/10 mx-1"></div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            className="text-zinc-300 border-zinc-700 hover:bg-zinc-800"
          >
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
            onClick={() => handleSubmit("published")}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Publishing..." : "Publish Now"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Editor Column */}
        <div className="lg:col-span-3 space-y-8">
          {/* Title Input Area */}
          <div className="space-y-6">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Post Title"
              className="w-full bg-transparent border-none px-0 py-2 text-4xl md:text-5xl font-black tracking-tight text-white placeholder:text-zinc-800 focus:outline-none focus:ring-0 focus:placeholder:text-zinc-700 transition-all font-sans"
            />

            <div className="flex flex-col gap-4 pl-1">
              {/* Slug Section */}
              <div className="flex items-center gap-3 text-zinc-500 text-sm font-mono group">
                <span className="text-cyan-500/50 group-hover:text-cyan-500 transition-colors">
                  GET
                </span>
                <span>/blog/</span>
                <div className="relative flex-1 max-w-md flex items-center">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="url-slug-goes-here"
                    className="w-full bg-white/5 border border-white/5 rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-colors"
                  />
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Short Description / Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Enter a compelling summary for search results and social cards..."
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-4 text-zinc-300 text-sm leading-relaxed focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                ></textarea>
              </div>
            </div>
          </div>

          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
            onImageUpload={uploadFile}
          />

          {/* SEO Metadata Settings */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search size={18} className="text-cyan-500" /> SEO Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  SEO Title
                </label>
                <input
                  type="text"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleChange}
                  placeholder={formData.title || "Default: Post Title"}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Canonical URL
                </label>
                <input
                  type="text"
                  name="canonicalUrl"
                  value={formData.canonicalUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                SEO Description
              </label>
              <textarea
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleChange}
                rows={2}
                placeholder={formData.excerpt || "Default: Post Excerpt"}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-4 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  OpenGraph Image (Social Card)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="ogImage"
                    value={formData.ogImage}
                    onChange={handleChange}
                    placeholder={formData.image || "Default: Featured Image"}
                    className="flex-1 bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openMediaModal("ogImage")}
                    className="border-white/10 text-zinc-300"
                  >
                    Select
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-6">
                <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="noindex"
                    name="noindex"
                    checked={formData.noindex}
                    onChange={handleChange}
                    className="h-4 w-4 bg-[#121212] border-red-500/50 rounded text-red-500 focus:ring-offset-0 focus:ring-0"
                  />
                  <div>
                    <label
                      htmlFor="noindex"
                      className="block text-sm font-bold text-red-400"
                    >
                      NoIndex (Hide from Google)
                    </label>
                    <p className="text-[10px] text-red-400/70">
                      Enable this to prevent search engines from indexing this
                      page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings Column */}
        <div className="space-y-6">
          <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                Publishing
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {loadingCategories ? (
                      <option disabled>Loading...</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Language
                  </label>
                  <select
                    name="language"
                    value={(formData as any).language || "English"}
                    onChange={handleChange}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="English">English</option>
                    <option value="Bengali">Bengali</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Add tags..."
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, featured: e.target.checked }))
                    }
                    className="rounded bg-[#121212] border-white/10"
                  />
                  <label htmlFor="featured" className="text-sm text-zinc-300">
                    Featured Post
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                Featured Asset
              </label>
              <div className="space-y-3">
                {/* Image Preview */}
                <div
                  className="relative border border-dashed border-white/10 rounded-lg h-40 flex flex-col items-center justify-center overflow-hidden bg-black/20 group cursor-pointer hover:border-cyan-500/50 transition-all"
                  onClick={() => openMediaModal("image")}
                >
                  {formData.image ? (
                    <>
                      <img
                        src={formData.image}
                        className="w-full h-full object-cover"
                        alt="Featured"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-xs font-bold text-white">
                          Change Image
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="text-zinc-600 mb-2" />
                      <span className="text-xs text-zinc-500">
                        Select Image
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/5 rounded-xl p-6">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowSeoPreview(!showSeoPreview)}
            >
              <h3 className="text-sm font-bold text-white">
                Google Search Preview
              </h3>
              <Search size={16} />
            </div>
            {showSeoPreview && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="bg-white rounded-lg p-3 max-w-full overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-zinc-200"></div>
                    <div>
                      <div className="text-[10px] text-zinc-800 font-bold">
                        KnowledgeLog
                      </div>
                      <div className="text-[8px] text-zinc-500">
                        https://knowledgelog.com/blog/{formData.slug || "..."}
                      </div>
                    </div>
                  </div>
                  <div className="text-[#1a0dab] text-sm font-medium hover:underline truncate">
                    {formData.title || "Post Title..."}
                  </div>
                  <div className="text-xs text-[#4d5156] mt-1 line-clamp-2">
                    {formData.excerpt || "Description..."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
