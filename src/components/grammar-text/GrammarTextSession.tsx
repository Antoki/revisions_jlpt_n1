"use client";

import { Check, FileText, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  listQuestions,
  type GrammarTextBlank,
  type GrammarTextPassage,
} from "@/lib/grammar-text";

type Phase = "idle" | "active" | "summary";

export function GrammarTextSession({
  passages,
}: {
  passages: GrammarTextPassage[];
}) {
  const questions = listQuestions(passages);
  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const blankRef = useRef<HTMLSpanElement>(null);

  const current = questions[index];

  useEffect(() => {
    if (phase !== "active") return;
    if (checked) {
      nextButtonRef.current?.focus();
      return;
    }
    firstChoiceRef.current?.focus();
  }, [phase, index, checked]);

  useEffect(() => {
    if (phase !== "active") return;
    blankRef.current?.scrollIntoView({ block: "nearest" });
  }, [phase, index]);

  if (questions.length === 0) {
    return (
      <div role="status" className="px-4 py-16 text-center">
        <FileText className="mx-auto size-8 text-muted" aria-hidden="true" />
        <h2 className="mt-3 text-sm font-medium text-ink">No passages yet</h2>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grammar in text</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A blank sits in a passage. Choose the expression that fits.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-6">
          <ul className="space-y-2 text-sm text-ink">
            <li>{`${questions.length} blanks, ${passages.length} passages, in book order`}</li>
            <li>Earlier blanks stay filled as you go</li>
            <li>A note appears after you check</li>
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
            {passed} of {questions.length} correct
          </p>
        </div>
        <ul className="space-y-2">
          {questions.map((item, itemIndex) => {
            const isCorrect = results[itemIndex];
            return (
              <li
                key={item.blank.id}
                className="rounded-xl border border-line bg-surface px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{item.blank.id}</p>
                    <p lang="ja" className="text-sm leading-relaxed text-ink">
                      {item.blank.choices[item.blank.answer]}
                    </p>
                    <p lang="ja" className="mt-1 text-sm text-muted">
                      {item.blank.explanation}
                    </p>
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

  const { passage, blank } = current;
  const correct = selected === blank.answer;
  const isLast = index + 1 >= questions.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Grammar in text</h1>
        <p className="mt-0.5 text-sm text-muted">
          {index + 1} / {questions.length}
        </p>
      </div>

      <article className="rounded-xl border border-line bg-surface px-4 py-4">
        {passage.lead ? (
          <p className="text-xs leading-relaxed text-muted">{passage.lead}</p>
        ) : null}
        <p
          key={passage.id}
          lang="ja"
          className={`max-h-80 overflow-y-auto text-base leading-loose whitespace-pre-wrap text-ink ${
            passage.lead ? "mt-3" : ""
          }`}
        >
          <PassageText
            passage={passage}
            activeId={blank.id}
            checked={checked}
            blankRef={blankRef}
          />
        </p>
        {passage.notes.length > 0 ? (
          <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs leading-relaxed text-muted">
            {passage.notes.map((note) => (
              <li key={note} lang="ja">
                {note}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-xs text-muted">{passage.source}</p>
      </article>

      <div className="flex flex-col gap-2" role="group" aria-label={`Blank ${blank.id}`}>
        {blank.choices.map((choice, choiceIndex) => {
          const isSelected = selected === choiceIndex;
          const isCorrectChoice = choiceIndex === blank.answer;
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
              key={`${blank.id}-${choice}`}
              ref={choiceIndex === 0 ? firstChoiceRef : undefined}
              type="button"
              aria-pressed={isSelected}
              disabled={checked}
              onClick={() => setSelected(choiceIndex)}
              className={`flex min-h-12 items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-100 ${stateClass}`}
            >
              <span className="w-4 text-sm text-muted">{choiceIndex + 1}.</span>
              <span lang="ja" className="flex-1 text-base leading-relaxed text-ink">
                {choice}
              </span>
              {checked && isCorrectChoice ? (
                <Check className="mt-1 size-4 text-ok" aria-hidden="true" />
              ) : null}
              {checked && isSelected && !isCorrectChoice ? (
                <X className="mt-1 size-4 text-accent" aria-hidden="true" />
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
                : `Not quite. The blank is ${blank.choices[blank.answer]}.`}
            </p>
            <p lang="ja" className="mt-2 leading-relaxed text-ink">
              {blank.explanation}
            </p>
            <p className="mt-1 text-muted">{blank.meaning}</p>
          </div>
        ) : null}
      </div>

      <button
        ref={nextButtonRef}
        type="button"
        disabled={!checked && selected === null}
        onClick={() => {
          if (!checked) {
            setResults((prev) => [...prev, selected === blank.answer]);
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

function PassageText({
  passage,
  activeId,
  checked,
  blankRef,
}: {
  passage: GrammarTextPassage;
  activeId: number;
  checked: boolean;
  blankRef: RefObject<HTMLSpanElement | null>;
}) {
  const activeIndex = passage.blanks.findIndex((item) => item.id === activeId);

  return (
    <>
      {passage.parts.map((part, partIndex) => {
        if ("text" in part) {
          return <span key={`${passage.id}-t-${partIndex}`}>{part.text}</span>;
        }

        const blank = passage.blanks.find((item) => item.id === part.blank);
        if (!blank) return null;

        const blankIndex = passage.blanks.findIndex((item) => item.id === part.blank);
        const isActive = part.blank === activeId;
        const revealed = blankIndex < activeIndex || (isActive && checked);

        return (
          <BlankMark
            key={`${passage.id}-b-${part.blank}`}
            blank={blank}
            revealed={revealed}
            isActive={isActive}
            markRef={isActive ? blankRef : undefined}
          />
        );
      })}
    </>
  );
}

function BlankMark({
  blank,
  revealed,
  isActive,
  markRef,
}: {
  blank: GrammarTextBlank;
  revealed: boolean;
  isActive: boolean;
  markRef?: RefObject<HTMLSpanElement | null>;
}) {
  const className = isActive
    ? "mx-0.5 rounded bg-accent/10 px-1 font-medium text-accent"
    : revealed
      ? "text-ink"
      : "mx-0.5 rounded border border-line px-1 text-muted";

  return (
    <span
      ref={markRef}
      lang="ja"
      aria-current={isActive ? "true" : undefined}
      className={className}
    >
      {revealed ? blank.choices[blank.answer] : blank.id}
    </span>
  );
}
