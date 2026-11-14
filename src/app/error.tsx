'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error occurred:', error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm">
            We ran into an issue while loading this section. You can try reloading it.
          </p>
          {error.digest && (
            <p className="text-muted-foreground/60 font-mono text-xs">Digest: {error.digest}</p>
          )}
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="default" onClick={() => reset()}>
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
