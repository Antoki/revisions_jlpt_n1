"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { DailyChallenge } from "@/lib/challenge";
import {
  emptySession,
  getChallengeSessionServerSnapshot,
  getChallengeSessionSnapshot,
  saveChallengeSession,
  subscribeChallengeSession,
  type ChallengeSession,
} from "@/lib/challenge-progress";

export type ChallengePhase = "error" | "idle" | "active" | "summary";

export type ChallengeErrorState = {
  code: string;
  message: string;
};

export function useDailyChallenge(
  serverChallenge: DailyChallenge | null,
  serverError: ChallengeErrorState | null,
) {
  const stored = useSyncExternalStore(
    subscribeChallengeSession,
    getChallengeSessionSnapshot,
    getChallengeSessionServerSnapshot,
  );

  const session = useMemo(
    () => mergeSession(serverChallenge, stored),
    [serverChallenge, stored],
  );
  const challenge = session?.challenge ?? null;
  const selected = session?.selected;
  const checked = session?.checked;

  const firstUnchecked = checked?.findIndex((value) => !value) ?? -1;
  const derivedIndex = firstUnchecked === -1 ? 0 : firstUnchecked;
  const started =
    Boolean(checked?.some(Boolean)) ||
    Boolean(selected?.some((value) => value !== null));
  const allChecked = Boolean(checked?.length && checked.every(Boolean));

  const [inSession, setInSession] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [moved, setMoved] = useState(false);
  const [index, setIndex] = useState(0);
  const currentIndex = moved ? index : derivedIndex;

  const phase: ChallengePhase = serverError || !challenge
    ? "error"
    : reviewing || inSession
      ? "active"
      : allChecked
        ? "summary"
        : started
          ? "active"
          : "idle";

  const write = useCallback(
    (next: ChallengeSession) => {
      saveChallengeSession(next);
    },
    [],
  );

  const start = useCallback(() => {
    if (!challenge) return;
    write(session ?? emptySession(challenge));
    setInSession(true);
    setReviewing(false);
    setMoved(true);
    setIndex(derivedIndex);
  }, [challenge, derivedIndex, session, write]);

  const selectChoice = useCallback(
    (choiceIndex: number) => {
      if (!session || session.checked[currentIndex]) return;
      write({
        ...session,
        selected: session.selected.map((value, itemIndex) =>
          itemIndex === currentIndex ? choiceIndex : value,
        ),
      });
    },
    [currentIndex, session, write],
  );

  const checkAnswer = useCallback(() => {
    if (!session || session.selected[currentIndex] === null) return;
    write({
      ...session,
      checked: session.checked.map((value, itemIndex) =>
        itemIndex === currentIndex ? true : value,
      ),
    });
  }, [currentIndex, session, write]);

  const goToNext = useCallback(() => {
    if (!challenge) return;
    if (currentIndex + 1 >= challenge.questions.length) {
      setReviewing(false);
      setInSession(false);
      setMoved(false);
      return;
    }
    setMoved(true);
    setIndex(currentIndex + 1);
  }, [challenge, currentIndex]);

  const review = useCallback(() => {
    setReviewing(true);
    setInSession(true);
    setMoved(true);
    setIndex(0);
  }, []);

  const current = challenge?.questions[currentIndex] ?? null;
  const passedCount = challenge
    ? challenge.questions.filter(
        (question, questionIndex) =>
          Boolean(checked?.[questionIndex]) &&
          selected?.[questionIndex] === question.answerIndex,
      ).length
    : 0;

  return {
    phase,
    error: serverError,
    challenge,
    current,
    index: currentIndex,
    selected: selected ?? [],
    checked: checked ?? [],
    passedCount,
    start,
    selectChoice,
    checkAnswer,
    goToNext,
    review,
  };
}

function mergeSession(
  serverChallenge: DailyChallenge | null,
  stored: ChallengeSession | null,
): ChallengeSession | null {
  if (stored && serverChallenge && stored.challenge.date === serverChallenge.date) {
    if (
      stored.checked.some(Boolean) ||
      stored.selected.some((value) => value !== null)
    ) {
      return stored;
    }
    return emptySession(serverChallenge);
  }
  if (stored && !serverChallenge && stored.checked.some(Boolean)) {
    return stored;
  }
  if (serverChallenge) return emptySession(serverChallenge);
  return stored;
}
