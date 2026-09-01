"use client";

import { Check, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DailyChallenge } from "@/lib/challenge";
import { ChallengeQuestionCard } from "./ChallengeQuestionCard";
import {
  useDailyChallenge,
  type ChallengeErrorState,
} from "./use-daily-challenge";

export function DailyChallenge({
  challenge,
  error = null,
}: {
  challenge?: DailyChallenge;
  error?: ChallengeErrorState | null;
}) {
  const {
    phase,
    error: challengeError,
    challenge: activeChallenge,
    current,
    index,
    selected,
    checked,
    passedCount,
    start,
    selectChoice,
    checkAnswer,
    goToNext,
    review,
  } = useDailyChallenge(challenge ?? null, error);

  if (phase === "error" || !activeChallenge) {
    return (
      <section className="flex flex-col gap-6">
        <Header />
        <ChallengeErrorCard message={challengeError?.message} />
      </section>
    );
  }

  if (phase === "idle") {
    return (
      <section className="flex flex-col gap-6">
        <Header dateLabel={formatDateLabel(activeChallenge.date)} />
        <div className="rounded-xl border border-line bg-surface px-4 py-6">
          <ul className="space-y-2 text-sm text-ink">
            <li>{`${activeChallenge.questions.length} JLPT-style questions`}</li>
            <li>Guess the reading, or pick the word that fits the sentence</li>
            <li>Same set all day, drawn from your current vocabulary</li>
          </ul>
          <button
            type="button"
            onClick={start}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Start today&apos;s challenge
          </button>
        </div>
      </section>
    );
  }

  if (phase === "summary") {
    return (
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Challenge complete
          </h1>
          <p className="mt-2 text-sm text-muted">
            {passedCount} of {activeChallenge.questions.length} correct
          </p>
        </div>

        <ul className="space-y-2">
          {activeChallenge.questions.map((question, questionIndex) => {
            const isCorrect = selected[questionIndex] === question.answerIndex;
            return (
              <li
                key={question.id}
                className="rounded-xl border border-line bg-surface px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <Check className="mt-0.5 size-4 text-ok" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 text-accent" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium tracking-wide text-muted uppercase">
                      {question.type === "reading" ? "Reading" : "Fill in the blank"}
                    </p>
                    <p lang="ja" className="mt-1 text-sm text-ink">
                      {question.prompt}
                    </p>
                    <p lang="ja" className="mt-1 text-sm text-muted">
                      {question.choices[question.answerIndex]}
                      {` · ${question.source.meaning}`}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={review}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Review answers
        </button>
        <p className="text-center text-sm text-muted">New questions tomorrow.</p>
      </section>
    );
  }

  if (!current) return null;

  return (
    <ChallengeQuestionCard
      question={current}
      index={index}
      total={activeChallenge.questions.length}
      selected={selected[index] ?? null}
      checked={Boolean(checked[index])}
      isLast={index + 1 >= activeChallenge.questions.length}
      onSelect={selectChoice}
      onCheck={checkAnswer}
      onNext={goToNext}
    />
  );
}

function ChallengeErrorCard({ message }: { message?: string }) {
  const router = useRouter();

  return (
    <div role="alert" className="rounded-xl border border-line bg-surface px-4 py-8 text-center">
      <Sparkles className="mx-auto size-8 text-muted" aria-hidden="true" />
      <h2 className="mt-3 text-sm font-medium text-ink">
        Could not build today&apos;s challenge
      </h2>
      <p className="mt-1 text-sm text-muted">
        {message ?? "Try again in a moment."}
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Try again
      </button>
    </div>
  );
}

function Header({ dateLabel }: { dateLabel?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Daily Challenge</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {dateLabel
          ? `${dateLabel}. Five questions, same set all day.`
          : "Five questions, same set all day."}
      </p>
    </div>
  );
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
