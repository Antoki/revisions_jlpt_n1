"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import type { VocabularyEntry } from "@/lib/types";

export function VocabCard({ entry }: { entry: VocabularyEntry }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const showReading = Boolean(entry.kana) && entry.kana !== entry.kanji;
  const hasDetails = Boolean(entry.nuance || entry.example);

  return (
    <article className="rounded-xl border border-line bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 lang="ja" className="text-2xl font-medium tracking-wide text-ink">
            {entry.kanji}
          </h2>
          {showReading ? (
            <p lang="ja" className="mt-1 text-sm text-muted">
              {entry.kana}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-ink">{entry.meaning}</p>
      {entry.meaningFr && entry.meaningFr !== entry.meaning ? (
        <p className="mt-1 text-sm text-muted">{entry.meaningFr}</p>
      ) : null}

      {hasDetails ? (
        <div className="mt-3 border-t border-line pt-3">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((current) => !current)}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {open ? "Hide details" : "See more"}
            <ChevronDown
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {open ? (
            <div id={detailsId} className="mt-3 space-y-3">
              {entry.nuance ? (
                <section>
                  <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
                    Nuance
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink">
                    {entry.nuance}
                  </p>
                </section>
              ) : null}
              {entry.example ? (
                <section>
                  <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
                    Example
                  </h3>
                  <p lang="ja" className="mt-1 text-sm leading-relaxed text-ink">
                    {entry.example}
                  </p>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
