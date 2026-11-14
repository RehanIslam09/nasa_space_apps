import Link from 'next/link';
import { Globe, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-black py-12 text-slate-400">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-sky-400/20 text-sky-400">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <span className="font-general text-xs font-bold uppercase tracking-wider text-white">
              NASA Space Apps Experience
            </span>
            <p className="font-circular text-[11px] text-slate-500">
              Earth Song • Planetary Sonification Initiative
            </p>
          </div>
        </div>

        <div className="font-circular flex flex-wrap items-center gap-6 text-xs">
          <a href="#chapter-01" className="transition-colors hover:text-white">
            The Journey
          </a>
          <a href="#crisis-metrics" className="transition-colors hover:text-white">
            Telemetry
          </a>
          <a href="#jukebox" className="transition-colors hover:text-white">
            Sonic Console
          </a>
          <Link href="/api/health" className="text-sky-400 transition-colors hover:text-sky-300">
            API Health
          </Link>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
          <span>Built for Earth</span>
          <Heart className="h-3 w-3 fill-sky-400 text-sky-400" />
          <span>with NASA Open Data</span>
        </div>
      </div>
    </footer>
  );
}
