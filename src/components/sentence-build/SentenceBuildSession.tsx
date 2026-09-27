"use client";

import { Check, ListOrdered, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  assembledSentence,
  starPieceIndex,
  type SentenceBuildItem,
} from "@/lib/sentence-build";

type Phase = "idle" | "active" | "summary";

export function SentenceBuildSession({ items }: { items: SentenceBuildItem[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const current = items[index];

  useEffect(() => {
    if (phase !== "active") return;
    if (checked) {
      nextButtonRef.current?.focus();
      return;
    }
    firstChoiceRef.current?.focus();
  }, [phase, index, checked]);

  if (items.length === 0) {
    return (
      <div role="status" className="px-4 py-16 text-center">
        <ListOrdered className="mx-auto size-8 text-muted" aria-hidden="true" />
        <h2 className="mt-3 text-sm font-medium text-ink">No sentences yet</h2>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sentence build</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Four pieces make one sentence. Choose the piece that belongs in the
            star.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-6">
          <ul className="space-y-2 text-sm text-ink">
            <li>{`${items.length} questions, in book order`}</li>
            <li>The star is the only blank you answer</li>
            <li>A note appears after you check, when the key has one</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              setPhase("active");
              setIndex(0);
              setSelected(null);
              setChecked(false);
              setResults([]);
            }}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    const passed = results.filter(Boolean).length;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Set complete</h1>
          <p className="mt-2 text-sm text-muted">
            {passed} of {items.length} correct
          </p>
        </div>
        <ul className="space-y-2">
          {items.map((item, itemIndex) => {
            const isCorrect = results[itemIndex];
            return (
              <li
                key={item.id}
                className="rounded-xl border border-line bg-surface px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p lang="ja" className="text-sm leading-relaxed text-ink">
                      {assembledSentence(item)}
                    </p>
                    {item.explanation ? (
                      <p lang="ja" className="mt-1 text-sm text-muted">
                        {item.explanation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => {
            setPhase("active");
            setIndex(0);
            setSelected(null);
            setChecked(false);
            setResults([]);
          }}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start again
        </button>
      </div>
    );
  }

  if (!current) return null;

  const answerIndex = starPieceIndex(current);
  const correct = selected === answerIndex;
  const isLast = index + 1 >= items.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Sentence build</h1>
        <p className="mt-0.5 text-sm text-muted">
          {index + 1} / {items.length}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface px-4 py-6">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          Choose the piece in ★
        </p>
        <p lang="ja" className="mt-4 text-lg leading-loose text-ink">
          {current.before}
          <span className="mx-1 inline-flex flex-wrap items-center gap-1 align-middle">
            {Array.from({ length: current.pieces.length }, (_, slot) => {
              const isStar = slot === current.star;
              const shown = checked
                ? current.pieces[current.order[slot]]
                : isStar
                  ? "★"
                  : "";
              return (
                <span
                  key={`${current.id}-${slot}`}
                  className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border px-1.5 text-center text-base ${
                    isStar
                      ? "border-accent bg-accent/10 font-medium text-accent"
                      : "border-dashed border-line text-ink"
                  }`}
                >
                  {shown || "\u00a0"}
                </span>
              );
            })}
          </span>
          {current.after}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {current.pieces.map((piece, choiceIndex) => {
          const isSelected = selected === choiceIndex;
          const isCorrectChoice = choiceIndex === answerIndex;
          const stateClass = checked
            ? isCorrectChoice
              ? "border-ok bg-ok/10"
              : isSelected
                ? "border-accent bg-accent/5"
                : "border-line bg-surface"
            : isSelected
              ? "border-accent bg-surface"
              : "border-line bg-surface";

          return (
            <button
              key={`${current.id}-${piece}`}
              ref={choiceIndex === 0 ? firstChoiceRef : undefined}
              type="button"
              aria-pressed={isSelected}
              disabled={checked}
              onClick={() => setSelected(choiceIndex)}
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-100 ${stateClass}`}
            >
              <span className="w-4 text-sm text-muted">{choiceIndex + 1}.</span>
              <span lang="ja" className="flex-1 text-base text-ink">
                {piece}
              </span>
              {checked && isCorrectChoice ? (
                <Check className="size-4 text-ok" aria-hidden="true" />
              ) : null}
              {checked && isSelected && !isCorrectChoice ? (
                <X className="size-4 text-accent" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {checked ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              correct ? "border-ok/30 bg-ok/10" : "border-line bg-surface"
            }`}
          >
            <p className={`font-medium ${correct ? "text-ok" : "text-ink"}`}>
              {correct
                ? "Correct."
                : `Not quite. The star is ${current.pieces[answerIndex]}.`}
            </p>
            <p lang="ja" className="mt-2 leading-relaxed text-ink">
              {assembledSentence(current)}
            </p>
            {current.explanation ? (
              <p lang="ja" className="mt-2 leading-relaxed text-ink">
                {current.explanation}
              </p>
            ) : null}
            <p className="mt-1 text-muted">{current.meaning}</p>
          </div>
        ) : null}
      </div>

      <button
        ref={nextButtonRef}
        type="button"
        disabled={!checked && selected === null}
        onClick={() => {
          if (!checked) {
            setResults((prev) => [...prev, selected === answerIndex]);
            setChecked(true);
            return;
          }
          if (isLast) {
            setPhase("summary");
            return;
          }
          setIndex((value) => value + 1);
          setSelected(null);
          setChecked(false);
        }}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
      >
        {checked ? (isLast ? "See results" : "Next question") : "Check"}
      </button>
    </div>
  );
}
