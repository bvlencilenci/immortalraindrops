'use client';

import { useState, useEffect } from 'react';
import { getHomepageSettings, getHomepageCMSOptions, updateHomepageSettings } from '@/app/actions/homepage';

interface TrackOption {
  id: string;
  title: string;
  artist: string;
}

interface NewsOption {
  id: string;
  title: string;
}

export default function HomepageManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Options State
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsOption[]>([]);

  // Settings State
  const [form, setForm] = useState({
    hero_mode: 'custom' as 'featured_release' | 'featured_news' | 'featured_artist' | 'custom',
    featured_release_id: '',
    featured_news_id: '',
    featured_artist: '',
    custom_hero_title: '',
    custom_hero_text: '',
    show_news_on_homepage: true,
    announcement_banner: '',
    announcement_enabled: false
  });

  useEffect(() => {
    async function loadData() {
      const [settingsRes, optionsRes] = await Promise.all([
        getHomepageSettings(),
        getHomepageCMSOptions()
      ]);

      if (settingsRes) {
        setForm({
          hero_mode: settingsRes.hero_mode || 'custom',
          featured_release_id: settingsRes.featured_release_id || '',
          featured_news_id: settingsRes.featured_news_id || '',
          featured_artist: settingsRes.featured_artist || '',
          custom_hero_title: settingsRes.custom_hero_title || '',
          custom_hero_text: settingsRes.custom_hero_text || '',
          show_news_on_homepage: settingsRes.show_news_on_homepage !== false,
          announcement_banner: settingsRes.announcement_banner || '',
          announcement_enabled: !!settingsRes.announcement_enabled
        });
      }

      if (optionsRes.success) {
        setTracks(optionsRes.tracks || []);
        setNewsPosts(optionsRes.news || []);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const handleFieldChange = (key: string, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateHomepageSettings({
      hero_mode: form.hero_mode,
      featured_release_id: form.featured_release_id || null,
      featured_news_id: form.featured_news_id || null,
      featured_artist: form.featured_artist || null,
      custom_hero_title: form.custom_hero_title || null,
      custom_hero_text: form.custom_hero_text || null,
      show_news_on_homepage: form.show_news_on_homepage,
      announcement_banner: form.announcement_banner || null,
      announcement_enabled: form.announcement_enabled
    });
    setSaving(false);

    if (res.success) {
      setDirty(false);
    } else {
      alert(`Failed to save homepage settings: ${res.error}`);
    }
  };

  if (loading) return <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8">RETRIEVING_HOMEPAGE_CMS...</div>;

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-5xl font-mono animate-in fade-in duration-500">
      
      {/* CMS sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Section 1: Hero Configuration */}
        <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-6 flex flex-col gap-6 hover:border-[#ECEEDF]/20 transition-colors">
          <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 border-b border-[#ECEEDF]/10 pb-3">
            HERO TRANSMISSION
          </h3>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 block mb-2">
                HERO LAYOUT MODE
              </label>
              <select
                value={form.hero_mode}
                onChange={e => handleFieldChange('hero_mode', e.target.value)}
                className="w-full bg-black border border-[#ECEEDF]/20 p-2.5 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
              >
                <option value="custom">CUSTOM TITLE & TEXT</option>
                <option value="featured_release">FEATURED CATALOG RELEASE</option>
                <option value="featured_news">FEATURED EDITORIAL DISPATCH</option>
                <option value="featured_artist">FEATURED ARTIST</option>
              </select>
            </div>

            {/* Custom Mode Controls */}
            {form.hero_mode === 'custom' && (
              <div className="flex flex-col gap-4 border-l border-[#ECEEDF]/10 pl-4 mt-2">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 block mb-1">
                    Custom Title
                  </label>
                  <input
                    type="text"
                    value={form.custom_hero_title}
                    onChange={e => handleFieldChange('custom_hero_title', e.target.value)}
                    className="w-full bg-black border border-[#ECEEDF]/20 p-2 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 block mb-1">
                    Custom Description
                  </label>
                  <textarea
                    value={form.custom_hero_text}
                    onChange={e => handleFieldChange('custom_hero_text', e.target.value)}
                    className="w-full bg-black border border-[#ECEEDF]/20 p-2 text-xs text-[#ECEEDF] h-24 resize-none focus:outline-none focus:border-[#ECEEDF]"
                  />
                </div>
              </div>
            )}

            {/* Featured Release Controls */}
            {form.hero_mode === 'featured_release' && (
              <div className="flex flex-col gap-4 border-l border-[#ECEEDF]/10 pl-4 mt-2">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 block mb-2">
                    SELECT CATALOG RELEASE
                  </label>
                  {tracks.length === 0 ? (
                    <div className="text-[10px] text-red-400">NO RELEASE ENTRIES IN ARCHIVE.</div>
                  ) : (
                    <select
                      value={form.featured_release_id}
                      onChange={e => handleFieldChange('featured_release_id', e.target.value)}
                      className="w-full bg-black border border-[#ECEEDF]/20 p-2 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                    >
                      <option value="">-- CHOOSE A RELEASE --</option>
                      {tracks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.artist} - {t.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Featured News Controls */}
            {form.hero_mode === 'featured_news' && (
              <div className="flex flex-col gap-4 border-l border-[#ECEEDF]/10 pl-4 mt-2">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 block mb-2">
                    SELECT EDITORIAL POST
                  </label>
                  {newsPosts.length === 0 ? (
                    <div className="text-[10px] text-red-400">NO EDITORIAL POSTS INDEXED.</div>
                  ) : (
                    <select
                      value={form.featured_news_id}
                      onChange={e => handleFieldChange('featured_news_id', e.target.value)}
                      className="w-full bg-black border border-[#ECEEDF]/20 p-2 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                    >
                      <option value="">-- CHOOSE A DISPATCH --</option>
                      {newsPosts.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Featured Artist Controls */}
            {form.hero_mode === 'featured_artist' && (
              <div className="flex flex-col gap-4 border-l border-[#ECEEDF]/10 pl-4 mt-2">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 block mb-1">
                    Featured Artist Name
                  </label>
                  <input
                    type="text"
                    value={form.featured_artist}
                    onChange={e => handleFieldChange('featured_artist', e.target.value)}
                    placeholder="e.g. DJ SODAPOP"
                    className="w-full bg-black border border-[#ECEEDF]/20 p-2 text-xs text-[#ECEEDF] focus:outline-none focus:border-[#ECEEDF]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Global Announcement & Layout preferences */}
        <div className="flex flex-col gap-6">
          
          {/* Announcement Card */}
          <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-6 flex flex-col gap-5 hover:border-[#ECEEDF]/20 transition-colors">
            <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 border-b border-[#ECEEDF]/10 pb-3">
              ANNOUNCEMENT BANNER
            </h3>

            <label className="flex items-center justify-between border border-[#ECEEDF]/15 p-3 bg-black/40 cursor-pointer">
              <span className="text-[10px] uppercase tracking-widest text-[#ECEEDF]">
                DISPLAY BANNER
              </span>
              <input
                type="checkbox"
                checked={form.announcement_enabled}
                onChange={e => handleFieldChange('announcement_enabled', e.target.checked)}
                className="w-4 h-4 accent-[#ECEEDF]"
              />
            </label>

            <div>
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 block mb-1.5">
                Banner Message (TICKER)
              </label>
              <textarea
                value={form.announcement_banner}
                onChange={e => handleFieldChange('announcement_banner', e.target.value)}
                placeholder="Write ticker alert content here..."
                className="w-full bg-black border border-[#ECEEDF]/20 p-2 text-xs text-[#ECEEDF] h-20 resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Homepage Feed Preference */}
          <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-6 flex flex-col gap-4 hover:border-[#ECEEDF]/20 transition-colors">
            <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 border-b border-[#ECEEDF]/10 pb-3">
              LAYOUT PREFERENCES
            </h3>

            <label className="flex items-center justify-between border border-[#ECEEDF]/15 p-3 bg-black/40 cursor-pointer">
              <span className="text-[10px] uppercase tracking-widest text-[#ECEEDF]">
                SHOW DISPATCH FEED ON HOME
              </span>
              <input
                type="checkbox"
                checked={form.show_news_on_homepage}
                onChange={e => handleFieldChange('show_news_on_homepage', e.target.checked)}
                className="w-4 h-4 accent-[#ECEEDF]"
              />
            </label>
          </div>

        </div>

      </div>

      {/* Floating Change Bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 w-full bg-black/90 border-t border-[#ECEEDF]/30 p-4 flex justify-between items-center z-[100] transition-transform animate-in slide-in-from-bottom duration-300">
          <span className="text-[#ECEEDF] text-[10px] tracking-widest uppercase animate-pulse">
            ● CMS CONFIGURATION DIRTY - UNSAVED CHANGES
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#ECEEDF] text-black font-bold text-[10px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-white transition-all shadow-[0_0_20px_rgba(236,238,223,0.25)]"
          >
            {saving ? 'SYNCING...' : 'APPLY_HOMEPAGE_CMS'}
          </button>
        </div>
      )}
    </div>
  );
}
