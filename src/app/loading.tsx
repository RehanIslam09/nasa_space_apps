export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center p-4"
    >
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
