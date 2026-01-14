'use client';

import { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings } from '@/app/actions/settings';

interface Settings {
  site_title: string;
  maintenance_mode: boolean;
  global_announcement: string | null;
  allow_registrations: boolean;
  accent_color: string;
}

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    site_title: '',
    maintenance_mode: false,
    global_announcement: '',
    allow_registrations: true,
    accent_color: '#ECEEDF'
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
          accent_color: data.accent_color || '#ECEEDF'
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

  return (
    <div className="flex flex-col gap-8 max-w-2xl font-mono">
      <div className="border border-[#ECEEDF]/20 p-6 bg-[#ECEEDF]/5">
        <h3 className="text-[#ECEEDF] text-sm uppercase tracking-widest mb-6 border-b border-[#ECEEDF]/10 pb-4">
          GLOBAL CONFIGURATION
        </h3>

        <form action={handleSubmit} className="flex flex-col gap-6">

          {/* Site Title */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/60">Site Title</label>
            <input
              name="site_title"
              defaultValue={settings.site_title}
              className="bg-black border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-sm focus:border-[#ECEEDF] outline-none transition-colors"
              placeholder="IMMORTAL RAINDROPS"
            />
          </div>

          {/* Global Announcement */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/60">Global Announcement (Ticker)</label>
            <textarea
              name="global_announcement"
              defaultValue={settings.global_announcement || ''}
              className="bg-black border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-sm focus:border-[#ECEEDF] outline-none transition-colors h-24 resize-none"
              placeholder="Leave empty to disable..."
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between border border-[#ECEEDF]/10 p-4 bg-black/40">
              <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">Maintenance Mode</label>
              <input
                type="checkbox"
                name="maintenance_mode"
                defaultChecked={settings.maintenance_mode}
                className="w-4 h-4 accent-red-500"
              />
            </div>

            <div className="flex items-center justify-between border border-[#ECEEDF]/10 p-4 bg-black/40">
              <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/80">Allow Registrations</label>
              <input
                type="checkbox"
                name="allow_registrations"
                defaultChecked={settings.allow_registrations}
                className="w-4 h-4 accent-[#ECEEDF]"
              />
            </div>
          </div>

          {/* Accent Color (Hex) */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-[#ECEEDF]/60">Accent Color (HEX)</label>
            <div className="flex gap-2">
              <input
                name="accent_color"
                defaultValue={settings.accent_color}
                className="bg-black border border-[#ECEEDF]/20 text-[#ECEEDF] p-3 text-sm focus:border-[#ECEEDF] outline-none transition-colors w-32 font-mono uppercase"
                placeholder="#ECEEDF"
              />
              <div className="w-12 border border-[#ECEEDF]/20" style={{ backgroundColor: settings.accent_color }}></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 bg-[#ECEEDF] text-black uppercase tracking-widest text-xs py-4 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
}
