"use client";

export type GenerateRequest = {
  label: string;
  busyLabel: string;
  busy: boolean;
  error: string | null;
  onGenerate: () => void;
};

export function SetActions({
  onStart,
  generate,
  alternateLabel,
  onAlternate,
}: {
  onStart: () => void;
  generate?: GenerateRequest;
  alternateLabel?: string;
  onAlternate?: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Start
      </button>
      {generate ? (
        <button
          type="button"
          onClick={generate.onGenerate}
          disabled={generate.busy}
          aria-busy={generate.busy}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-line bg-paper px-5 text-sm font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
        >
          {generate.busy ? generate.busyLabel : generate.label}
        </button>
      ) : null}
      {onAlternate && alternateLabel ? (
        <button
          type="button"
          onClick={onAlternate}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-line bg-paper px-5 text-sm font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {alternateLabel}
        </button>
      ) : null}
      {generate?.busy ? (
        <p role="status" className="text-center text-sm text-muted">
          Writing today&apos;s N1 questions. This can take a few seconds.
        </p>
      ) : null}
      {generate?.error ? (
        <p role="alert" className="text-center text-sm text-muted">
          {generate.error}
        </p>
      ) : null}
    </div>
  );
}
