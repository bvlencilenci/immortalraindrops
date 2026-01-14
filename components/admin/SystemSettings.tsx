'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SiteSettings {
  id: number;
  is_live: boolean;
  stream_title: string;
  notification_webhook_url: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) setSettings(data);
    setLoading(false);
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', 1);

    if (error) {
      alert(error.message);
    } else {
      setSettings({ ...settings, ...updates });
    }
    setSaving(false);
  };

  if (loading) return <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8">CONNECTING_TO_CORE...</div>;

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-500 max-w-2xl">

      {/* Live Broadcast Control */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[#ECEEDF] font-mono text-sm uppercase tracking-[0.2em]">BROADCAST_OVERRIDE</h2>
          <p className="text-[#ECEEDF]/40 font-mono text-[10px] uppercase tracking-widest">Toggle global live state to control radio behavior.</p>
        </div>

        <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-8 rounded-sm flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-[#ECEEDF] uppercase tracking-wide">LIVE_STREAM_ACTIVE</span>
              <span className="font-mono text-[9px] text-[#ECEEDF]/30 uppercase tracking-widest">Overrides archive playback site-wide</span>
            </div>
            <button
              onClick={() => updateSettings({ is_live: !settings?.is_live })}
              disabled={saving}
              className={`w-16 h-8 rounded-full border transition-all relative flex items-center px-1 ${settings?.is_live
                ? 'border-red-500 bg-red-500/10'
                : 'border-[#ECEEDF]/20 bg-black'
                }`}
            >
              <div className={`w-6 h-6 rounded-full transition-all duration-300 ${settings?.is_live
                ? 'bg-red-500 translate-x-8'
                : 'bg-[#ECEEDF]/20'
                }`} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest">STREAM_TITLE</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={settings?.stream_title || ''}
                onChange={(e) => setSettings(s => s ? { ...s, stream_title: e.target.value } : null)}
                className="flex-1 bg-black border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-sm focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/20"
                placeholder="IDLE..."
              />
              <button
                onClick={() => updateSettings({ stream_title: settings?.stream_title })}
                disabled={saving}
                className="font-mono text-[10px] uppercase tracking-widest bg-[#ECEEDF] text-black px-6 py-2 hover:bg-white transition-all disabled:opacity-50"
              >
                UPDATE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Notifications */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[#ECEEDF] font-mono text-sm uppercase tracking-[0.2em]">WEBHOOK_NOTIFICATIONS</h2>
          <p className="text-[#ECEEDF]/40 font-mono text-[10px] uppercase tracking-widest">Receive alerts for access requests (Discord/Slack hook).</p>
        </div>

        <div className="border border-[#ECEEDF]/10 bg-[#ECEEDF]/5 p-8 rounded-sm flex flex-col gap-2">
          <label className="text-[10px] font-mono text-[#ECEEDF]/40 uppercase tracking-widest">WEBHOOK_URL</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={settings?.notification_webhook_url || ''}
              onChange={(e) => setSettings(s => s ? { ...s, notification_webhook_url: e.target.value } : null)}
              className="flex-1 bg-black border-b border-[#ECEEDF]/20 text-[#ECEEDF] px-0 py-2 font-mono text-xs focus:outline-none focus:border-[#ECEEDF] placeholder-[#ECEEDF]/10"
              placeholder="HTTPS://DISCORD.COM/API/WEBHOOKS/..."
            />
            <button
              onClick={() => updateSettings({ notification_webhook_url: settings?.notification_webhook_url })}
              disabled={saving}
              className="font-mono text-[10px] uppercase tracking-widest bg-[#ECEEDF] text-black px-6 py-2 hover:bg-white transition-all disabled:opacity-50"
            >
              SAVE_HOOK
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="flex flex-col gap-4 opacity-30 pointer-events-none">
        <div className="flex flex-col gap-1">
          <h2 className="text-[#ECEEDF] font-mono text-sm uppercase tracking-[0.2em]">CORE_SYSTEM_METRICS</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-[#ECEEDF]/10 p-4 font-mono">
            <div className="text-[9px] text-[#ECEEDF]/40 uppercase mb-2">CPU_LOAD</div>
            <div className="text-xs text-[#ECEEDF]">0.12%</div>
          </div>
          <div className="border border-[#ECEEDF]/10 p-4 font-mono">
            <div className="text-[9px] text-[#ECEEDF]/40 uppercase mb-2">UPTIME</div>
            <div className="text-xs text-[#ECEEDF]">42D 12H</div>
          </div>
          <div className="border border-[#ECEEDF]/10 p-4 font-mono">
            <div className="text-[9px] text-[#ECEEDF]/40 uppercase mb-2">DB_STATE</div>
            <div className="text-xs text-green-500">SYNCED</div>
          </div>
          <div className="border border-[#ECEEDF]/10 p-4 font-mono">
            <div className="text-[9px] text-[#ECEEDF]/40 uppercase mb-2">IO_RATE</div>
            <div className="text-xs text-[#ECEEDF]">12 KB/S</div>
          </div>
        </div>
      </div>

    </div>
  );
}
