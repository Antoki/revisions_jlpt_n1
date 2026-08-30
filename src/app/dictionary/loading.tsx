export default function DictionaryLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dictionary">
      <div className="h-8 w-40 animate-pulse rounded bg-line" />
      <div className="h-12 animate-pulse rounded-xl bg-line" />
      <div className="h-28 animate-pulse rounded-xl bg-line" />
      <div className="h-28 animate-pulse rounded-xl bg-line" />
    </div>
  );
}
