'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getAdminNewsPosts,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
  type NewsPost,
} from '@/app/actions/news';
import { getHomepageMediaSettings, updateHomepageMediaSettings } from '@/app/actions/homepage';

type NewsForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  pinned: boolean;
  published_at: string;
};

const emptyForm = (): NewsForm => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
  pinned: false,
  published_at: new Date().toISOString().substring(0, 16),
});

const slugify = (text: string) => (
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
);

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return new Date().toISOString().substring(0, 16);
  return new Date(value).toISOString().substring(0, 16);
};

export default function NewsManager() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [form, setForm] = useState<NewsForm>(emptyForm);
  const [mediaForm, setMediaForm] = useState({
    homepage_instagram_image_url: '',
    homepage_instagram_image_alt: '',
  });

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.published_at || b.created_at || 0).getTime() - new Date(a.published_at || a.created_at || 0).getTime();
    });
  }, [posts]);

  useEffect(() => {
    fetchPosts();
    fetchMediaSettings();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const res = await getAdminNewsPosts();
    if (res.success && res.posts) {
      setPosts(res.posts as NewsPost[]);
    }
    setLoading(false);
  };

  const fetchMediaSettings = async () => {
    const res = await getHomepageMediaSettings();
    if (res.success && res.settings) {
      setMediaForm({
        homepage_instagram_image_url: res.settings.homepage_instagram_image_url || '',
        homepage_instagram_image_alt: res.settings.homepage_instagram_image_alt || '',
      });
    }
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug === slugify(prev.title) || prev.slug === '' ? slugify(value) : prev.slug,
    }));
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingPost(null);
    setForm(emptyForm());
  };

  const handleEdit = (post: NewsPost) => {
    setEditingPost(post);
    setIsCreating(false);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || post.body || '',
      status: post.status || (post.published ? 'published' : 'draft'),
      pinned: post.pinned || post.featured || false,
      published_at: toDatetimeLocal(post.published_at),
    });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      alert('Title, slug, and content are required.');
      return;
    }

    setSaving(true);
    const payload: NewsPost = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      excerpt: form.excerpt.trim() || undefined,
      content: form.content,
      status: form.status,
      pinned: form.pinned,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
    };

    const res = editingPost
      ? await updateNewsPost(editingPost.id!, payload)
      : await createNewsPost(payload);

    setSaving(false);

    if (res.success) {
      setEditingPost(null);
      setIsCreating(false);
      setForm(emptyForm());
      fetchPosts();
    } else {
      alert(`Save failed: ${res.error}`);
    }
  };

  const handleDelete = async (id: string, slug?: string) => {
    if (!confirm('Delete this homepage news post?')) return;
    const res = await deleteNewsPost(id, slug);
    if (res.success) {
      fetchPosts();
    } else {
      alert(`Delete failed: ${res.error}`);
    }
  };

  const handleQuickStatus = async (post: NewsPost, status: 'draft' | 'published') => {
    await updateNewsPost(post.id!, { status });
    fetchPosts();
  };

  const handleQuickPinned = async (post: NewsPost) => {
    await updateNewsPost(post.id!, { pinned: !post.pinned });
    fetchPosts();
  };

  const handleSaveMedia = async () => {
    setMediaSaving(true);
    const res = await updateHomepageMediaSettings({
      homepage_instagram_image_url: mediaForm.homepage_instagram_image_url.trim() || null,
      homepage_instagram_image_alt: mediaForm.homepage_instagram_image_alt.trim() || null,
    });
    setMediaSaving(false);
    if (!res.success) alert(`Homepage media save failed: ${res.error}`);
  };

  if (loading) {
    return <div className="p-8 font-mono text-xs text-[#ECEEDF] animate-pulse">RETRIEVING_HOMEPAGE_NEWS...</div>;
  }

  return (
    <div className="flex flex-col gap-6 pb-32 font-mono animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-4 md:flex-row md:items-center md:justify-between">
            <div className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/40">
              {posts.length} HOMEPAGE_POSTS_INDEXED
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-[#ECEEDF] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-white"
            >
              [ NEW_POST ]
            </button>
          </div>

          {(isCreating || editingPost) && (
            <div className="flex flex-col gap-5 border border-[#ECEEDF]/20 bg-black/40 p-6">
              <h2 className="border-b border-[#ECEEDF]/10 pb-3 text-sm font-bold uppercase tracking-widest text-[#ECEEDF]">
                {editingPost ? `EDIT POST: ${editingPost.title}` : 'NEW HOMEPAGE POST'}
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    className="w-full border border-[#ECEEDF]/20 bg-black p-2.5 text-xs text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                    className="w-full border border-[#ECEEDF]/20 bg-black p-2.5 text-xs text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                  className="h-20 w-full resize-none border border-[#ECEEDF]/20 bg-black p-2.5 text-xs text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">Content</label>
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  className="h-64 w-full resize-none border border-[#ECEEDF]/20 bg-black p-3 text-xs leading-relaxed text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as NewsForm['status'] }))}
                    className="w-full border border-[#ECEEDF]/20 bg-black p-2.5 text-xs text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
                  >
                    <option value="draft">DRAFT</option>
                    <option value="published">PUBLISHED</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">Published At</label>
                  <input
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(event) => setForm((prev) => ({ ...prev, published_at: event.target.value }))}
                    className="w-full border border-[#ECEEDF]/20 bg-black p-2.5 text-xs text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
                  />
                </div>

                <label className="flex items-center justify-between border border-[#ECEEDF]/20 bg-black/40 p-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">PIN POST</span>
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
                    className="h-4 w-4 accent-[#ECEEDF]"
                  />
                </label>
              </div>

              <div className="flex gap-4 border-t border-[#ECEEDF]/10 pt-4">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPost(null);
                    setForm(emptyForm());
                  }}
                  className="flex-1 border border-[#ECEEDF]/20 py-3 text-[10px] uppercase tracking-widest text-[#ECEEDF]/50 hover:bg-[#ECEEDF]/10"
                  disabled={saving}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#ECEEDF] py-3 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-white disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'SYNCING...' : 'SAVE POST'}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 border border-[#ECEEDF]/10 bg-black/40 p-4 md:p-6">
            <h3 className="border-b border-[#ECEEDF]/10 pb-3 text-xs uppercase tracking-widest text-[#ECEEDF]/70">
              HOMEPAGE NEWS QUEUE
            </h3>

            {sortedPosts.length === 0 ? (
              <div className="py-8 text-xs text-[#ECEEDF]/30">NO HOMEPAGE NEWS POSTS INDEXED.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedPosts.map((post) => {
                  const status = post.status || (post.published ? 'published' : 'draft');
                  const pinned = post.pinned || post.featured || false;
                  return (
                    <div
                      key={post.id}
                      className="flex flex-col gap-4 border border-[#ECEEDF]/10 p-4 transition-colors hover:bg-[#ECEEDF]/5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#ECEEDF]">{post.title}</span>
                          {pinned && (
                            <span className="bg-lime-300 px-1 text-[8px] font-bold uppercase text-black">pinned</span>
                          )}
                          <span className="border border-[#ECEEDF]/20 px-1 text-[8px] uppercase text-[#ECEEDF]/50">{status}</span>
                        </div>
                        <span className="text-[9px] tracking-wider text-[#ECEEDF]/40">
                          SLUG: {post.slug} | DATE: {post.published_at ? new Date(post.published_at).toLocaleString() : 'UNSCHEDULED'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleEdit(post)}
                          className="border border-[#ECEEDF]/20 px-3 py-2 text-[9px] uppercase tracking-widest text-[#ECEEDF]/80 hover:bg-[#ECEEDF]/15"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleQuickStatus(post, status === 'published' ? 'draft' : 'published')}
                          className={`border px-3 py-2 text-[9px] uppercase tracking-widest ${status === 'published' ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}`}
                        >
                          {status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                        </button>
                        <button
                          onClick={() => handleQuickPinned(post)}
                          className="border border-lime-300/30 px-3 py-2 text-[9px] uppercase tracking-widest text-lime-300/80 hover:bg-lime-300/10"
                        >
                          {pinned ? 'UNPIN' : 'PIN'}
                        </button>
                        <button
                          onClick={() => handleDelete(post.id!, post.slug)}
                          className="border border-red-900/50 px-3 py-2 text-[9px] uppercase tracking-widest text-red-500 hover:bg-red-950/20"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="h-fit border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-6">
          <h3 className="border-b border-[#ECEEDF]/10 pb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#ECEEDF]/60">
            HOMEPAGE MEDIA
          </h3>
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">
                Instagram / R2 Image URL
              </label>
              <input
                type="url"
                value={mediaForm.homepage_instagram_image_url}
                onChange={(event) => setMediaForm((prev) => ({ ...prev, homepage_instagram_image_url: event.target.value }))}
                placeholder="https://..."
                className="w-full border border-[#ECEEDF]/20 bg-black p-2.5 text-xs text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[9px] uppercase tracking-widest text-[#ECEEDF]/50">
                Image Alt Text
              </label>
              <input
                type="text"
                value={mediaForm.homepage_instagram_image_alt}
                onChange={(event) => setMediaForm((prev) => ({ ...prev, homepage_instagram_image_alt: event.target.value }))}
                className="w-full border border-[#ECEEDF]/20 bg-black p-2.5 text-xs text-[#ECEEDF] focus:border-[#ECEEDF] focus:outline-none"
              />
            </div>

            {mediaForm.homepage_instagram_image_url && (
              <div className="overflow-hidden border border-[#ECEEDF]/10 bg-black/50">
                <img
                  src={mediaForm.homepage_instagram_image_url}
                  alt={mediaForm.homepage_instagram_image_alt || 'Homepage media preview'}
                  className="aspect-square w-full object-cover grayscale"
                />
              </div>
            )}

            <button
              onClick={handleSaveMedia}
              disabled={mediaSaving}
              className="bg-[#ECEEDF] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-white disabled:opacity-50"
            >
              {mediaSaving ? 'SAVING...' : 'SAVE MEDIA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
