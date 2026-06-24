import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

// Design System Documentation Component
function DesignSystemDoc() {
  return (
    <div className="p-8 max-w-4xl bg-black text-[#ECEEDF] font-mono uppercase tracking-widest min-h-screen">
      <div className="border-b border-[#ECEEDF]/30 pb-6 mb-12">
        <h1 className="text-3xl font-black tracking-tighter text-white">IMMORTAL RAINDROPS</h1>
        <p className="text-xs text-[#ECEEDF]/50 mt-2 tracking-widest">DESIGN SYSTEM & STYLE GUIDE</p>
      </div>

      {/* SECTION 1: COLORS */}
      <section className="mb-16">
        <h2 className="text-lg font-bold border-b border-[#ECEEDF]/15 pb-2 mb-6 tracking-[0.2em] text-[#ECEEDF]/80">
          01 // COLORS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-[#ECEEDF]/15 p-4 flex flex-col gap-3">
            <div className="w-full h-24 bg-[#ECEEDF] border border-white" />
            <div>
              <div className="font-bold text-xs text-black bg-[#ECEEDF] px-1.5 py-0.5 w-fit mb-1">PRIMARY</div>
              <div className="text-[11px] text-[#ECEEDF]/80">#ECEEDF</div>
              <div className="text-[9px] text-[#ECEEDF]/50 mt-1">THE CORE COLOR OF TEXT, BORDERS AND LABELS.</div>
            </div>
          </div>

          <div className="border border-[#ECEEDF]/15 p-4 flex flex-col gap-3">
            <div className="w-full h-24 bg-red-500 border border-red-400" />
            <div>
              <div className="font-bold text-xs text-white bg-red-500 px-1.5 py-0.5 w-fit mb-1">LIVE ACCENT</div>
              <div className="text-[11px] text-[#ECEEDF]/80">#EF4444 (RED-500)</div>
              <div className="text-[9px] text-[#ECEEDF]/50 mt-1">USED ONLY FOR LIVE STATUSES AND ACTIVE INDICATORS.</div>
            </div>
          </div>

          <div className="border border-[#ECEEDF]/15 p-4 flex flex-col gap-3">
            <div className="w-full h-24 bg-[#0F0E0E] border border-[#ECEEDF]/10" />
            <div>
              <div className="font-bold text-xs text-[#ECEEDF]/80 bg-[#0F0E0E] border border-[#ECEEDF]/20 px-1.5 py-0.5 w-fit mb-1">BACKGROUND</div>
              <div className="text-[11px] text-[#ECEEDF]/80">#000000 / #0F0E0E</div>
              <div className="text-[9px] text-[#ECEEDF]/50 mt-1">DEEP BLACK & DRIFT-BLACK. FOR MAXIMUM CONTRAST.</div>
            </div>
          </div>
        </div>

        <h3 className="text-xs font-bold text-[#ECEEDF]/60 mt-8 mb-4">OPACITY SHADES</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-[#ECEEDF]/10 p-3 bg-white/5">
            <div className="text-xs text-white">100%</div>
            <div className="text-[10px] text-[#ECEEDF]/40 mt-1">HIGH EMPHASIS</div>
          </div>
          <div className="border border-[#ECEEDF]/10 p-3 bg-white/[0.03] opacity-80">
            <div className="text-xs text-[#ECEEDF]/80">80%</div>
            <div className="text-[10px] text-[#ECEEDF]/40 mt-1">BODY TEXT</div>
          </div>
          <div className="border border-[#ECEEDF]/10 p-3 bg-white/[0.02] opacity-60">
            <div className="text-xs text-[#ECEEDF]/60">60%</div>
            <div className="text-[10px] text-[#ECEEDF]/40 mt-1">MUTED INFO</div>
          </div>
          <div className="border border-[#ECEEDF]/10 p-3 bg-white/[0.01] opacity-40">
            <div className="text-xs text-[#ECEEDF]/40">40%</div>
            <div className="text-[10px] text-[#ECEEDF]/40 mt-1">META DATA</div>
          </div>
        </div>
      </section>

      {/* SECTION 2: TYPOGRAPHY */}
      <section className="mb-16">
        <h2 className="text-lg font-bold border-b border-[#ECEEDF]/15 pb-2 mb-6 tracking-[0.2em] text-[#ECEEDF]/80">
          02 // TYPOGRAPHY
        </h2>
        <div className="flex flex-col gap-8">
          <div className="border border-[#ECEEDF]/10 p-6">
            <span className="text-[9px] text-[#ECEEDF]/40 block mb-3">// MONO HEADER_3XL</span>
            <div className="text-3xl font-black tracking-tighter text-white">VOID TRANSMISSION</div>
            <span className="text-[10px] text-[#ECEEDF]/60 block mt-2">font-mono text-3xl font-black tracking-tighter</span>
          </div>

          <div className="border border-[#ECEEDF]/10 p-6">
            <span className="text-[9px] text-[#ECEEDF]/40 block mb-3">// MONO BUTTON / NAV</span>
            <div className="text-xs font-bold tracking-[0.3em]">[ READ_DISPATCH ]</div>
            <span className="text-[10px] text-[#ECEEDF]/60 block mt-2">font-mono text-xs font-bold tracking-[0.3em]</span>
          </div>

          <div className="border border-[#ECEEDF]/10 p-6">
            <span className="text-[9px] text-[#ECEEDF]/40 block mb-3">// SANS BODY / EXCERPT</span>
            <p className="font-sans text-[13px] tracking-widest leading-relaxed lowercase first-letter:uppercase text-[#ECEEDF]/85">
              The digital audio gateway is now open. Broadcasting electronic experiments, drone waves, ambient recordings, and live performances.
            </p>
            <span className="text-[10px] text-[#ECEEDF]/60 block mt-2">font-sans text-[13px] tracking-widest leading-relaxed</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: SPACING */}
      <section className="mb-16">
        <h2 className="text-lg font-bold border-b border-[#ECEEDF]/15 pb-2 mb-6 tracking-[0.2em] text-[#ECEEDF]/80">
          03 // SPACING SCALE
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 border border-[#ECEEDF]/5 p-2">
            <span className="w-16 text-xs text-[#ECEEDF]/40">04PX</span>
            <div className="h-4 bg-[#ECEEDF]/20 w-1" />
            <span className="text-[10px]">gap-1 / py-1</span>
          </div>
          <div className="flex items-center gap-4 border border-[#ECEEDF]/5 p-2">
            <span className="w-16 text-xs text-[#ECEEDF]/40">08PX</span>
            <div className="h-4 bg-[#ECEEDF]/20 w-2" />
            <span className="text-[10px]">gap-2 / py-2</span>
          </div>
          <div className="flex items-center gap-4 border border-[#ECEEDF]/5 p-2">
            <span className="w-16 text-xs text-[#ECEEDF]/40">16PX</span>
            <div className="h-4 bg-[#ECEEDF]/20 w-4" />
            <span className="text-[10px]">gap-4 / py-4</span>
          </div>
          <div className="flex items-center gap-4 border border-[#ECEEDF]/5 p-2">
            <span className="w-16 text-xs text-[#ECEEDF]/40">32PX</span>
            <div className="h-4 bg-[#ECEEDF]/20 w-8" />
            <span className="text-[10px]">gap-8 / py-8</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: BORDERS & SHADOWS */}
      <section className="mb-16">
        <h2 className="text-lg font-bold border-b border-[#ECEEDF]/15 pb-2 mb-6 tracking-[0.2em] text-[#ECEEDF]/80">
          04 // BORDERS & SHADOWS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#ECEEDF]/15 p-6 flex flex-col justify-center items-center h-32">
            <div className="border border-[#ECEEDF]/25 px-6 py-2.5 bg-white/[0.01] text-xs font-bold text-[#ECEEDF]">
              BORDERED CONTAINER
            </div>
            <span className="text-[9px] text-[#ECEEDF]/40 mt-3">border border-[#ECEEDF]/20 bg-white/[0.01]</span>
          </div>

          <div className="border border-[#ECEEDF]/15 p-6 flex flex-col justify-center items-center h-32">
            <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[9px] text-[#ECEEDF]/40 mt-4">GLOW SHADOW: shadow-[0_0_8px_rgba(239,68,68,0.5)]</span>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'System/DesignSystem',
  component: DesignSystemDoc,
  tags: ['autodocs'],
} satisfies Meta<typeof DesignSystemDoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StyleGuide: Story = {};
