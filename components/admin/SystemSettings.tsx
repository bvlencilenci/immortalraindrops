'use client';

import { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings, toggleSetting } from '@/app/actions/settings';
import { useRouter } from 'next/navigation';

interface Config {
  video_overlay_opacity?: number;
  scanline_intensity?: number;
  grid_anim_speed?: number;
  typography_scale?: number;
  volume_cap?: number;
  crossfade_duration?: number;
  radio_buffer_time?: number;
  max_file_size_mb?: number;
  auto_cleanup_interval?: number;
  thumbnail_quality?: number;
  readonly_mode?: boolean;
  api_rate_limit?: number;
  webhook_verbosity?: string;
  twitter_card_type?: string;
  favicon_url?: string;
}

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
  live_broadcast_override: boolean;
  global_grid_scale: number;
  darkness_level: number;
  config: Config;
}

export default function SystemSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
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
    keywords: '',
    live_broadcast_override: false,
    global_grid_scale: 1.0,
    darkness_level: 0.5,
    config: {}
  });

  useEffect(() => {
    async function load() {
      const data = await getSystemSettings();
      if (data) {
        setSettings({
          ...data,
          config: data.config || {}
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleChange = () => {
    setDirty(true);
  };

  const handleToggle = async (key: string, current: boolean) => {
    // Optimistic UI for toggles
    setSettings(prev => ({ ...prev, [key]: !current }));
    const res = await toggleSetting(key, !current);
    if (!res.success) alert('Failed to toggle');
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    const res = await updateSystemSettings(formData);
    setSaving(false);
    if (res?.error) {
      alert(res.error);
    } else {
      setDirty(false);
      // Optional: Flash success
    }
  };

  if (loading) return <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8">INITIALIZING CONTROL SYSTEM...</div>;

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-6 flex flex-col relative group hover:border-[#ECEEDF]/20 transition-colors h-full">
      <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-6 group-hover:opacity-100 transition-opacity">
        {title}
      </h3>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );

  const Control = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 font-mono">{label}</label>
      {children}
    </div>
  );

  const Slider = ({ name, defaultValue, min, max, step, suffix = '' }: any) => (
    <div className="flex items-center gap-4">
      <input
        type="range"
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="flex-1 accent-[#ECEEDF] h-1 bg-[#ECEEDF]/20 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-[10px] font-mono text-[#ECEEDF] w-8 text-right bg-black/50 p-1 border border-[#ECEEDF]/10">
        {defaultValue}{suffix}
      </span>
    </div>
  );

  const Toggle = ({ name, defaultChecked, label }: any) => (
    <div className="flex items-center justify-between border border-[#ECEEDF]/10 p-3 bg-black/40 hover:border-[#ECEEDF]/30 transition-colors">
      <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">{label}</label>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} onChange={handleChange} className="w-4 h-4 accent-[#ECEEDF] cursor-pointer" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-6xl font-mono">

      {/* 1. STATUS HUD */}
      <div>
        <h3 className="text-[#ECEEDF] text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 mb-4 pl-1">
          GLOBAL SYSTEMS
        </h3>
        <div className="grid grid-cols-3 gap-4 border-b border-[#ECEEDF]/10 pb-8">
          <button
            onClick={() => handleToggle('maintenance_mode', settings.maintenance_mode)}
            type="button"
            className={`flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border transition-all duration-300 ${settings.maintenance_mode
              ? 'bg-red-500 text-black border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : 'bg-black/40 border-[#ECEEDF]/10 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/30 hover:text-[#ECEEDF]'
              }`}
          >
            <span>MAINTENANCE</span>
            <span className={`w-2 h-2 rounded-full ${settings.maintenance_mode ? 'bg-black animate-pulse' : 'bg-[#ECEEDF]/20'}`}></span>
          </button>

          <button
            onClick={() => handleToggle('allow_registrations', settings.allow_registrations)}
            type="button"
            className={`flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border transition-all duration-300 ${settings.allow_registrations
              ? 'bg-[#ECEEDF]/10 text-[#ECEEDF] border-[#ECEEDF]/50'
              : 'bg-black/40 border-[#ECEEDF]/10 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/30 hover:text-[#ECEEDF]'
              }`}
          >
            <span>REGISTRATIONS</span>
            <span className={`w-2 h-2 rounded-full ${settings.allow_registrations ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500/50'}`}></span>
          </button>

          <button
            onClick={() => handleToggle('live_broadcast_override', settings.live_broadcast_override)}
            type="button"
            className={`flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold border transition-all duration-300 ${settings.live_broadcast_override
              ? 'bg-[#ECEEDF] text-black border-[#ECEEDF] shadow-[0_0_20px_rgba(236,238,223,0.3)]'
              : 'bg-black/40 border-[#ECEEDF]/10 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/30 hover:text-[#ECEEDF]'
              }`}
          >
            <span>LIVE OVERRIDE</span>
            <span className={`w-2 h-2 rounded-full ${settings.live_broadcast_override ? 'bg-red-500 animate-ping' : 'bg-[#ECEEDF]/20'}`}></span>
          </button>
        </div>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* VIBE ENGINE */}
          <Section title="ATMOSPHERE & VISUALS">
            <Control label="VIDEO OPACITY">
              <Slider name="video_overlay_opacity" defaultValue={settings.config.video_overlay_opacity || 0.5} min="0" max="1" step="0.1" />
            </Control>
            <Control label="SCANLINE STRENGTH">
              <Slider name="scanline_intensity" defaultValue={settings.config.scanline_intensity || 0.0} min="0" max="1" step="0.1" />
            </Control>
            <Control label="GRID SPEED (MS)">
              <Slider name="grid_anim_speed" defaultValue={settings.config.grid_anim_speed || 300} min="0" max="1000" step="50" suffix="ms" />
            </Control>
            <Control label="TEXT SCALE">
              <Slider name="typography_scale" defaultValue={settings.config.typography_scale || 1.0} min="0.8" max="1.5" step="0.05" />
            </Control>
            <Control label="ACCENT COLOR">
              <div className="flex gap-2">
                <input name="accent_color" defaultValue={settings.accent_color} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" onChange={handleChange} />
                <div className="w-8 border border-[#ECEEDF]/20" style={{ backgroundColor: settings.accent_color }}></div>
              </div>
            </Control>
          </Section>

          {/* AUDIO & BROADCAST */}
          <Section title="AUDIO CONTROL">
            <Control label="MAX VOLUME">
              <Slider name="volume_cap" defaultValue={settings.config.volume_cap || 1.0} min="0.1" max="1.0" step="0.1" />
            </Control>
            <Control label="CROSSFADE (SEC)">
              <Slider name="crossfade_duration" defaultValue={settings.config.crossfade_duration || 2.0} min="0" max="10" step="0.5" suffix="s" />
            </Control>
            <Control label="BUFFER (MS)">
              <Slider name="radio_buffer_time" defaultValue={settings.config.radio_buffer_time || 500} min="0" max="5000" step="100" suffix="ms" />
            </Control>
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 font-mono">BROADCAST TITLE</label>
              <input name="site_title" defaultValue={settings.site_title} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs font-mono focus:border-[#ECEEDF] outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-[#ECEEDF]/40 font-mono">TICKER TEXT</label>
              <textarea name="global_announcement" defaultValue={settings.global_announcement || ''} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs h-16 resize-none font-mono focus:border-[#ECEEDF] outline-none" />
            </div>
          </Section>

          {/* ADVANCED SYSTEM */}
          <Section title="SYSTEM CONFIG">
            <Toggle name="readonly_mode" defaultChecked={settings.config.readonly_mode} label="DATABASE LOCK (READ-ONLY)" />
            <Control label="MAX UPLOAD (MB)">
              <input type="number" name="max_file_size_mb" defaultValue={settings.config.max_file_size_mb || 50} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
            <Control label="AUTO-CLEANUP (HOURS)">
              <input type="number" name="auto_cleanup_interval" defaultValue={settings.config.auto_cleanup_interval || 24} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
            <Control label="THUMBNAIL QUALITY">
              <Slider name="thumbnail_quality" defaultValue={settings.config.thumbnail_quality || 0.8} min="0.1" max="1.0" step="0.1" />
            </Control>
            <Control label="API RATE LIMIT">
              <input type="number" name="api_rate_limit" defaultValue={settings.config.api_rate_limit || 60} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
          </Section>

          {/* SOCIAL & SEO */}
          <Section title="SEO & ANALYTICS">
            <Control label="META DESCRIPTION">
              <textarea name="meta_description" defaultValue={settings.meta_description || ''} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs h-20 resize-none font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
            <Control label="KEYWORDS">
              <input name="keywords" defaultValue={settings.keywords || ''} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
            <Control label="SOCIAL CARD STYLE">
              <select name="twitter_card_type" defaultValue={settings.config.twitter_card_type} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none">
                <option value="summary_large_image">LARGE IMAGE</option>
                <option value="summary">SUMMARY</option>
              </select>
            </Control>
            <Control label="SOCIAL LINKS">
              <input name="twitter_url" placeholder="TWITTER / X" defaultValue={settings.twitter_url || ''} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full mb-2 font-mono focus:border-[#ECEEDF] outline-none" />
              <input name="instagram_url" placeholder="INSTAGRAM" defaultValue={settings.instagram_url || ''} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
          </Section>

          {/* CONTENT & FOOTER */}
          <Section title="FOOTER & CONTACT">
            <Control label="FOOTER TEXT">
              <input name="footer_text" defaultValue={settings.footer_text || ''} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
            <Control label="CONTACT EMAIL">
              <input name="contact_email" defaultValue={settings.contact_email || ''} onChange={handleChange} className="bg-black/50 border border-[#ECEEDF]/20 text-[#ECEEDF] p-2 text-xs w-full font-mono focus:border-[#ECEEDF] outline-none" />
            </Control>
          </Section>

        </div>

        {/* FLOATING ACTION BAR */}
        <div className={`fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-[#ECEEDF]/20 p-4 flex justify-between items-center transition-transform duration-300 z-50 ${dirty ? 'translate-y-0' : 'translate-y-full'}`}>
          <span className="text-[#ECEEDF] font-mono text-xs uppercase tracking-widest animate-pulse">
            ●  UNSAVED CHANGES DETECTED
          </span>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#ECEEDF] text-black font-mono text-xs uppercase tracking-widest px-8 py-3 hover:bg-white transition-all shadow-[0_0_20px_rgba(236,238,223,0.3)]"
          >
            {saving ? 'SAVING...' : 'SAVE ALL CHANGES'}
          </button>
        </div>

      </form>
    </div>
  );
}
