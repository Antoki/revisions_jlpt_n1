export default function HomeLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Building today's challenge">
      <div className="h-8 w-48 animate-pulse rounded bg-line" />
      <div className="h-5 w-64 animate-pulse rounded bg-line" />
      <div className="h-36 animate-pulse rounded-xl bg-line" />
      <p className="text-sm text-muted">
        Writing today&apos;s questions. This can take a few seconds on the first
        visit.
      </p>
    </div>
  );
}
