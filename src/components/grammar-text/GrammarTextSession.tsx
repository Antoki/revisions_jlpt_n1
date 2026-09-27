"use client";

import { Check, FileText, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  insertedText,
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
  const [passageIndex, setPassageIndex] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [activeBlankId, setActiveBlankId] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const passageRef = useRef<HTMLElement>(null);
  const blankRefs = useRef(new Map<number, HTMLButtonElement>());
  const questionRefs = useRef(new Map<number, HTMLElement>());

  const passage = passages[passageIndex];

  function begin() {
    const first = passages[0];
    setPhase("active");
    setPassageIndex(0);
    setSelected({});
    setActiveBlankId(first?.blanks[0]?.id ?? null);
    setChecked(false);
    setResults([]);
  }

  useEffect(() => {
    if (phase !== "active") return;
    if (checked) {
      feedbackRef.current?.focus();
      feedbackRef.current?.scrollIntoView({ block: "nearest" });
      return;
    }
    firstChoiceRef.current?.focus({ preventScroll: true });
  }, [phase, passageIndex, checked]);

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
            A passage stays on screen with every blank. Choose an expression
            and it appears in the text.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-6">
          <ul className="space-y-2 text-sm text-ink">
            <li>{`${passages.length} passages, ${questions.length} blanks, in book order`}</li>
            <li>Every blank for a passage is shown together</li>
            <li>Select a numbered blank, then the expression you want</li>
            <li>A note appears after you check the passage</li>
          </ul>
          <button
            type="button"
            onClick={begin}
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
          onClick={begin}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start again
        </button>
      </div>
    );
  }

  if (!passage) return null;

  const filledCount = passage.blanks.filter(
    (blank) => selected[blank.id] !== undefined,
  ).length;
  const allFilled = filledCount === passage.blanks.length;
  const isLast = passageIndex + 1 >= passages.length;

  function choose(blankId: number, choiceIndex: number) {
    setSelected((prev) => ({ ...prev, [blankId]: choiceIndex }));
    setActiveBlankId(blankId);
    requestAnimationFrame(() => revealBlank(blankId));
  }

  function activateBlank(blankId: number) {
    setActiveBlankId(blankId);
    revealQuestion(blankId);
  }

  function revealBlank(blankId: number) {
    const node = blankRefs.current.get(blankId);
    const container = passageRef.current;
    if (!node || !container) return;
    const nodeRect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const above = nodeRect.top - containerRect.top;
    const below = nodeRect.bottom - containerRect.bottom;
    if (nodeRect.height >= containerRect.height || above < 8) {
      container.scrollTop += above - 8;
      return;
    }
    if (below > 0) container.scrollTop += below + 8;
  }

  function revealQuestion(blankId: number) {
    const node = questionRefs.current.get(blankId);
    if (!node) return;
    const stickyBottom = passageRef.current?.getBoundingClientRect().bottom ?? 0;
    const rect = node.getBoundingClientRect();
    const navAllowance = 96;
    if (rect.top < stickyBottom + 12) {
      window.scrollBy({ top: rect.top - stickyBottom - 12 });
      return;
    }
    const limit = window.innerHeight - navAllowance;
    if (rect.bottom > limit) {
      window.scrollBy({ top: rect.bottom - limit });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Grammar in text</h1>
        <p className="mt-0.5 text-sm text-muted">
          Passage {passageIndex + 1} / {passages.length}
        </p>
      </div>

      <article
        ref={passageRef}
        className="sticky top-14 z-[1] max-h-64 overflow-y-auto rounded-xl border border-line bg-surface px-4 py-4"
      >
        {passage.lead ? (
          <p className="text-xs leading-relaxed text-muted">{passage.lead}</p>
        ) : null}
        <div
          key={passage.id}
          lang="ja"
          className={`text-base leading-loose whitespace-pre-wrap text-ink ${
            passage.lead ? "mt-3" : ""
          }`}
        >
          <PassageText
            passage={passage}
            selected={selected}
            checked={checked}
            activeBlankId={activeBlankId}
            onActivate={activateBlank}
            setBlankRef={(id, node) => {
              if (node) blankRefs.current.set(id, node);
              else blankRefs.current.delete(id);
            }}
          />
        </div>
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

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
          Choose an expression for each blank
        </h2>
        {passage.blanks.map((blank, blankIndex) => (
          <QuestionChoices
            key={blank.id}
            blank={blank}
            blankIndex={blankIndex}
            selectedIndex={selected[blank.id] ?? null}
            checked={checked}
            isActive={activeBlankId === blank.id}
            firstChoiceRef={blankIndex === 0 ? firstChoiceRef : undefined}
            setQuestionRef={(node) => {
              if (node) questionRefs.current.set(blank.id, node);
              else questionRefs.current.delete(blank.id);
            }}
            onActivate={() => activateBlank(blank.id)}
            onChoose={(choiceIndex) => choose(blank.id, choiceIndex)}
          />
        ))}
      </div>

      <div
        ref={feedbackRef}
        tabIndex={-1}
        aria-live="polite"
        className="scroll-mt-72 outline-none"
      >
        {checked ? (
          <ul className="flex flex-col gap-2">
            {passage.blanks.map((blank) => {
              const choiceIndex = selected[blank.id] ?? null;
              const correct = choiceIndex === blank.answer;
              return (
                <li
                  key={blank.id}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    correct ? "border-ok/30 bg-ok/10" : "border-line bg-surface"
                  }`}
                >
                  <p className={`font-medium ${correct ? "text-ok" : "text-ink"}`}>
                    <span className="text-muted">{blank.id}. </span>
                    {correct
                      ? "Correct."
                      : `Not quite. The blank is ${blank.choices[blank.answer]}.`}
                  </p>
                  <p lang="ja" className="mt-2 leading-relaxed text-ink">
                    {blank.explanation}
                  </p>
                  <p className="mt-1 text-muted">{blank.meaning}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-xs text-muted">
            {filledCount} of {passage.blanks.length} filled
          </p>
        )}
      </div>

      <button
        ref={nextButtonRef}
        type="button"
        disabled={!checked && !allFilled}
        onClick={() => {
          if (!checked) {
            setResults((prev) => [
              ...prev,
              ...passage.blanks.map(
                (blank) => selected[blank.id] === blank.answer,
              ),
            ]);
            setChecked(true);
            return;
          }
          if (isLast) {
            setPhase("summary");
            return;
          }
          const next = passages[passageIndex + 1];
          setPassageIndex((value) => value + 1);
          setSelected({});
          setActiveBlankId(next?.blanks[0]?.id ?? null);
          setChecked(false);
        }}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
      >
        {checked ? (isLast ? "See results" : "Next passage") : "Check"}
      </button>
    </div>
  );
}

function PassageText({
  passage,
  selected,
  checked,
  activeBlankId,
  onActivate,
  setBlankRef,
}: {
  passage: GrammarTextPassage;
  selected: Record<number, number>;
  checked: boolean;
  activeBlankId: number | null;
  onActivate: (blankId: number) => void;
  setBlankRef: (id: number, node: HTMLButtonElement | null) => void;
}) {
  return (
    <>
      {passage.parts.map((part, partIndex) => {
        if ("text" in part) {
          return <span key={`${passage.id}-t-${partIndex}`}>{part.text}</span>;
        }

        const blank = passage.blanks.find((item) => item.id === part.blank);
        if (!blank) return null;

        return (
          <BlankMark
            key={`${passage.id}-b-${part.blank}`}
            blank={blank}
            choiceIndex={selected[blank.id] ?? null}
            checked={checked}
            isActive={part.blank === activeBlankId}
            onActivate={() => onActivate(blank.id)}
            markRef={(node) => setBlankRef(blank.id, node)}
          />
        );
      })}
    </>
  );
}

function BlankMark({
  blank,
  choiceIndex,
  checked,
  isActive,
  onActivate,
  markRef,
}: {
  blank: GrammarTextBlank;
  choiceIndex: number | null;
  checked: boolean;
  isActive: boolean;
  onActivate: () => void;
  markRef: (node: HTMLButtonElement | null) => void;
}) {
  const filled = choiceIndex !== null;
  const correct = choiceIndex === blank.answer;
  const className = checked
    ? correct
      ? "border-ok bg-ok/10 text-ok"
      : "border-accent bg-accent/10 text-accent"
    : filled || isActive
      ? "border-accent bg-accent/10 font-medium text-accent"
      : "border-dashed border-line text-muted";

  return (
    <button
      ref={markRef}
      type="button"
      lang="ja"
      aria-current={isActive ? "true" : undefined}
      aria-label={
        filled
          ? `Blank ${blank.id}: ${blank.choices[choiceIndex]}`
          : `Blank ${blank.id}`
      }
      disabled={checked}
      onClick={onActivate}
      className={`mx-0.5 inline rounded-md border px-1.5 align-baseline box-decoration-clone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-100 ${className}`}
    >
      {filled ? (
        <>
          <span className="mr-1 text-xs opacity-70">{blank.id}</span>
          {insertedText(blank, choiceIndex)}
        </>
      ) : (
        insertedText(blank, null)
      )}
    </button>
  );
}

function QuestionChoices({
  blank,
  blankIndex,
  selectedIndex,
  checked,
  isActive,
  firstChoiceRef,
  setQuestionRef,
  onActivate,
  onChoose,
}: {
  blank: GrammarTextBlank;
  blankIndex: number;
  selectedIndex: number | null;
  checked: boolean;
  isActive: boolean;
  firstChoiceRef?: RefObject<HTMLButtonElement | null>;
  setQuestionRef: (node: HTMLElement | null) => void;
  onActivate: () => void;
  onChoose: (choiceIndex: number) => void;
}) {
  return (
    <section
      ref={setQuestionRef}
      aria-current={isActive ? "true" : undefined}
      className={`rounded-xl border bg-surface px-3 py-3 ${
        isActive ? "border-accent" : "border-line"
      }`}
    >
      <h3 className="mb-2 text-sm font-medium text-ink">
        <button
          type="button"
          onClick={onActivate}
          className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Blank {blank.id}
        </button>
      </h3>
      <div className="flex flex-col gap-2" role="group" aria-label={`Blank ${blank.id}`}>
        {blank.choices.map((choice, choiceIndex) => {
          const isSelected = selectedIndex === choiceIndex;
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
              ref={
                blankIndex === 0 && choiceIndex === 0 ? firstChoiceRef : undefined
              }
              type="button"
              aria-pressed={isSelected}
              disabled={checked}
              onClick={() => onChoose(choiceIndex)}
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
    </section>
  );
}
