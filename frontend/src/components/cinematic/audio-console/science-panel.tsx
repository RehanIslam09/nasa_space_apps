'use client';

import { useState } from 'react';
import { BookOpen, Mic, MicOff, ExternalLink, ShieldAlert, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import type { AccessibilityResponse } from '@nasa-experience/contracts';
import type { SonicTrackConfig } from '@/config/earth-song.config';

/**
 * TUNING CONSTANTS — Science & Learn Panel
 */
export const TUNING = {
  previewSentenceCount: 2,
};

interface SciencePanelProps {
  activeTrack: SonicTrackConfig;
  accessibilityData: AccessibilityResponse | null;
  isSpeaking?: boolean;
  onToggleSpeech?: (text: string) => void;
}

export function SciencePanel({
  activeTrack,
  accessibilityData,
  isSpeaking = false,
  onToggleSpeech,
}: SciencePanelProps) {
  const [fullSummaryExpanded, setFullSummaryExpanded] = useState(false);
  const [goodToKnowExpanded, setGoodToKnowExpanded] = useState(false);

  const fullText =
    accessibilityData?.plain_language_summary ||
    activeTrack.description ||
    'Sonification of NASA Earth observation data translating planetary cycles into audible frequencies.';

  // Short 2-sentence preview for clean, approachable readability
  const sentences = fullText.split(/(?<=[.?!])\s+/);
  const shortPreview =
    sentences.length > 2
      ? sentences.slice(0, 2).join(' ')
      : fullText;

  const speechNarrative = `${activeTrack.title}. ${fullText} ${
    accessibilityData?.audio_guide ? `Audio Guide: ${accessibilityData.audio_guide}` : ''
  }`;

  return (
    <div
      id="science-legend-panel"
      role="region"
      aria-label="Scientific Interpretation and Audio Legend"
      className="space-y-4 text-white"
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP ROW: Title & Prominent "Describe Sound" (Speech) Button
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-amber-400" />
          <h4 className="font-semibold text-sm tracking-wide text-white uppercase">
            Learn the Science
          </h4>
        </div>

        {onToggleSpeech && (
          <button
            type="button"
            onClick={() => onToggleSpeech(speechNarrative)}
            aria-label={isSpeaking ? 'Stop speaking audio description' : 'Speak audio description'}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
              isSpeaking
                ? 'border-amber-400 bg-amber-500/30 text-amber-200 animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                : 'border-white/15 bg-white/10 text-slate-200 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-white'
            }`}
          >
            {isSpeaking ? (
              <>
                <MicOff className="size-3.5 text-amber-300" />
                <span>Speaking...</span>
              </>
            ) : (
              <>
                <Mic className="size-3.5 text-amber-400" />
                <span>Describe sound</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BLOCK 1: "What you're hearing" (Short + Expander)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-1.5">
          <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
            What you&apos;re hearing
          </h5>
          <span className="font-mono text-[9px] text-slate-500 uppercase">
            NASA Observation Context
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-200">
          {fullSummaryExpanded ? fullText : shortPreview}
        </p>

        {sentences.length > 2 && (
          <button
            type="button"
            onClick={() => setFullSummaryExpanded(!fullSummaryExpanded)}
            className="mt-2 text-xs font-semibold text-amber-300 hover:text-amber-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {fullSummaryExpanded ? 'Show less' : 'Read the full explanation →'}
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BLOCK 2: "How data becomes sound" (Clean 2-Column List)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
            How data becomes sound
          </h5>
          <span className="font-mono text-[9px] text-slate-500 uppercase">
            Acoustic Mapping Guide
          </span>
        </div>

        {accessibilityData?.screen_reader_legend && accessibilityData.screen_reader_legend.length > 0 ? (
          <div className="space-y-2">
            {accessibilityData.screen_reader_legend.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-xl border border-white/5 bg-black/50 p-3 text-xs transition-colors hover:border-amber-400/30"
              >
                {/* Left column: Data source / scientific variable */}
                <div className="sm:col-span-5 flex flex-col justify-center">
                  <span className="font-semibold text-white">
                    {item.layer_name || item.scientific_variable}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] text-amber-300">
                    {item.pitch_range}
                  </span>
                </div>

                {/* Right column: How it sounds & reasoning */}
                <div className="sm:col-span-7 flex flex-col justify-center text-slate-300">
                  <div className="font-mono text-[11px] text-slate-200">
                    <span className="font-bold text-amber-400">Acoustic: </span>
                    {item.audio_characteristic} ({item.synthesis_timbre})
                  </div>
                  {item.scientific_reasoning && (
                    <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                      {item.scientific_reasoning}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-xl border border-white/5 bg-black/50 p-3 text-xs">
            <div className="sm:col-span-5 flex flex-col justify-center">
              <span className="font-semibold text-white">Planetary Telemetry Data</span>
              <span className="mt-0.5 font-mono text-[10px] text-amber-300">136.10 Hz (Year Tone)</span>
            </div>
            <div className="sm:col-span-7 flex flex-col justify-center text-slate-300">
              <div className="font-mono text-[11px] text-slate-200">
                <span className="font-bold text-amber-400">Acoustic: </span>
                Multi-harmonic algorithmic sonification
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                Direct continuous mapping of measured radiance, temperature, and atmospheric pressure.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BLOCK 3: "Good to know" (Scientific Rigor & Guide Collapsible)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden backdrop-blur-md">
        <button
          type="button"
          onClick={() => setGoodToKnowExpanded(!goodToKnowExpanded)}
          aria-expanded={goodToKnowExpanded}
          className="flex w-full items-center justify-between p-3.5 text-left text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-400" />
            <span className="font-semibold text-white">Good to know</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
              Scientific Rigor & Guide
            </span>
          </div>
          {goodToKnowExpanded ? (
            <ChevronUp className="size-4 text-slate-400" />
          ) : (
            <ChevronDown className="size-4 text-slate-400" />
          )}
        </button>

        {goodToKnowExpanded && (
          <div className="border-t border-white/[0.08] p-4 space-y-3.5 bg-black/40 text-xs text-slate-300">
            {/* Scientific Rigor Note */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-amber-400">
                Acoustic Scientific Rigor & Transposition Note:
              </span>
              <p className="leading-relaxed text-slate-300">
                Sound cannot travel through empty space vacuum. The 136.10 Hz Year Tone is an artistic
                sonification reference derived by transposing Earth&apos;s 365.25-day orbital period up
                32 octaves into the human audible range (Hans Cousto convention). All acoustic
                modulations correspond directly to empirical NASA satellite telemetry (optical depth,
                radiance, sea temperature), transforming planetary data into intuitive acoustic
                perception with zero fictitious parameters.
              </p>
            </div>

            {/* Acoustic Guide */}
            {accessibilityData?.audio_guide && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-950/20 p-3 font-mono text-[11px] text-amber-200">
                <span className="font-bold text-amber-300">Acoustic Guide: </span>
                {accessibilityData.audio_guide}
              </div>
            )}

            {/* Tactile Transducer Guidance */}
            {accessibilityData?.tactile_equivalent_guidance && (
              <div className="rounded-xl border border-white/5 bg-black/50 p-3 font-mono text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                  <Volume2 className="size-3.5" />
                  <span>Tactile Transducer / Bass Shaker Guidance:</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  {accessibilityData.tactile_equivalent_guidance}
                </p>
              </div>
            )}

            {/* NASA SVS Source Link */}
            {activeTrack.nasaUrl && (
              <div className="pt-1">
                <a
                  href={activeTrack.nasaUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 underline font-medium"
                >
                  <span>View NASA Scientific Visualization Studio Source</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
