'use client';

import { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings } from '@/app/actions/settings';

interface Settings {
  site_title: string;
  maintenance_mode: boolean;
  global_announcement: string | null;
  allow_registrations: boolean;
  accent_color: string;
  footer_text: string | null;
  contact_email: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  meta_description: string | null;
  keywords: string | null;
}

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    site_title: '',
    maintenance_mode: false,
    global_announcement: '',
    allow_registrations: true,
    accent_color: '#ECEEDF',
    footer_text: '',
    contact_email: '',
    twitter_url: '',
    instagram_url: '',
    youtube_url: '',
    meta_description: '',
    keywords: ''
  });

  useEffect(() => {
    async function load() {
      const data = await getSystemSettings();
      if (data) {
        setSettings({
          site_title: data.site_title || '',
          maintenance_mode: data.maintenance_mode || false,
          global_announcement: data.global_announcement || '',
          allow_registrations: data.allow_registrations !== false, // default true
          accent_color: data.accent_color || '#ECEEDF',
          footer_text: data.footer_text || '',
          contact_email: data.contact_email || '',
          twitter_url: data.twitter_url || '',
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
          meta_description: data.meta_description || '',
          keywords: data.keywords || ''
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    const res = await updateSystemSettings(formData);
    setSaving(false);
    if (res?.error) {
      alert(res.error);
    } else {
      alert('SETTINGS UPDATED');
    }
  };

  if (loading) return <div className="text-[#ECEEDF] font-mono text-xs animate-pulse">LOADING CONFIG...</div>;

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="border-b border-[#ECEEDF]/10 pb-2 mb-4 mt-8 first:mt-0">
      <h3 className="text-[#ECEEDF] text-xs uppercase tracking-[0.2em] font-bold opacity-70">{title}</h3>
    </div>
  );

  const InputGroup = ({ label, name, defaultValue, placeholder, type = "text" }: any) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/50">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue || ''}
        className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-xs font-mono focus:border-[#ECEEDF] outline-none transition-colors w-full"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-4xl font-mono pb-20">
      <form action={handleSubmit} className="flex flex-col gap-4">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* COLUMN 1: GENERAL & CONTENT */}
          <div className="flex flex-col gap-6">
            <div className="border border-[#ECEEDF]/10 p-6 bg-[#ECEEDF]/5">
              <SectionHeader title="GENERAL" />
              <div className="flex flex-col gap-4">
                <InputGroup label="Site Title" name="site_title" defaultValue={settings.site_title} placeholder="IMMORTAL RAINDROPS" />

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between border border-[#ECEEDF]/10 p-3 bg-black/40 hover:border-[#ECEEDF]/30 transition-colors">
                    <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">Maintenance Mode</label>
                    <input type="checkbox" name="maintenance_mode" defaultChecked={settings.maintenance_mode} className="w-4 h-4 accent-red-500" />
                  </div>
                  <div className="flex items-center justify-between border border-[#ECEEDF]/10 p-3 bg-black/40 hover:border-[#ECEEDF]/30 transition-colors">
                    <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">Open Registrations</label>
                    <input type="checkbox" name="allow_registrations" defaultChecked={settings.allow_registrations} className="w-4 h-4 accent-[#ECEEDF]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#ECEEDF]/10 p-6 bg-[#ECEEDF]/5">
              <SectionHeader title="CONTENT" />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/50">Global Announcement</label>
                  <textarea
                    name="global_announcement"
                    defaultValue={settings.global_announcement || ''}
                    className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-xs font-mono focus:border-[#ECEEDF] outline-none transition-colors h-20 resize-none"
                    placeholder="Ticker message..."
                  />
                </div>
                <InputGroup label="Footer Text" name="footer_text" defaultValue={settings.footer_text} placeholder="© 2026 IMMORTAL RAINDROPS" />
              </div>
            </div>
          </div>

          {/* COLUMN 2: CONNECT, SEO, VISUAL */}
          <div className="flex flex-col gap-6">
            <div className="border border-[#ECEEDF]/10 p-6 bg-[#ECEEDF]/5">
              <SectionHeader title="CONNECT" />
              <div className="flex flex-col gap-4">
                <InputGroup label="Contact Email" name="contact_email" defaultValue={settings.contact_email} type="email" placeholder="contact@domain.com" />
                <InputGroup label="Twitter / X URL" name="twitter_url" defaultValue={settings.twitter_url} placeholder="https://x.com/..." />
                <InputGroup label="Instagram URL" name="instagram_url" defaultValue={settings.instagram_url} placeholder="https://instagram.com/..." />
                <InputGroup label="YouTube URL" name="youtube_url" defaultValue={settings.youtube_url} placeholder="https://youtube.com/..." />
              </div>
            </div>

            <div className="border border-[#ECEEDF]/10 p-6 bg-[#ECEEDF]/5">
              <SectionHeader title="SEO / META" />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/50">Meta Description</label>
                  <textarea
                    name="meta_description"
                    defaultValue={settings.meta_description || ''}
                    className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-xs font-mono focus:border-[#ECEEDF] outline-none transition-colors h-20 resize-none"
                    placeholder="Brief site description for search engines..."
                  />
                </div>
                <InputGroup label="Keywords (Comma Sep)" name="keywords" defaultValue={settings.keywords} placeholder="art, music, visual, ..." />
              </div>
            </div>

            <div className="border border-[#ECEEDF]/10 p-6 bg-[#ECEEDF]/5">
              <SectionHeader title="VISUAL" />
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/50">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    name="accent_color"
                    defaultValue={settings.accent_color}
                    className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-xs font-mono focus:border-[#ECEEDF] outline-none transition-colors w-full"
                    placeholder="#ECEEDF"
                  />
                  <div className="w-10 border border-[#ECEEDF]/20 shrink-0" style={{ backgroundColor: settings.accent_color }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-8 right-8 z-[60] flex gap-4">
          {/* We already have EXIT button there, maybe stack them? */}
          {/* Actually, let's put it in the form flow for now to avoid specific z-index wars with other fixed elements */}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="sticky bottom-0 bg-[#ECEEDF] text-black border border-[#ECEEDF] uppercase tracking-[0.2em] text-xs py-4 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(236,238,223,0.1)]"
        >
          {saving ? 'SAVING CONFIGURATION...' : 'SAVE ALL CHANGES'}
        </button>

      </form>
    </div>
  );
}
