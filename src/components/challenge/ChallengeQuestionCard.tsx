"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ChallengeQuestion } from "@/lib/challenge";

type ChallengeQuestionCardProps = {
  question: ChallengeQuestion;
  index: number;
  total: number;
  selected: number | null;
  checked: boolean;
  isLast: boolean;
  onSelect: (choiceIndex: number) => void;
  onCheck: () => void;
  onNext: () => void;
};

export function ChallengeQuestionCard({
  question,
  index,
  total,
  selected,
  checked,
  isLast,
  onSelect,
  onCheck,
  onNext,
}: ChallengeQuestionCardProps) {
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const heading =
    question.type === "reading"
      ? "Choose the reading"
      : "Choose the word that fits";

  useEffect(() => {
    if (checked) {
      nextButtonRef.current?.focus();
      return;
    }
    firstChoiceRef.current?.focus();
  }, [question.id, checked]);

  const correct = selected === question.answerIndex;
  const correctChoice = question.choices[question.answerIndex];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Daily Challenge</h1>
        <p className="mt-0.5 text-sm text-muted">
          {index + 1} / {total}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface px-4 py-8 text-center">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {heading}
        </p>
        <p
          lang="ja"
          className={`mt-3 font-medium tracking-wide text-ink ${
            question.type === "reading"
              ? "text-4xl"
              : "text-xl leading-relaxed"
          }`}
        >
          {question.prompt}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {question.choices.map((choice, choiceIndex) => {
          const isSelected = selected === choiceIndex;
          const isCorrectChoice = choiceIndex === question.answerIndex;
          const showResult = checked;
          const stateClass = showResult
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
              key={`${question.id}-${choice}`}
              ref={choiceIndex === 0 ? firstChoiceRef : undefined}
              type="button"
              aria-pressed={isSelected}
              disabled={checked}
              onClick={() => onSelect(choiceIndex)}
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-100 ${stateClass}`}
            >
              <span className="w-4 text-sm text-muted">{choiceIndex + 1}.</span>
              <span lang="ja" className="flex-1 text-base text-ink">
                {choice}
              </span>
              {showResult && isCorrectChoice ? (
                <Check className="size-4 text-ok" aria-hidden="true" />
              ) : null}
              {showResult && isSelected && !isCorrectChoice ? (
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
              correct
                ? "border-ok/30 bg-ok/10"
                : "border-line bg-surface"
            }`}
          >
            <p className={`font-medium ${correct ? "text-ok" : "text-ink"}`}>
              {correct ? "Correct." : `Not quite. The answer is ${correctChoice}.`}
            </p>
            <p lang="ja" className="mt-2 text-ink">
              {question.source.kanji}
              {question.source.kana !== question.source.kanji
                ? ` · ${question.source.kana}`
                : ""}
            </p>
            <p className="mt-1 text-ink">{question.source.meaning}</p>
            {question.source.meaningFr &&
            question.source.meaningFr !== question.source.meaning ? (
              <p className="mt-0.5 text-muted">{question.source.meaningFr}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        ref={nextButtonRef}
        type="button"
        disabled={!checked && selected === null}
        onClick={checked ? onNext : onCheck}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
      >
        {checked ? (isLast ? "See results" : "Next question") : "Check"}
      </button>
    </div>
  );
}
