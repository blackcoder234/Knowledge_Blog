"use client";

import { X, ImageIcon, Search, Plus, HelpCircle, Loader2 } from "lucide-react";
import { TableOfContents } from "@/app/components/editor/components/TableOfContents";
import { useState } from "react";
import { useToast } from "@/app/context/ToastContext";

interface EditorSidebarProps {
  formData: any;
  handleChange: (e: any) => void;
  categories: any[];
  loadingCategories: boolean;
  users: any[];
  isSuperAdmin: boolean;
  tagInput: string;
  setTagInput: (val: string) => void;
  handleTagKeyDown: (e: any) => void;
  removeTag: (tag: string) => void;
  openMediaModal: (field: "image" | "ogImage" | "content") => void;
  editorInstance: any;
  showSeoPreview: boolean;
  setShowSeoPreview: (val: boolean) => void;
  setFormData: (fn: (prev: any) => any) => void;
  setIsDirty: (val: boolean) => void;
  onCategoryAdd: (cat: any) => void;
}

export function EditorSidebar({
  formData,
  handleChange,
  categories,
  loadingCategories,
  users,
  isSuperAdmin,
  tagInput,
  setTagInput,
  handleTagKeyDown,
  removeTag,
  openMediaModal,
  editorInstance,
  showSeoPreview,
  setShowSeoPreview,
  setFormData,
  setIsDirty,
  onCategoryAdd,
}: EditorSidebarProps) {
  const { showToast } = useToast();
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatGenre, setNewCatGenre] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCatName || !newCatGenre) {
      showToast("Name and Genre are required", "error");
      return;
    }

    setIsCreatingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName,
          genre: newCatGenre,
          language: (formData as any).language || "English",
        }),
      });

      if (res.ok) {
        const newCat = await res.json();
        onCategoryAdd(newCat);
        setIsCatModalOpen(false);
        setNewCatName("");
        setNewCatGenre("");
        showToast("Category created!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create category", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error creating category", "error");
    } finally {
      setIsCreatingCat(false);
    }
  };

  return (
    <div className="space-y-6 sticky top-24 h-fit">
      <TableOfContents editor={editorInstance} floating={false} />
      <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Publishing
          </label>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-zinc-300">
                  Category
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="cursor-help text-zinc-500 hover:text-white transition-colors"
                    title="Create a new category if it doesn't exist"
                  >
                    <HelpCircle size={14} />
                  </div>
                  <button
                    onClick={() => setIsCatModalOpen(true)}
                    className="text-xs bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/20 px-2 py-0.5 rounded transition-all flex items-center gap-1 font-bold"
                  >
                    <Plus size={12} /> New
                  </button>
                </div>
              </div>
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

            {/* Author Assignment - Super Admin Only */}
            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Author (Admin)
                </label>
                <select
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  <option value="" disabled>
                    Select Author
                  </option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                  (typeof formData.tags === "string"
                    ? formData.tags.split(",")
                    : Array.isArray(formData.tags)
                      ? formData.tags
                      : []
                  )
                    .map((tag: any) =>
                      typeof tag === "string" ? tag.trim() : "",
                    )
                    .filter(Boolean)
                    .map((tag: string, i: number) => (
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
                onChange={(e) => {
                  setFormData((p) => ({
                    ...p,
                    featured: e.target.checked,
                  }));
                  setIsDirty(true);
                }}
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
                  <span className="text-xs text-zinc-500">Select Image</span>
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
                    https://www.knowledgelog.blog/blog/{formData.slug || "..."}
                  </div>
                </div>
              </div>
              <div className="text-[#1a0dab] text-sm font-medium hover:underline truncate">
                {formData.seoTitle || formData.title || "Post Title..."}
              </div>
              <div className="text-xs text-[#4d5156] mt-1 line-clamp-2">
                {formData.seoDescription ||
                  formData.excerpt ||
                  "Description..."}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY MODAL - Black & Yellow Theme */}
      {isCatModalOpen && typeof document !== "undefined"
        ? // Use Portal to break out of sticky sidebar stacking context
          require("react-dom").createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div
                className="bg-[#0a0a0a] border border-yellow-500/30 w-full max-w-sm rounded-xl p-6 shadow-[0_0_50px_-12px_rgba(234,179,8,0.2)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-yellow-500">New Category</span>
                  </h3>
                  <button
                    onClick={() => setIsCatModalOpen(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest mb-1.5 block">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Quantum Computing"
                      className="w-full bg-[#121212] border border-white/10 focus:border-yellow-500 text-white rounded-lg p-3 text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest mb-1.5 block">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={newCatGenre}
                      onChange={(e) => setNewCatGenre(e.target.value)}
                      placeholder="e.g. Technology"
                      className="w-full bg-[#121212] border border-white/10 focus:border-yellow-500 text-white rounded-lg p-3 text-sm outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest mb-1.5 block">
                      Language
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={(formData as any).language || "English"}
                        disabled
                        className="w-full bg-[#121212] border border-white/10 text-zinc-400 rounded-lg p-3 text-sm outline-none cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">
                        (Inherited)
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => setIsCatModalOpen(false)}
                      className="flex-1 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCategory}
                      disabled={isCreatingCat}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isCreatingCat ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
