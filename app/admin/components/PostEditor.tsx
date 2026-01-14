"use client";

import { Button } from '@/app/components/ui/Button';
import { RichTextEditor } from '@/app/components/editor/RichTextEditor';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Icons
const Icons = {
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Sparkles: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
};

interface PostEditorProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function PostEditor({ initialData, isEdit = false }: PostEditorProps) {
  const router = useRouter();
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Artificial Intelligence',
      tags: '',
      image: '', 
      featured: false
  });

  useEffect(() => {
    if (initialData) {
        setFormData({
            title: initialData.title || '',
            slug: initialData.slug || '',
            excerpt: initialData.excerpt || '',
            content: initialData.content || '',
            category: initialData.category || 'Artificial Intelligence',
            tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''),
            image: initialData.image || '',
            featured: initialData.featured || false
        });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value: string) => {
      setFormData(prev => ({ ...prev, content: value }));
  };

  // Reusable Upload Helper
  const uploadFile = async (file: File): Promise<string> => {
      setUploading(true);
      const data = new FormData();
      data.append('file', file);
  
      try {
          const res = await fetch('/api/upload', {
              method: 'POST',
              body: data
          });
          const json = await res.json();
          if (json.url) {
              return json.url;
          } else {
              throw new Error('No URL returned');
          }
      } catch (err) {
          console.error("Upload failed", err);
          alert("Image upload failed");
          return '';
      } finally {
          setUploading(false);
      }
  };

  // Featured Image Handler
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadFile(file);
    if (url) {
        setFormData(prev => ({ ...prev, image: url }));
    }
  };

  const handleSubmit = async () => {
      if (!formData.title || !formData.slug || !formData.content) {
          alert("Please fill in required fields");
          return;
      }
      
      setIsSubmitting(true);
      try {
          const url = isEdit ? `/api/posts/${initialData._id}` : '/api/posts';
          const method = isEdit ? 'PATCH' : 'POST';

          const res = await fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ...formData,
                  tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
              })
          });

          if (res.ok) {
              alert(isEdit ? "Post updated successfully!" : "Post published successfully!");
              router.push('/admin/posts'); // Redirect to posts list
              router.refresh(); 
          } else {
              const error = await res.json();
              alert(error.error || "Failed to publish");
          }
      } catch (err) {
          console.error(err);
          alert("Something went wrong");
      } finally {
          setIsSubmitting(false);
      }
  };
  
  return (
    <div className="max-w-[1600px] mx-auto pb-20">
        
        {/* Header Actions */}
        <div className="sticky top-0 z-30 bg-[#000000]/80 backdrop-blur-xl border-b border-white/10 -mx-8 px-8 py-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center text-black font-bold">
                    P
                 </div>
                 <div>
                    <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Post' : 'Create New Post'}</h1>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className={`h-2 w-2 rounded-full ${isEdit ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {isEdit ? 'Editing Mode' : 'Draft - Unsaved changes'}
                    </div>
                 </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                    <Icons.Eye /> Preview
                 </Button>
                 <div className="h-6 w-px bg-white/10 mx-1"></div>
                 
                 {isEdit && (
                     <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                        onClick={async () => {
                            if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
                            setIsSubmitting(true);
                            try {
                                const res = await fetch(`/api/posts/${initialData._id}`, { method: 'DELETE' });
                                if (res.ok) {
                                    router.push('/admin/posts');
                                    router.refresh();
                                } else {
                                    const json = await res.json();
                                    alert(json.error || "Failed to delete");
                                }
                            } catch (e) {
                                alert("Error deleting post");
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                        disabled={isSubmitting}
                     >
                        Delete
                     </Button>
                 )}

                 <Button variant="primary" size="sm" className="px-6" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (isEdit ? 'Update Post' : 'Publish')}
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
                        className="w-full bg-transparent border-none px-0 py-2 text-5xl md:text-6xl font-black tracking-tight text-white placeholder:text-zinc-800 focus:outline-none focus:ring-0 focus:placeholder:text-zinc-600 transition-all font-display"
                     />
                     
                     <div className="flex flex-col gap-4 pl-1">
                        {/* Slug Section */}
                        <div className="flex items-center gap-3 text-zinc-500 text-sm font-mono group">
                            <span className="text-accent/50 group-hover:text-accent transition-colors">GET</span>
                            <span>/blog/</span>
                            <div className="relative flex-1 max-w-md flex items-center">
                                <input 
                                    type="text" 
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    placeholder="url-slug-goes-here" 
                                    className="w-full bg-white/5 border border-white/5 rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-colors"
                                />
                                <button className="absolute right-1 p-1 hover:bg-white/10 rounded text-accent" title="Generate with AI">
                                     <Icons.Sparkles /> 
                                </button>
                            </div>
                        </div>

                         {/* Description Section */}
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Short Description / Excerpt</label>
                             <textarea 
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Enter a compelling summary for search results and social cards..."
                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-4 text-zinc-300 text-sm leading-relaxed focus:outline-none focus:border-accent/50 resize-none"
                             ></textarea>
                         </div>
                     </div>
                </div>

                <RichTextEditor value={formData.content} onChange={handleContentChange} onImageUpload={uploadFile} />
            </div>

            {/* Sidebar Settings Column */}
            <div className="space-y-6">
                 {/* SEO Score Card */}
                 <div className="bg-card border border-white/5 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">SEO Score</h3>
                        <div className="text-2xl font-bold text-yellow-500">76<span className="text-xs text-zinc-500 font-normal">/100</span></div>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-4">
                        <div className="bg-yellow-500 h-full w-[76%]"></div>
                    </div>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-green-400">
                            <Icons.Check /> <span className="text-zinc-400">Keyword in title</span>
                        </li>
                         <li className="flex items-center gap-2 text-green-400">
                            <Icons.Check /> <span className="text-zinc-400">Meta description present</span>
                        </li>
                         <li className="flex items-center gap-2 text-zinc-600">
                            <div className="h-4 w-4 rounded-full border border-zinc-600"></div> <span className="text-zinc-500">Internal links count (0/3)</span>
                        </li>
                    </ul>
                 </div>

                 <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Publishing</label>
                        <div className="space-y-3">
                             <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
                                <select 
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
                                >
                                    <option>Artificial Intelligence</option>
                                    <option>Quantum Computing</option>
                                    <option>Space Tech</option>
                                    <option>Biotech</option>
                                    <option>Cybersecurity</option>
                                    <option>Quantum Physics</option>
                                    <option>Astrophysics</option>
                                    <option>Chemistry</option>
                                    <option>Mathematics</option>
                                </select>
                             </div>
                              <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tags (comma separated)</label>
                                <input 
                                    type="text" 
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    placeholder="Add tags..." 
                                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
                                />
                             </div>
                              <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="featured"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData(p => ({...p, featured: e.target.checked}))}
                                    className="rounded bg-[#121212] border-white/10"
                                />
                                <label htmlFor="featured" className="text-sm text-zinc-300">Featured Post</label>
                             </div>
                        </div>
                     </div>
                     
                     <div className="pt-4 border-t border-white/5">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Assets</label>
                        <div className="relative border border-dashed border-white/10 rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer bg-white/[0.02]">
                             <input type="file" onChange={handleFeaturedImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                             {uploading ? (
                                 <div className="text-accent text-sm">Uploading...</div>
                             ) : formData.image ? (
                                 <div className="text-green-500 text-sm truncate">{formData.image.split('/').pop()}</div>
                             ) : (
                                 <>
                                    <div className="text-zinc-400 text-sm font-medium mb-1">Featured Image</div>
                                    <div className="text-[10px] text-zinc-600 uppercase">Drop or Click</div>
                                 </>
                             )}
                        </div>
                     </div>
                 </div>
                 
                 <div className="bg-card border border-white/5 rounded-xl p-6">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowSeoPreview(!showSeoPreview)}>
                        <h3 className="text-sm font-bold text-white">Google Search Preview</h3>
                        <Icons.Search />
                    </div>
                    {showSeoPreview && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                             <div className="bg-white rounded-lg p-3 max-w-full overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-6 w-6 rounded-full bg-zinc-200"></div>
                                    <div>
                                        <div className="text-[10px] text-zinc-800 font-bold">KnowledgeLog</div>
                                        <div className="text-[8px] text-zinc-500">https://knowledgelog.com/blog/{formData.slug || '...'}</div>
                                    </div>
                                </div>
                                <div className="text-[#1a0dab] text-sm font-medium hover:underline truncate">
                                    {formData.title || 'Post Title...'}
                                </div>
                                <div className="text-xs text-[#4d5156] mt-1 line-clamp-2">
                                    {formData.excerpt || 'Description...'}
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
