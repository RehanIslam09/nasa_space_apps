'use client';

export function ScrollCue({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      aria-label="Scroll down cue"
    >
      <div className="relative h-10 w-[1.5px] overflow-hidden rounded-full bg-white/15">
        <div className="scroll-line-indicator absolute left-0 top-0 w-full rounded-full bg-white/80" />
      </div>
    </div>
  );
}
