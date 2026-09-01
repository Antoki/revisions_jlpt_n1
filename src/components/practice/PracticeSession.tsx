"use client";

import { Layers } from "lucide-react";
import { useEffect, useRef } from "react";
import { SESSION_SIZE } from "@/lib/quiz";
import type { VocabularyEntry } from "@/lib/types";
import { FlashcardForm } from "./FlashcardForm";
import { Hearts } from "./Hearts";
import { usePracticeSession } from "./use-practice-session";

export function PracticeSession({ entries }: { entries: VocabularyEntry[] }) {
  const {
    phase,
    cards,
    current,
    index,
    passedCount,
    startSession,
    setReading,
    setMeaning,
    checkAnswer,
    goToNext,
  } = usePracticeSession(entries);

  const readingInputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const attemptStatus = current?.attempt.status;

  useEffect(() => {
    if (phase !== "active" || !attemptStatus) return;
    if (attemptStatus === "answering") {
      readingInputRef.current?.focus();
      return;
    }
    nextButtonRef.current?.focus();
  }, [phase, index, attemptStatus]);

  if (entries.length === 0) {
    return (
      <div role="status" className="px-4 py-16 text-center">
        <Layers className="mx-auto size-8 text-muted" aria-hidden="true" />
        <h2 className="mt-3 text-sm font-medium text-ink">No words yet</h2>
        <p className="mt-1 text-sm text-muted">
          Add vocabulary before starting a review session.
        </p>
      </div>
    );
  }

  if (phase === "idle") {
    const size = Math.min(SESSION_SIZE, entries.length);
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Type the reading and a French or English meaning. Missed words come
            back more often in later batches.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface px-4 py-6">
          <ul className="space-y-2 text-sm text-ink">
            <li>{`${size} words drawn from the full list`}</li>
            <li>3 shared chances per word</li>
            <li>Either translation is accepted</li>
          </ul>
          <button
            type="button"
            onClick={startSession}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Start session
          </button>
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    const failed = cards.filter((card) => card.attempt.status === "failed");
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Session over</h1>
          <p className="mt-2 text-sm text-muted">
            {passedCount} of {cards.length} correct
          </p>
        </div>

        {failed.length > 0 ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-sm font-medium text-ink">To review again</h2>
            <ul className="mt-3 space-y-2">
              {failed.map((card) => (
                <li key={card.entry.id} className="text-sm">
                  <span lang="ja" className="font-medium text-ink">
                    {card.entry.kanji}
                  </span>
                  <span className="text-muted"> · {card.entry.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
            Clean session. Those words will show up less often next time.
          </p>
        )}

        <button
          type="button"
          onClick={startSession}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start another session
        </button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Review</h1>
          <p className="mt-0.5 text-sm text-muted">
            {index + 1} / {cards.length}
          </p>
        </div>
        <Hearts remaining={current.attempt.hearts} />
      </div>
      <FlashcardForm
        entry={current.entry}
        attempt={current.attempt}
        reading={current.reading}
        meaning={current.meaning}
        onReadingChange={setReading}
        onMeaningChange={setMeaning}
        onCheck={checkAnswer}
        onNext={goToNext}
        isLast={index + 1 >= cards.length}
        readingInputRef={readingInputRef}
        nextButtonRef={nextButtonRef}
      />
    </div>
  );
}
