"use client";

import { Editor as RichTextEditor } from "@/app/components/editor/Editor";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import { EditorGuide } from "./EditorGuide";
import { Editor as TiptapEditor } from "@tiptap/react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Image as ImageIcon, Calendar } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { useDebouncedCallback } from "use-debounce";

// Sub-components
import { EditorHeader } from "./EditorHeader";
import { EditorMain } from "./EditorMain";
import { EditorSEO } from "./EditorSEO";
import { EditorSidebar } from "./EditorSidebar";
import { ZenModeOverlay, RestoreDraftPrompt } from "./EditorOverlays";

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
  const { data: session } = useSession();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const editorRef = useRef<any>(null);

  const isSuperAdmin = (session?.user as any)?.role === "super_admin";
  const [tempDraftId, setTempDraftId] = useState<string>("");

  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    if (isSuperAdmin && users.length === 0) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (data.users && Array.isArray(data.users)) {
            const allowedRoles = ["admin", "editor", "author"];
            const validUsers = data.users.filter((u: any) =>
              allowedRoles.includes(u.role),
            );
            setUsers(validUsers);
          }
        })
        .catch((err) => console.error("Failed to load users", err));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isEdit && !initialData) {
      const currentTempId = searchParams.get("tempId");
      if (currentTempId) {
        setTempDraftId(currentTempId);
      } else {
        const newId = crypto.randomUUID();
        const newUrl = window.location.pathname + "?tempId=" + newId;
        window.history.replaceState({}, "", newUrl);
        setTempDraftId(newId);
      }
    }
  }, [isEdit, initialData, searchParams]);

  const [isZenMode, setIsZenMode] = useState(false);
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoreDraftData, setRestoreDraftData] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearchTerm, setMediaSearchTerm] = useState("");
  const [targetImageField, setTargetImageField] = useState<
    "image" | "ogImage" | "content"
  >("image");

  const [showGuide, setShowGuide] = useState(false);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(
    null,
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    language: "English",
    author: "",
    tags: "",
    image: "",
    status: "draft",
    featured: false,
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    ogImage: "",
    noindex: false,
    scheduledPublishDate: "",
  });

  useEffect(() => {
    let storageKey = "";
    if (initialData?._id) {
      storageKey = `post_draft_${initialData._id}`;
    } else if (tempDraftId) {
      storageKey = `post_draft_${tempDraftId}`;
    }

    if (initialData) {
      setFormData({
        title: initialData.title || "",
        slug: initialData.slug || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        category: initialData.category?._id || initialData.category || "",
        language: initialData.language || "English",
        author: initialData.author?._id || initialData.author || "",
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
        scheduledPublishDate: initialData.scheduledPublishDate
          ? new Date(initialData.scheduledPublishDate)
              .toISOString()
              .slice(0, 16)
          : "",
      });
      setIsDirty(false);
    }

    if (storageKey) {
      const localDraftIdx = localStorage.getItem(storageKey);
      if (localDraftIdx) {
        try {
          const parsed = JSON.parse(localDraftIdx);
          const draftData = parsed.timestamp ? parsed.data : parsed;
          const draftTime = parsed.timestamp || 0;

          if (!isEdit) {
            if (draftData.title || draftData.content) {
              setFormData(draftData);
              setIsDirty(true);
              showToast("Restored your previous session", "info");
            }
          } else if (initialData && draftData) {
            const dbTime = new Date(initialData.updatedAt).getTime();
            const hasContentDiff =
              draftData.content !== initialData.content ||
              draftData.title !== initialData.title;

            if (hasContentDiff) {
              if (draftTime > dbTime || !draftTime) {
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
  }, [initialData, isEdit, tempDraftId]);

  const [tagInput, setTagInput] = useState("");

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^,|,$/g, "");
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
      const currentTags = formData.tags.split(",").map((t) => t.trim());
      currentTags.pop();
      setFormData((prev) => ({ ...prev, tags: currentTags.join(", ") }));
      setIsDirty(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (!formData.tags) return;
    const currentTags =
      typeof formData.tags === "string"
        ? formData.tags.split(",").map((t) => t.trim())
        : Array.isArray(formData.tags)
          ? formData.tags
          : [];
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

  useEffect(() => {
    if (!isDirty) return;
    let storageKey = "";
    if (initialData?._id) {
      storageKey = `post_draft_${initialData._id}`;
    } else if (tempDraftId) {
      storageKey = `post_draft_${tempDraftId}`;
    } else {
      return;
    }
    const timer = setTimeout(() => {
      const payload = { timestamp: Date.now(), data: formData };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, isDirty, initialData, tempDraftId]);

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
    let storageKey = "";
    if (initialData?._id) storageKey = `post_draft_${initialData._id}`;
    if (storageKey) localStorage.removeItem(storageKey);
    showToast("Local draft discarded", "info");
  };

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

  useEffect(() => {
    setLoadingCategories(true);
    fetch(`/api/categories?language=${formData.language}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) {
            const hasCurrent = data.some(
              (c: any) => c._id === formData.category,
            );
            // if (!hasCurrent && !isEdit) {
            //   setFormData((prev) => ({ ...prev, category: data[0].name }));
            // }
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingCategories(false));
  }, [formData.language, isEdit]);

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
      setFormData((prev) => ({ ...prev, [name]: value }) as any);
      setIsDirty(true);
    }
  };

  /* 
    DEBOUNCE OPTIMIZATION:
    We debounce the content update to prevent re-rendering the entire admin UI
    on every single keystroke. This makes the editor significantly more responsive
    on large documents.
  */
  const debouncedSetContent = useDebouncedCallback((value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
    setIsDirty(true);
  }, 500);

  const handleContentChange = (value: string) => {
    // Immediate update for local ref if needed (optional),
    // but we primarily want to delay the state update.
    debouncedSetContent(value);
  };

  const uploadFile = async (file: File): Promise<string> => {
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("folder", "posts");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
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

  const handleSubmit = async (targetStatus?: string, dataOverride?: any) => {
    const currentData = dataOverride || formData;
    if (!currentData.title) {
      showToast("Title is missing", "error");
      return;
    }
    if (!currentData.slug) {
      showToast("Slug is missing", "error");
      return;
    }
    const finalStatus = targetStatus || currentData.status;
    if (finalStatus === "published") {
      if (!currentData.image) {
        showToast("Cover Image is missing", "error");
        return;
      }
      if (!currentData.excerpt) {
        showToast("Excerpt is missing", "error");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/posts/${initialData._id}` : "/api/posts";
      const method = isEdit ? "PATCH" : "POST";
      const submitData = {
        ...currentData,
        status: finalStatus,
        tags:
          typeof currentData.tags === "string"
            ? currentData.tags
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean)
            : currentData.tags,
        seoTitle: currentData.seoTitle || currentData.title,
        seoDescription: currentData.seoDescription || currentData.excerpt,
        ogImage: currentData.ogImage || currentData.image,
        canonicalUrl:
          currentData.canonicalUrl ||
          `${window.location.origin}/blog/${currentData.slug}`,
      };
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (res.ok) {
        const data = await res.json();
        setIsDirty(false);
        setFormData((prev) => ({ ...prev, status: finalStatus }));
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
      editorInstance?.chain().focus().setImage({ src: url }).run();
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
    window.open(`/blog/${formData.slug}`, "_blank");
  };

  const handleScheduleConfirm = async (dateStr: string) => {
    setFormData((prev) => ({ ...prev, scheduledPublishDate: dateStr }));
    // We need to wait for state update or pass it directly. PASS DIRECTLY is safer.
    // However, handleSubmit uses formData.
    // So we will modify handleSubmit to accept overrides, or just leverage setFormData callback and a useEffect?
    // Better: create a dedicated submit function that takes overrides.
    // OR: just hacking it by manually merging in handleSubmit? No.
    // Simplest: Update form data, then call submit.
    // BUT React state updates are async.
    // So:
    const dataWithSchedule = { ...formData, scheduledPublishDate: dateStr };
    try {
      setIsSubmitting(true);
      // Duplicate the submit logic essentially, or refactor handleSubmit to take data?
      // Refactoring handleSubmit is best practice.
      // Let's refactor handleSubmit to accept optional data override.
      await handleSubmit("scheduled", dataWithSchedule);
      setIsScheduleModalOpen(false);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const filteredMedia = mediaLibrary.filter((item) =>
    item.filename.toLowerCase().includes(mediaSearchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-20 font-sans animate-fade-in relative">
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

      <EditorHeader
        isEdit={isEdit}
        status={formData.status}
        isDirty={isDirty}
        isZenMode={isZenMode}
        setIsZenMode={setIsZenMode}
        setShowGuide={setShowGuide}
        onPreview={handlePreview}
        onSaveDraft={() => handleSubmit("draft")}
        onScheduleConfirm={handleScheduleConfirm}
        onValidate={() => {
          if (!formData.title) {
            showToast("Title is missing", "error");
            return false;
          }
          if (!formData.slug) {
            showToast("Slug is missing", "error");
            return false;
          }
          if (!formData.image) {
            showToast("Cover Image is missing", "error");
            return false;
          }
          if (!formData.excerpt) {
            showToast("Excerpt is missing", "error");
            return false;
          }
          return true;
        }}
        onPublish={() => handleSubmit("published")}
        isSubmitting={isSubmitting}
        router={router}
      />

      <RestoreDraftPrompt
        show={showRestorePrompt}
        onDiscard={discardRestore}
        onRestore={confirmRestore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Editor Column */}
        <div className={isZenMode ? "" : "lg:col-span-3 space-y-8"}>
          {!isZenMode ? (
            <>
              <EditorMain
                formData={formData}
                handleChange={handleChange}
                generateSlug={generateSlug}
              />

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
              <EditorSEO
                formData={formData}
                handleChange={handleChange}
                openMediaModal={openMediaModal}
              />
            </>
          ) : (
            <ZenModeOverlay isZenMode={isZenMode}>
              <RichTextEditor
                ref={editorRef}
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Write something amazing..."
                className="h-full border-none bg-transparent"
                onImageUpload={uploadFile}
                onEditorReady={setEditorInstance}
                saveStatus={
                  isSubmitting ? "saving" : isDirty ? "unsaved" : "saved"
                }
                onSave={() => handleSubmit("draft")}
                onToggleZenMode={() => setIsZenMode(false)}
                isZenMode={true}
                title={formData.title}
                onTitleChange={(val) => {
                  setFormData((prev) => ({ ...prev, title: val }));
                  setIsDirty(true);
                }}
              />
            </ZenModeOverlay>
          )}
        </div>

        {!isZenMode && (
          <EditorSidebar
            formData={formData}
            handleChange={handleChange}
            categories={categories}
            loadingCategories={loadingCategories}
            users={users}
            isSuperAdmin={isSuperAdmin}
            tagInput={tagInput}
            setTagInput={setTagInput}
            handleTagKeyDown={handleTagKeyDown}
            removeTag={removeTag}
            openMediaModal={openMediaModal}
            editorInstance={editorInstance}
            showSeoPreview={showSeoPreview}
            setShowSeoPreview={setShowSeoPreview}
            setFormData={setFormData}
            setIsDirty={setIsDirty}
            onCategoryAdd={(newCat) => {
              setCategories((prev) =>
                [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)),
              );
              setFormData((prev) => ({ ...prev, category: newCat._id }));
              setIsDirty(true);
            }}
          />
        )}
      </div>
      <EditorGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
