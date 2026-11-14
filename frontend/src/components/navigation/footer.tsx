export function Footer() {
  return (
    <footer className="border-border/40 bg-background/50 text-muted-foreground w-full border-t py-6 text-sm">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p className="text-xs">NASA Space Apps Challenge — Application Shell Foundation</p>
        <div className="flex items-center gap-4 text-xs">
          <span>Accessible Architecture</span>
          <span>•</span>
          <span>React 19 & Next.js App Router</span>
        </div>
      </div>
    </footer>
  );
}
