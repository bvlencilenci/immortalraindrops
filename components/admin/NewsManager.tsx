'use client';

import { useState, useEffect, useRef } from 'react';
import { getAdminNewsPosts, createNewsPost, updateNewsPost, deleteNewsPost, type NewsPost } from '@/app/actions/news';

export default function NewsManager() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [form, setForm] = useState<{
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    type: 'news' | 'release' | 'event' | 'editorial';
    featured: boolean;
    published: boolean;
    published_at: string;
    cover_image: string;
  }>({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    type: 'news',
    featured: false,
    published: false,
    published_at: '',
    cover_image: ''
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const res = await getAdminNewsPosts();
    if (res.success && res.posts) {
      setPosts(res.posts as NewsPost[]);
    }
    setLoading(false);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleTitleChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      title: val,
      slug: prev.slug === slugify(prev.title) || prev.slug === '' ? slugify(val) : prev.slug
    }));
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingPost(null);
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      body: '',
      type: 'news',
      featured: false,
      published: false,
      published_at: new Date().toISOString().substring(0, 16),
      cover_image: ''
    });
    setCoverFile(null);
  };

  const handleEdit = (post: NewsPost) => {
    setEditingPost(post);
    setIsCreating(false);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      body: post.body,
      type: post.type,
      featured: post.featured || false,
      published: post.published || false,
      published_at: post.published_at ? new Date(post.published_at).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
      cover_image: post.cover_image || ''
    });
    setCoverFile(null);
  };

  const handleUploadCover = async (postId: string): Promise<string | null> => {
    if (!coverFile) return form.cover_image || null;

    setUploading(true);
    try {
      const ext = coverFile.name.split('.').pop();
      const res = await fetch('/api/godmode/sign-news-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          ext,
          contentType: coverFile.type
        })
      });

      if (!res.ok) throw new Error('Failed to sign upload request');
      const { uploadUrl, coverKey } = await res.json();

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: coverFile,
        headers: { 'Content-Type': coverFile.type }
      });

      if (!putRes.ok) throw new Error('Failed to upload file to R2');

      return coverKey;
    } catch (e: any) {
      alert(`Cover image upload failed: ${e.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.body) {
      alert('Title, Slug, and Body are required.');
      return;
    }

    setUploading(true);

    let tempPostId = editingPost?.id || 'temp-' + Date.now();
    let finalCoverKey = form.cover_image;

    if (coverFile) {
      const uploadedKey = await handleUploadCover(tempPostId);
      if (uploadedKey) finalCoverKey = uploadedKey;
    }

    const payload: NewsPost = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      body: form.body,
      type: form.type,
      featured: form.featured,
      published: form.published,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      cover_image: finalCoverKey
    };

    if (editingPost) {
      const res = await updateNewsPost(editingPost.id!, payload);
      if (res.success) {
        setEditingPost(null);
        fetchPosts();
      } else {
        alert(`Update failed: ${res.error}`);
      }
    } else {
      const res = await createNewsPost(payload);
      if (res.success) {
        setIsCreating(false);
        fetchPosts();
      } else {
        alert(`Creation failed: ${res.error}`);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, slug?: string) => {
    if (!confirm('Are you sure you want to delete this dispatch?')) return;
    const res = await deleteNewsPost(id, slug);
    if (res.success) {
      fetchPosts();
    } else {
      alert(`Delete failed: ${res.error}`);
    }
  };

  if (loading) return <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8">RETRIEVING_DISPATCHES...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-mono">
      {/* 1. News Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#ECEEDF]/5 p-4 border border-[#ECEEDF]/10 rounded-sm">
        <div className="text-[#ECEEDF]/40 text-[10px] uppercase tracking-widest">
          {posts.length} DISPATCHES_INDEXED
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-[#ECEEDF] text-black font-bold text-[10px] uppercase tracking-widest px-6 py-3 hover:bg-white transition-colors"
        >
          [ NEW_DISPATCH ]
        </button>
      </div>

      {/* 2. Form for Edit / Create */}
      {(isCreating || editingPost) && (
        <div className="border border-[#ECEEDF]/20 p-6 bg-black/40 flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-[#ECEEDF]/10 pb-3">
            {editingPost ? `EDIT DISPATCH: ${editingPost.title}` : 'NEW DISPATCH'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                  className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">Category / Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                >
                  <option value="news">NEWS / UPDATE</option>
                  <option value="release">RELEASE ANNOUNCEMENT</option>
                  <option value="event">EVENT / SHOW</option>
                  <option value="editorial">EDITORIAL / MANIFESTO</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] h-20 resize-none focus:outline-none focus:border-[#ECEEDF]"
                  placeholder="Short brief of dispatch..."
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">Cover Image</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-[#ECEEDF]/20 px-4 py-2 hover:bg-[#ECEEDF]/10 text-xs text-[#ECEEDF]"
                  >
                    {coverFile ? coverFile.name : '[ SELECT IMAGE ]'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={e => e.target.files?.[0] && setCoverFile(e.target.files[0])}
                    accept="image/*"
                  />
                  {form.cover_image && (
                    <span className="text-[10px] text-[#ECEEDF]/40 flex items-center">
                      CURRENT: {form.cover_image.split('/').pop()}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <label className="flex items-center justify-between border border-[#ECEEDF]/20 p-3 bg-black/40 cursor-pointer">
                  <span className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">FEATURED</span>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 accent-[#ECEEDF]"
                  />
                </label>

                <label className="flex items-center justify-between border border-[#ECEEDF]/20 p-3 bg-black/40 cursor-pointer">
                  <span className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">PUBLISHED</span>
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))}
                    className="w-4 h-4 accent-[#ECEEDF]"
                  />
                </label>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">
                  PUBLISH DATE / SCHEDULE
                </label>
                <input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={e => setForm(prev => ({ ...prev, published_at: e.target.value }))}
                  className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                />
              </div>

              {editingPost && (
                <div>
                  <a
                    href={`/news/${form.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[10px] tracking-widest text-white underline"
                  >
                    [ PREVIEW PUBLIC ARTICLE ]
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2">
            <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/50 mb-1.5 block">Body Content (Raw text/Markdown)</label>
            <textarea
              value={form.body}
              onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
              className="w-full bg-black border border-[#ECEEDF]/20 p-3 text-xs text-[#ECEEDF] h-64 focus:outline-none focus:border-[#ECEEDF] font-mono leading-relaxed"
            />
          </div>

          <div className="flex gap-4 border-t border-[#ECEEDF]/10 pt-4">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingPost(null);
              }}
              className="flex-1 border border-[#ECEEDF]/20 py-3 uppercase text-[10px] tracking-widest text-[#ECEEDF]/50 hover:bg-[#ECEEDF]/10"
              disabled={uploading}
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-[#ECEEDF] text-black py-3 uppercase text-[10px] font-bold tracking-widest hover:bg-white"
              disabled={uploading}
            >
              {uploading ? 'SYNCING...' : 'SAVE DISPATCH'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Dispatches Grid / Table List */}
      <div className="border border-[#ECEEDF]/10 bg-black/40 p-4 md:p-6 flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-widest text-[#ECEEDF]/70 border-b border-[#ECEEDF]/10 pb-3">
          DISPATCH QUEUE
        </h3>

        {posts.length === 0 ? (
          <div className="text-[#ECEEDF]/30 text-xs py-8">NO DISPATCHES INTERCEPTED.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map(post => (
              <div
                key={post.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between border border-[#ECEEDF]/10 p-4 hover:bg-[#ECEEDF]/5 transition-colors gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF]">
                      {post.title}
                    </span>
                    <span className="text-[8px] border border-[#ECEEDF]/20 px-1 text-[#ECEEDF]/50 uppercase">
                      {post.type}
                    </span>
                    {post.featured && (
                      <span className="text-[8px] bg-red-500 text-black font-bold px-1 uppercase">
                        featured
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-[#ECEEDF]/40 tracking-wider">
                    SLUG: {post.slug} | DATE: {post.published_at ? new Date(post.published_at).toLocaleString() : 'UNSCHEDULED'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(post)}
                    className="border border-[#ECEEDF]/20 text-[9px] tracking-widest uppercase hover:bg-[#ECEEDF]/15 px-3 py-2 text-[#ECEEDF]/80"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => {
                      const nextStatus = !post.published;
                      updateNewsPost(post.id!, { published: nextStatus }).then(() => fetchPosts());
                    }}
                    className={`border text-[9px] tracking-widest uppercase px-3 py-2 ${post.published ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}`}
                  >
                    {post.published ? 'PUBLISHED' : 'DRAFT'}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id!, post.slug)}
                    className="border border-red-900/50 text-red-500 text-[9px] tracking-widest uppercase hover:bg-red-950/20 px-3 py-2"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
