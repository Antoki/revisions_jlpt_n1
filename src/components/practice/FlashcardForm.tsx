"use client";

import { Check, X } from "lucide-react";
import type { FormEvent, KeyboardEvent, RefObject } from "react";
import type { CardAttempt } from "@/lib/quiz";
import type { VocabularyEntry } from "@/lib/types";

type FlashcardFormProps = {
  entry: VocabularyEntry;
  attempt: CardAttempt;
  reading: string;
  meaning: string;
  onReadingChange: (value: string) => void;
  onMeaningChange: (value: string) => void;
  onCheck: () => void;
  onNext: () => void;
  isLast: boolean;
  readingInputRef: RefObject<HTMLInputElement | null>;
  nextButtonRef: RefObject<HTMLButtonElement | null>;
};

function FieldStatus({
  checked,
  correct,
  label,
}: {
  checked: boolean;
  correct: boolean;
  label: string;
}) {
  if (!checked) return null;

  if (correct) {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-ok">
        <Check className="size-4" aria-hidden="true" />
        {label} looks good
      </p>
    );
  }

  return (
    <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-accent">
      <X className="size-4" aria-hidden="true" />
      Not quite
    </p>
  );
}

export function FlashcardForm({
  entry,
  attempt,
  reading,
  meaning,
  onReadingChange,
  onMeaningChange,
  onCheck,
  onNext,
  isLast,
  readingInputRef,
  nextButtonRef,
}: FlashcardFormProps) {
  const resolved = attempt.status !== "answering";
  const showReadingStatus = attempt.readingCorrect || attempt.hearts < 3;
  const showMeaningStatus = attempt.meaningCorrect || attempt.hearts < 3;
  const showReadingError = showReadingStatus && !attempt.readingCorrect;
  const showMeaningError = showMeaningStatus && !attempt.meaningCorrect;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (resolved) {
      onNext();
      return;
    }
    onCheck();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || event.key === "Process") {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (resolved) onNext();
      else onCheck();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="rounded-xl border border-line bg-surface px-4 py-8 text-center">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          Word
        </p>
        <p lang="ja" className="mt-3 text-4xl font-medium tracking-wide text-ink">
          {entry.kanji}
        </p>
      </div>

      <div>
        <label htmlFor="reading-input" className="text-sm font-medium text-ink">
          Reading
        </label>
        <p className="mt-0.5 text-xs text-muted">Hiragana, or katakana for loanwords</p>
        <input
          ref={readingInputRef}
          id="reading-input"
          lang="ja"
          value={reading}
          onChange={(event) => onReadingChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={attempt.readingCorrect || resolved}
          enterKeyHint="next"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={showReadingError || undefined}
          className={`mt-2 w-full rounded-xl border bg-surface px-3 py-3 text-base text-ink disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            showReadingError ? "border-accent" : "border-line"
          }`}
        />
        <FieldStatus
          checked={showReadingStatus}
          correct={attempt.readingCorrect}
          label="Reading"
        />
      </div>

      <div>
        <label htmlFor="meaning-input" className="text-sm font-medium text-ink">
          Meaning
        </label>
        <p className="mt-0.5 text-xs text-muted">French or English</p>
        <input
          id="meaning-input"
          value={meaning}
          onChange={(event) => onMeaningChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={attempt.meaningCorrect || resolved}
          enterKeyHint="done"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={showMeaningError || undefined}
          className={`mt-2 w-full rounded-xl border bg-surface px-3 py-3 text-base text-ink disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            showMeaningError ? "border-accent" : "border-line"
          }`}
        />
        <FieldStatus
          checked={showMeaningStatus}
          correct={attempt.meaningCorrect}
          label="Meaning"
        />
      </div>

      <div aria-live="polite">
        {resolved ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              attempt.status === "passed"
                ? "border-ok/30 bg-ok/10"
                : "border-line bg-surface"
            }`}
          >
            <p
              className={`font-medium ${
                attempt.status === "passed" ? "text-ok" : "text-ink"
              }`}
            >
              {attempt.status === "passed"
                ? "Both answers are correct."
                : "Out of chances. The answer is:"}
            </p>
            <p lang="ja" className="mt-2 text-ink">
              {entry.kana}
            </p>
            <p className="mt-1 text-ink">{entry.meaning}</p>
            {entry.meaningFr && entry.meaningFr !== entry.meaning ? (
              <p className="mt-0.5 text-muted">{entry.meaningFr}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        ref={nextButtonRef}
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {resolved ? (isLast ? "See results" : "Next word") : "Check"}
      </button>
    </form>
  );
}
