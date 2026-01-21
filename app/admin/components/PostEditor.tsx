"use client";

import { Button } from "@/app/components/ui/Button";
import {
  RichTextEditor,
  RichTextEditorRef,
} from "@/app/components/editor/RichTextEditor";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  BookOpen,
  Maximize2,
  Minimize2,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EditorGuide } from "./EditorGuide"; // New Component
import { TableOfContents } from "@/app/components/editor/TableOfContents";
import { Editor } from "@tiptap/react";

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
  const editorRef = useRef<RichTextEditorRef>(null);
  const searchParams = useSearchParams();

  // Unique Draft ID for New Posts (to handle multiple tabs)
  const [tempDraftId, setTempDraftId] = useState<string>("");

  useEffect(() => {
    // Only logic for "Create New" mode
    if (!isEdit && !initialData) {
      const currentTempId = searchParams.get("tempId");
      if (currentTempId) {
        setTempDraftId(currentTempId);
      } else {
        // Generate unique session ID for this tab
        const newId = crypto.randomUUID();
        const newUrl = window.location.pathname + "?tempId=" + newId;
        window.history.replaceState({}, "", newUrl);
        setTempDraftId(newId);
      }
    }
  }, [isEdit, initialData, searchParams]);

  // Editor States
  const [isZenMode, setIsZenMode] = useState(false);
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Track specific dirty state (could be enhanced later to field-level)
  const [isDirty, setIsDirty] = useState(false);

  // Draft Restore State
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoreDraftData, setRestoreDraftData] = useState<any>(null);

  // Media Modal State
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearchTerm, setMediaSearchTerm] = useState("");
  const [targetImageField, setTargetImageField] = useState<
    "image" | "ogImage" | "content"
  >("image");

  // Guide State
  const [showGuide, setShowGuide] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

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
    // 1. Determine Storage Key
    let storageKey = "";
    if (initialData?._id) {
      storageKey = `post_draft_${initialData._id}`;
    } else if (tempDraftId) {
      storageKey = `post_draft_${tempDraftId}`;
    }

    // 2. Load from DB (Initial Data)
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
    }

    // 3. Check for Autosaved Drafts (Non-blocking)
    if (storageKey) {
      const localDraftIdx = localStorage.getItem(storageKey);
      if (localDraftIdx) {
        try {
          const parsed = JSON.parse(localDraftIdx);
          // Support both old format (raw data) and new format (w/ timestamp)
          const draftData = parsed.timestamp ? parsed.data : parsed;
          const draftTime = parsed.timestamp || 0;

          // For Create Mode: Always restore session silently if content exists
          if (!isEdit) {
            if (draftData.title || draftData.content) {
              setFormData(draftData);
              setIsDirty(true);
              showToast("Restored your previous session", "info");
            }
          }
          // For Edit Mode: Check if local is newer than DB
          else if (initialData && draftData) {
            const dbTime = new Date(initialData.updatedAt).getTime();

            // If local draft is newer (or substantially different if no timestamp)
            // We verify content difference to minimize false positives
            const hasContentDiff =
              draftData.content !== initialData.content ||
              draftData.title !== initialData.title;

            if (hasContentDiff) {
              if (draftTime > dbTime || !draftTime) {
                // Found newer draft!
                setRestoreDraftData(draftData);
                setShowRestorePrompt(true);
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse local draft", e);
        }
      }
    }
  }, [initialData, isEdit, tempDraftId]); // Run once on mount/id-change

  // Tag Input State
  const [tagInput, setTagInput] = useState("");

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^,|,$/g, ""); // Remove commas
      if (newTag) {
        const currentTags = formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [];
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag].join(", ");
          setFormData((prev) => ({ ...prev, tags: updatedTags }));
          setIsDirty(true);
        }
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && formData.tags) {
      // Remove last tag on backspace if input empty
      const currentTags = formData.tags.split(",").map((t) => t.trim());
      currentTags.pop();
      setFormData((prev) => ({ ...prev, tags: currentTags.join(", ") }));
      setIsDirty(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags.split(",").map((t) => t.trim());
    const updatedTags = currentTags.filter((t) => t !== tagToRemove).join(", ");
    setFormData((prev) => ({ ...prev, tags: updatedTags }));
    setIsDirty(true);
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
    setIsDirty(true);
  };

  // Auto-Save Effect
  useEffect(() => {
    if (!isDirty) return;

    let storageKey = "";
    if (initialData?._id) {
      storageKey = `post_draft_${initialData._id}`;
    } else if (tempDraftId) {
      storageKey = `post_draft_${tempDraftId}`;
    } else {
      return; // Don't save if no ID yet
    }

    const timer = setTimeout(() => {
      const payload = {
        timestamp: Date.now(),
        data: formData,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 1000); // Save every 1s of inactivity

    return () => clearTimeout(timer);
  }, [formData, isDirty, initialData, tempDraftId]);

  // Restore Action
  const confirmRestore = () => {
    if (restoreDraftData) {
      setFormData(restoreDraftData);
      setIsDirty(true);
      setShowRestorePrompt(false);
      showToast("Draft restored successfully", "success");
    }
  };

  const discardRestore = () => {
    setShowRestorePrompt(false);
    // Optionally clear the stale draft so it doesn't nag again
    let storageKey = "";
    if (initialData?._id) storageKey = `post_draft_${initialData._id}`;
    if (storageKey) localStorage.removeItem(storageKey);
    showToast("Local draft discarded", "info");
  };

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

  const openMediaModal = (field: "image" | "ogImage" | "content") => {
    setTargetImageField(field);
    setIsMediaModalOpen(true);
  };

  const selectMediaItem = (url: string) => {
    if (targetImageField === "content") {
      editorRef.current?.insertImage(url);
    } else {
      setFormData((prev) => ({ ...prev, [targetImageField]: url }));
    }
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
              {/* Auto-Save Indicator */}
              <span className="text-zinc-600 mx-2">|</span>
              <span
                className={`transition-colors ${isDirty ? "text-yellow-500" : "text-zinc-500"}`}
              >
                {isDirty ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsZenMode(!isZenMode)}
            className={`flex items-center gap-2 ${isZenMode ? "text-cyan-400 bg-cyan-950/30" : "text-zinc-400 hover:text-cyan-400"}`}
            title="Toggle Focus Mode"
          >
            {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span className="hidden md:inline">
              {isZenMode ? "Exit Focus" : "Focus"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(true)}
            className="text-zinc-400 hover:text-cyan-400 flex items-center gap-2"
          >
            <BookOpen size={18} />
            <span className="hidden md:inline">Guide</span>
          </Button>

          <div className="h-6 w-px bg-white/10 mx-1"></div>

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

      {/* Restore Prompt Banner */}
      <AnimatePresence>
        {showRestorePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-cyan-200">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <FileText size={20} className="text-cyan-400" />
                </div>
                <div className="text-sm">
                  <p className="font-bold">Unsaved changes found</p>
                  <p className="opacity-80">
                    We found a newer version of this post on your device (likely
                    from a previous session).
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={discardRestore}
                  className="text-zinc-400 hover:text-white"
                >
                  Discard Local
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={confirmRestore}
                  className="bg-cyan-500 text-black hover:bg-cyan-400"
                >
                  Restore Version
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Editor Column */}
        <div
          className={`
             ${
               isZenMode
                 ? "fixed inset-0 z-[100] bg-[#09090b] overflow-y-auto animate-in fade-in duration-300 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800"
                 : "lg:col-span-3 space-y-8"
             }
           `}
        >
          {isZenMode ? (
            <div className="fixed inset-0 z-[100] bg-[#09090b] flex flex-col animate-in fade-in duration-300">
              {/* Fixed Header: Title & Controls */}
              <div className="flex-none px-8 py-4 border-b border-white/5 bg-[#09090b] flex items-center justify-between gap-8 z-20">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Post Title..."
                  className="flex-1 bg-transparent border-none px-0 py-2 font-bold tracking-tight text-3xl md:text-4xl text-white placeholder:text-zinc-800 focus:outline-none focus:ring-0 focus:placeholder:text-zinc-700 transition-all font-sans"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className={`p-2.5 rounded-full backdrop-blur-sm transition-all border border-white/5 shadow-xl ${
                      isDirty
                        ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                        : "bg-zinc-900 text-zinc-500 hover:text-white"
                    }`}
                    title={isDirty ? "Save Changes" : "Saved"}
                  >
                    <Save
                      size={20}
                      className={isSubmitting ? "animate-pulse" : ""}
                    />
                  </button>
                  <button
                    onClick={() => setIsZenMode(false)}
                    className="p-2.5 text-zinc-500 hover:text-white bg-zinc-900 rounded-full backdrop-blur-sm transition-colors border border-white/5 shadow-xl"
                    title="Exit Focus Mode"
                  >
                    <Minimize2 size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Editor Area */}
              <div className="flex-1 overflow-hidden w-full max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-0 flex flex-col">
                <RichTextEditor
                  ref={editorRef}
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="Write something amazing..."
                  className="h-full border-none bg-transparent"
                  onImageUpload={uploadFile}
                  onEditorReady={setEditorInstance}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Standard Mode Layout */}

              {/* Title Input Area */}
              <div className="space-y-6">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Post Title"
                  className={`w-full bg-transparent border-none px-0 py-2 font-black tracking-tight text-white placeholder:text-zinc-800 focus:outline-none focus:ring-0 focus:placeholder:text-zinc-700 transition-all font-sans ${isZenMode ? "text-5xl md:text-6xl text-center" : "text-4xl md:text-5xl"}`}
                />

                {/* Zen Mode: Hide Metadata Inputs */}
                {!isZenMode && (
                  <div className="flex flex-col gap-4 pl-1">
                    {/* Slug Section */}
                    <div className="flex items-center gap-3 text-zinc-500 text-sm font-mono group">
                      <span className="text-cyan-500/50 group-hover:text-cyan-500 transition-colors">
                        GET
                      </span>
                      <span>/blog/</span>
                      <div className="relative flex-1 max-w-md flex items-center gap-2">
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleChange}
                          placeholder="url-slug-goes-here"
                          className="flex-1 bg-white/5 border border-white/5 rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-colors"
                        />
                        <button
                          onClick={generateSlug}
                          title="Auto-generate from Title"
                          className="p-2 bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-500 rounded-md transition-colors"
                        >
                          <span className="sr-only">Generate Slug</span>✨
                        </button>
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
                )}
              </div>

              <RichTextEditor
                ref={editorRef}
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Start writing your story..."
                className="h-[75vh] min-h-[500px]"
                onImageUpload={uploadFile}
                onEditorReady={setEditorInstance}
              />

              {/* SEO Metadata Settings */}
              {!isZenMode && (
                <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-8 space-y-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Search size={18} className="text-cyan-500" /> SEO
                    Configuration
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
                          placeholder={
                            formData.image || "Default: Featured Image"
                          }
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
                            Enable this to prevent search engines from indexing
                            this page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Settings Column */}
        {!isZenMode && (
          <div className="space-y-6 sticky top-24 h-fit">
            <TableOfContents editor={editorInstance} />
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
                          <option key={cat._id} value={cat._id}>
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
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 bg-[#121212] border border-white/10 rounded-lg p-2 min-h-[42px] focus-within:border-cyan-500/50 transition-colors">
                      {formData.tags &&
                        formData.tags
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .map((tag, i) => (
                            <span
                              key={i}
                              className="bg-white/10 text-zinc-200 text-xs px-2 py-1 rounded flex items-center gap-1 group"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-red-400 opacity-50 group-hover:opacity-100"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={formData.tags ? "" : "Add tags..."}
                        className="bg-transparent border-none text-white text-sm focus:ring-0 p-0 min-w-[80px] flex-1"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Press Enter or Comma to add tag
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          featured: e.target.checked,
                        }))
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
        )}
      </div>

      {/* Author Guide Panel */}
      <EditorGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
