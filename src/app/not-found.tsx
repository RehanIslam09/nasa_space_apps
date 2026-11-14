import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-primary text-4xl font-extrabold tracking-tight">404</p>
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Page not found</h2>
          <p className="text-muted-foreground text-sm">
            The resource or page you are looking for does not exist or has been relocated.
          </p>
        </div>
        <div>
          <Button asChild variant="default">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
