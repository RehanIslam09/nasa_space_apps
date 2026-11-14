'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected global errors safely without leaking sensitive details
    console.error('Critical application error:', error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center font-sans text-zinc-100 antialiased">
        <main id="main-content" className="max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-red-500">
              System Encountered an Error
            </h1>
            <p className="text-sm text-zinc-400">
              An unexpected critical failure occurred. Please retry your request or reload the
              session.
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-zinc-600">Reference ID: {error.digest}</p>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="default" onClick={() => reset()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
