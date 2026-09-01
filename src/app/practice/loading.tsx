export default function PracticeLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading review">
      <div className="h-8 w-32 animate-pulse rounded bg-line" />
      <div className="h-20 animate-pulse rounded-xl bg-line" />
      <div className="h-36 animate-pulse rounded-xl bg-line" />
    </div>
  );
}
