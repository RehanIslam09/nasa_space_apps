'use client';

import { BookOpen, Volume2, Mic, MicOff, X, ExternalLink, ShieldAlert } from 'lucide-react';
import type { AccessibilityResponse } from '@nasa-experience/contracts';
import type { SonicTrackConfig } from '@/config/earth-song.config';

interface SciencePanelProps {
  activeTrack: SonicTrackConfig;
  accessibilityData: AccessibilityResponse | null;
  onClose?: () => void;
  isSpeaking?: boolean;
  onToggleSpeech?: (text: string) => void;
}

export function SciencePanel({
  activeTrack,
  accessibilityData,
  onClose,
  isSpeaking = false,
  onToggleSpeech,
}: SciencePanelProps) {
  const summaryText =
    accessibilityData?.plain_language_summary ||
    activeTrack.description ||
    'Sonification of NASA Earth observation data translating planetary cycles into audible frequencies.';

  const speechNarrative = `${activeTrack.title}. ${summaryText} ${
    accessibilityData?.audio_guide ? `Audio Guide: ${accessibilityData.audio_guide}` : ''
  }`;

  return (
    <div
      id="science-legend-panel"
      role="region"
      aria-label="Scientific Interpretation and Audio Legend"
      className="space-y-4 rounded-2xl border border-amber-400/20 bg-amber-950/20 p-4.5 text-xs backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-2 font-mono font-semibold uppercase tracking-wider text-amber-300">
          <BookOpen className="size-4 text-amber-400" />
          <span>Scientific Interpretation & Audio Legend</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleSpeech && (
            <button
              type="button"
              onClick={() => onToggleSpeech(speechNarrative)}
              aria-label={isSpeaking ? 'Stop speaking audio description' : 'Speak audio description'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                isSpeaking
                  ? 'border-amber-400 bg-amber-500/30 text-amber-200 animate-pulse'
                  : 'border-white/10 bg-black/40 text-slate-300 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              {isSpeaking ? (
                <>
                  <MicOff className="size-3 text-amber-300" />
                  <span>Speaking...</span>
                </>
              ) : (
                <>
                  <Mic className="size-3 text-amber-400" />
                  <span>Describe Sound</span>
                </>
              )}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Scientific Interpretation and Audio Legend panel"
              className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 text-slate-300">
        {/* Plain Language Summary (Readable 15-16px typography) */}
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">
            Plain Language Summary
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-slate-200 font-sans max-w-3xl">
            {summaryText}
          </p>
        </div>

        {/* Structured Variable-to-Sound Mappings */}
        {accessibilityData?.screen_reader_legend && accessibilityData.screen_reader_legend.length > 0 && (
          <div className="space-y-2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              Variable-to-Sound Scientific Legend
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {accessibilityData.screen_reader_legend.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-400/20 bg-black/50 p-3.5 text-[11px] transition-colors hover:border-amber-400/40"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-amber-200">
                    <span>{item.layer_name || item.scientific_variable}</span>
                    <span className="text-[10px] text-amber-400/90 rounded bg-amber-500/10 px-1.5 py-0.5 border border-amber-400/20">
                      {item.pitch_range}
                    </span>
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] text-slate-300">
                    <span className="font-semibold text-amber-300">Audio Mapping: </span>
                    {item.audio_characteristic} ({item.synthesis_timbre})
                  </div>
                  {item.scientific_reasoning && (
                    <div className="mt-2 text-[10px] leading-relaxed text-slate-400 border-t border-white/5 pt-1.5">
                      {item.scientific_reasoning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acoustic Narrative Guide */}
        {accessibilityData?.audio_guide && (
          <div className="rounded-xl border border-amber-400/20 bg-black/40 p-3 font-mono text-[11px] text-amber-200/90">
            <span className="font-semibold text-amber-300">Acoustic Guide: </span>
            {accessibilityData.audio_guide}
          </div>
        )}

        {/* Tactile Transducer / Bass Shaker Guidance */}
        {accessibilityData?.tactile_equivalent_guidance && (
          <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3 font-mono text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Volume2 className="size-3.5 text-amber-400" />
              <span>Tactile Transducer / Bass Shaker Guidance:</span>
            </div>
            <p className="mt-1 leading-relaxed">
              {accessibilityData.tactile_equivalent_guidance}
            </p>
          </div>
        )}

        {/* Transparent Scientific Methodology & Artistic Transposition Disclaimer */}
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 font-mono text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
            <ShieldAlert className="size-3.5" />
            <span>Acoustic Scientific Rigor & Transposition Note</span>
          </div>
          <p className="leading-relaxed">
            Sound cannot travel through empty space vacuum. The 136.10 Hz Year Tone is an artistic
            sonification reference derived by transposing Earth&apos;s 365.25-day orbital period up 32
            octaves into the human audible range (Hans Cousto convention). All acoustic modulations
            correspond directly to empirical NASA satellite telemetry (optical depth, radiance, sea
            temperature), transforming planetary data into intuitive acoustic perception with zero
            fictitious parameters.
          </p>
          {activeTrack.nasaUrl && (
            <div className="mt-2">
              <a
                href={activeTrack.nasaUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline"
              >
                <span>View NASA Scientific Visualization Studio Source</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
