import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

// Card container helper for options
interface OptionCardProps {
  title: string;
  advantages: string[];
  disadvantages: string[];
  children: React.ReactNode;
}

function OptionCard({ title, advantages, disadvantages, children }: OptionCardProps) {
  return (
    <div className="flex flex-col border border-[#ECEEDF]/15 p-6 bg-black text-[#ECEEDF] font-mono">
      <div className="text-[10px] text-[#ECEEDF]/40 tracking-widest mb-4 uppercase">
        // {title}
      </div>
      
      {/* Live Preview Block */}
      <div className="bg-black/60 border border-[#ECEEDF]/5 p-6 min-h-[90px] flex items-center justify-center mb-6">
        <div className="w-full text-center">{children}</div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] uppercase tracking-wider border-t border-[#ECEEDF]/10 pt-4">
        <div>
          <div className="text-white font-bold mb-1.5 text-[#ECEEDF]">// ADVANTAGES:</div>
          <ul className="list-none pl-0 flex flex-col gap-1 text-[#ECEEDF]/80">
            {advantages.map((adv, idx) => (
              <li key={idx} className="before:content-['+__'] before:text-[#ECEEDF]/50">{adv}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[#ECEEDF]/50 font-bold mb-1.5">// DISADVANTAGES:</div>
          <ul className="list-none pl-0 flex flex-col gap-1 text-[#ECEEDF]/45">
            {disadvantages.map((dis, idx) => (
              <li key={idx} className="before:content-['-__'] before:text-[#ECEEDF]/30">{dis}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Section layout helper
interface SectionProps {
  num: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ num, title, description, children }: SectionProps) {
  return (
    <section className="mb-20 border-b border-[#ECEEDF]/10 pb-16 last:border-b-0 last:pb-0">
      <div className="border-b border-[#ECEEDF]/15 pb-3 mb-6 flex flex-col sm:flex-row sm:items-baseline gap-2">
        <h2 className="text-md md:text-lg font-black tracking-[0.2em] text-white">
          {num} // {title}
        </h2>
        <span className="text-[9px] text-[#ECEEDF]/40 tracking-widest uppercase">
          {description}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{children}</div>
    </section>
  );
}

// Dashboard Main component
function BrandIdentityDashboard() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto bg-[#050505] text-[#ECEEDF] font-mono select-none min-h-screen uppercase tracking-widest">
      
      {/* Header */}
      <div className="border-b border-[#ECEEDF]/30 pb-6 mb-12 flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white leading-none">
          STATION BRAND IDENTITY EXPERIMENTS
        </h1>
        <p className="text-[10px] text-[#ECEEDF]/50 mt-1 tracking-widest leading-relaxed max-w-2xl">
          DESIGN PASS V3: DESIGN CONCEPTS AND EXPERIMENTAL MOOD BOARDS FOR REINFORCING THE TRANSMISSION AND ARCHIVAL AESTHETIC.
        </p>
      </div>

      {/* SECTION 1: TRANSMISSION-STYLE LABELS */}
      <Section 
        num="01" 
        title="TRANSMISSION LABELS" 
        description="metadata flags denoting operational states and DJ source"
      >
        <OptionCard
          title="Option A: Digital Terminal"
          advantages={["Extremely clean and monospaced", "Takes minimal horizontal room", "Matches current brutalist aesthetic"]}
          disadvantages={["Low visual prominence", "Looks standard; used widely across software panels"]}
        >
          <span className="text-xs text-[#ECEEDF]/85 tracking-[0.25em] font-bold">
            [TX.LIVE_09] // HOST: VOIDWALKER
          </span>
        </OptionCard>

        <OptionCard
          title="Option B: Radio Telex (Signal Strip)"
          advantages={["Inverted badge acts as a strong anchor", "High aesthetic contrast draw", "Feels like physically printed tape labels"]}
          disadvantages={["More graphic weight than traditional editorial", "Harder to scale inline inside dense text"]}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="bg-[#ECEEDF] text-black text-[9px] font-bold px-1.5 py-0.5 tracking-normal">TX</span>
            <span className="text-[10px] text-[#ECEEDF]/85 font-bold tracking-[0.2em]">LIVE_BROADCAST // UTC</span>
          </div>
        </OptionCard>

        <OptionCard
          title="Option C: Signal Freq (Abbreviated Freq)"
          advantages={["Rich in analogue radio hardware codes", "Unique branding vocabulary", "Suggests physical spectrum location"]}
          disadvantages={["Wordy metadata string", "Can look cluttered on smaller screens"]}
        >
          <span className="text-[10px] text-[#ECEEDF]/50 tracking-[0.2em] font-bold">
            TX.FREQ: <span className="text-white">87.9MHZ</span> // SIG: <span className="text-red-500">ACTIVE</span> // UTC.2026
          </span>
        </OptionCard>
      </Section>

      {/* SECTION 2: ARCHIVAL METADATA TREATMENTS */}
      <Section 
        num="02" 
        title="ARCHIVAL METADATA" 
        description="formatting style for catalog, date, and release info"
      >
        <OptionCard
          title="Option A: Catalog Prefix (Record Shop)"
          advantages={["Authentic record-crate archive code", "Enforces record-store taxonomy", "Feels tactile and collectible"]}
          disadvantages={["Requires mock catalog code generation", "Longer text footprint in rows"]}
        >
          <span className="text-xs tracking-widest text-[#ECEEDF] font-bold">
            CAT# IR-2026.042 // <span className="text-[#ECEEDF]/50">song</span>
          </span>
        </OptionCard>

        <OptionCard
          title="Option B: Key-Value Dotted Leaders"
          advantages={["Beautiful editorial catalog typography", "Mimics vinyl index tables", "Excellent use of structural spacing"]}
          disadvantages={["High spacing width makes it unfit for narrow sidebars", "Requires grid alignment blocks"]}
        >
          <div className="flex flex-col gap-1 w-48 mx-auto text-left text-[9px] tracking-wider">
            <div className="flex justify-between">
              <span>GENRE</span>
              <span className="text-[#ECEEDF]/35">. . . . . . . .</span>
              <span className="text-white">IDM</span>
            </div>
            <div className="flex justify-between">
              <span>RELEASE</span>
              <span className="text-[#ECEEDF]/35">. . . . . . . .</span>
              <span className="text-white">2001</span>
            </div>
          </div>
        </OptionCard>

        <OptionCard
          title="Option C: Bracketed Compact Pipe"
          advantages={["Extremely dense format", "Fits inline into tiny spaces", "Highly readable in lists"]}
          disadvantages={["Very developer-generic", "Lacks creative editorial character"]}
        >
          <span className="text-xs text-[#ECEEDF]/55 tracking-wider font-light">
            [ IDM | 2001 | 04:42 ]
          </span>
        </OptionCard>
      </Section>

      {/* SECTION 3: TIMESTAMP PRESENTATION */}
      <Section 
        num="03" 
        title="TIMESTAMP LOGGING" 
        description="timing format of transmission feeds and dispatches"
      >
        <OptionCard
          title="Option A: UTC Telex (Military Log)"
          advantages={["High-precision time stamps", "Reinforces global teletype transmission theme", "Fixed spacing prevents jitter"]}
          disadvantages={["Less human-readable than relative (e.g. '12 mins ago')"]}
        >
          <span className="text-[11px] tracking-widest text-white font-bold select-all">
            2026.06.24@00:10:53 UTC
          </span>
        </OptionCard>

        <OptionCard
          title="Option B: Relative Stack (Log Entry)"
          advantages={["Great immediate hierarchy", "Presents absolute log alongside relative duration", "High editorial readability"]}
          disadvantages={["Takes up two metadata blocks", "Slightly less brutalist"]}
        >
          <div className="flex flex-col gap-0.5 text-center">
            <span className="text-[11px] text-white font-black tracking-widest">12 MINS AGO</span>
            <span className="text-[9px] text-[#ECEEDF]/40 tracking-wider">LOGGED // 23:58 UTC</span>
          </div>
        </OptionCard>

        <OptionCard
          title="Option C: Unix Epoch Tick"
          advantages={["Very unique cyberpunk style", "Emphasizes raw numeric telemetry", "Suggests machine database logging"]}
          disadvantages={["Completely unreadable to standard humans", "Purely decorative"]}
        >
          <span className="text-[10px] text-[#ECEEDF]/60 tracking-wider">
            SYS_T+1782240286 // <span className="text-white">00:10 UTC</span>
          </span>
        </OptionCard>
      </Section>

      {/* SECTION 4: DIVIDER SYSTEMS */}
      <Section 
        num="04" 
        title="DIVIDER SYSTEMS" 
        description="rule designs for separating columns and rows"
      >
        <OptionCard
          title="Option A: ASCII Dotted Rule"
          advantages={["Extremely authentic print look", "Mutes boundaries; feels lighter than solid lines", "Retro teletype feeling"]}
          disadvantages={["Can behave unpredictably on fluid responsive widths if not styled as border-dashed"]}
        >
          <div className="w-full flex flex-col gap-2">
            <span className="text-[10px] text-[#ECEEDF]/50">UPPER_BLOCK</span>
            <div className="border-t border-dashed border-[#ECEEDF]/20 w-full my-2 h-0" />
            <span className="text-[10px] text-[#ECEEDF]/50">LOWER_BLOCK</span>
          </div>
        </OptionCard>

        <OptionCard
          title="Option B: Hardware Double Rule"
          advantages={["Very physical hardware styling", "Clean and authoritative dividers", "Excellent visual hierarchy break"]}
          disadvantages={["Overuse adds visual complexity and clutter"]}
        >
          <div className="w-full flex flex-col gap-2">
            <span className="text-[10px] text-[#ECEEDF]/50">UPPER_BLOCK</span>
            <div className="border-y-2 border-double border-[#ECEEDF]/15 py-0.5 my-1" />
            <span className="text-[10px] text-[#ECEEDF]/50">LOWER_BLOCK</span>
          </div>
        </OptionCard>

        <OptionCard
          title="Option C: Block Divider"
          advantages={["Classic print column layout", "Acts as strong section marker", "Identifies sections inline"]}
          disadvantages={["Requires extra HTML markup/text elements", "Less minimal"]}
        >
          <div className="w-full flex flex-col gap-2">
            <span className="text-[10px] text-[#ECEEDF]/50">UPPER_BLOCK</span>
            <div className="flex items-center gap-3 w-full my-2">
              <div className="h-[1px] bg-[#ECEEDF]/10 flex-1" />
              <span className="text-[9px] text-[#ECEEDF]/40 font-bold tracking-[0.3em]">// SECTION_02</span>
              <div className="h-[1px] bg-[#ECEEDF]/10 flex-1" />
            </div>
            <span className="text-[10px] text-[#ECEEDF]/50">LOWER_BLOCK</span>
          </div>
        </OptionCard>
      </Section>

      {/* SECTION 5: TYPOGRAPHY PAIRINGS */}
      <Section 
        num="05" 
        title="TYPOGRAPHY PAIRINGS" 
        description="font combinations for headings, decks, and data labels"
      >
        <OptionCard
          title="Option A: Mono Maxima"
          advantages={["100% theme consistent", "Looks like a terminal output", "No third-party font packages needed"]}
          disadvantages={["Large paragraphs of monospaced fonts are harder to scan", "Lacks editorial press warmth"]}
        >
          <div className="flex flex-col gap-2 text-left">
            <div className="text-sm font-bold tracking-[0.2em] text-white">THE DRIFTING SYSTEM</div>
            <p className="text-[10px] leading-relaxed text-[#ECEEDF]/60 normal-case tracking-wide">
              electronic experiments, drone waves, and live transmission logged daily from the underground.
            </p>
          </div>
        </OptionCard>

        <OptionCard
          title="Option B: Editorial Serif Title / Mono Meta"
          advantages={["Replicates premium printed journals (e.g. The Wire)", "Extremely professional", "Warm editorial tone"]}
          disadvantages={["Breaks the 'strictly monospaced' brutalist developer feel"]}
        >
          <div className="flex flex-col gap-1 text-left">
            <div className="text-base font-serif normal-case tracking-normal text-white italic">
              The Drifting System
            </div>
            <p className="text-[10px] leading-relaxed text-[#ECEEDF]/50 normal-case tracking-wider">
              ELECTRONIC EXPERIMENTATION AND TRANSMISSION LOGGED FROM THE UNDERGROUND.
            </p>
          </div>
        </OptionCard>

        <OptionCard
          title="Option C: Heavy Mono / Sans Deck"
          advantages={["Highly readable description blocks", "Modern tech-press feel", "Clean typographic layout contrast"]}
          disadvantages={["Sans-serif font can feel generic if styled as basic system fonts"]}
        >
          <div className="flex flex-col gap-2 text-left">
            <div className="text-xs font-black tracking-widest text-white uppercase">
              THE DRIFTING SYSTEM
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-[#ECEEDF]/70 normal-case tracking-normal">
              Electronic experiments, drone waves, and live transmission logged daily from the underground.
            </p>
          </div>
        </OptionCard>
      </Section>

      {/* SECTION 6: BROADCAST STATUS SYSTEMS */}
      <Section 
        num="06" 
        title="BROADCAST STATUS" 
        description="operational visual indicators for ongoing streams"
      >
        <OptionCard
          title="Option A: Transmitting Console Log"
          advantages={["Highly operational status detail", "Displays telemetry like signal and system health", "Feels live and active"]}
          disadvantages={["Very technical; lacks clean minimal elegance"]}
        >
          <div className="flex items-center justify-center gap-2 text-[9px] tracking-wider">
            <span className="text-[#ECEEDF]/40">[SYS: OK]</span>
            <span className="text-red-500 font-bold">[TX: ACTIVE]</span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </div>
        </OptionCard>

        <OptionCard
          title="Option B: ASCII Signal Wave"
          advantages={["Extremely authentic radio signal concept", "Adds movement without heavy animations", "Highly custom branding"]}
          disadvantages={["Non-standard text characters might be confusing to screen readers"]}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-red-500 tracking-[0.25em]">
              //\\//\\ TRANSMITTING //\\//\\
            </span>
            <span className="text-[8px] text-[#ECEEDF]/35">SIGNAL.RES.99.8%</span>
          </div>
        </OptionCard>

        <OptionCard
          title="Option C: Bracket Status Block"
          advantages={["Clean, high-legibility layout", "Standard brutalist card formatting", "Fits buttons perfectly"]}
          disadvantages={["Slightly generic; looks like standard dashboard widgets"]}
        >
          <div className="border border-[#ECEEDF]/20 px-6 py-2 bg-white/[0.01] text-[10px] tracking-[0.25em] font-bold text-[#ECEEDF] inline-block">
            STATUS: <span className="text-red-500">LIVE_DJ</span>
          </div>
        </OptionCard>
      </Section>

    </div>
  );
}

const meta = {
  title: 'System/BrandIdentityExperiments',
  component: BrandIdentityDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BrandIdentityDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
