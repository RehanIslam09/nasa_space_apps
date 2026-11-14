import { Button } from '@/components/ui/button';
import { Layers, Database, Sparkles, Terminal } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="border-border text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        Infrastructure Bootstrap Initialized
      </div>

      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
        NASA Space Apps Platform
      </h1>

      <p className="text-muted-foreground mb-8 max-w-2xl text-lg leading-relaxed">
        Production-grade engineering foundation ready for problem statement implementation. Next.js
        App Router, React 19, Tailwind CSS 4, GSAP, Three.js, TanStack Query, Supabase, and Drizzle
        ORM.
      </p>

      <div className="mb-10 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border-border bg-card text-card-foreground rounded-lg border p-4">
          <Layers className="text-primary mx-auto mb-2 h-5 w-5" />
          <div className="text-xs font-semibold">Core Framework</div>
          <div className="text-muted-foreground mt-1 text-[11px]">Next 15 + React 19</div>
        </div>
        <div className="border-border bg-card text-card-foreground rounded-lg border p-4">
          <Sparkles className="text-primary mx-auto mb-2 h-5 w-5" />
          <div className="text-xs font-semibold">Cinematics & 3D</div>
          <div className="text-muted-foreground mt-1 text-[11px]">GSAP + Three / R3F</div>
        </div>
        <div className="border-border bg-card text-card-foreground rounded-lg border p-4">
          <Database className="text-primary mx-auto mb-2 h-5 w-5" />
          <div className="text-xs font-semibold">Data Layer</div>
          <div className="text-muted-foreground mt-1 text-[11px]">Supabase + Drizzle</div>
        </div>
        <div className="border-border bg-card text-card-foreground rounded-lg border p-4">
          <Terminal className="text-primary mx-auto mb-2 h-5 w-5" />
          <div className="text-xs font-semibold">Strict Tooling</div>
          <div className="text-muted-foreground mt-1 text-[11px]">TypeScript Strict</div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="default" size="default" asChild>
          <a href="/api/health">Check API Health</a>
        </Button>
      </div>
    </div>
  );
}
