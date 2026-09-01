"use client";

import { useCallback, useMemo, useState } from "react";
import {
  applyCheck,
  initialAttempt,
  pickWeightedBatch,
  recordOutcome,
  SESSION_SIZE,
  type CardAttempt,
} from "@/lib/quiz";
import { loadWeights, saveWeights } from "@/lib/quiz-weights";
import type { VocabularyEntry } from "@/lib/types";

export type SessionCard = {
  entry: VocabularyEntry;
  attempt: CardAttempt;
  reading: string;
  meaning: string;
};

export type PracticePhase = "idle" | "active" | "summary";

export function usePracticeSession(entries: VocabularyEntry[]) {
  const [phase, setPhase] = useState<PracticePhase>("idle");
  const [cards, setCards] = useState<SessionCard[]>([]);
  const [index, setIndex] = useState(0);

  const current = cards[index] ?? null;
  const passedCount = useMemo(
    () => cards.filter((card) => card.attempt.status === "passed").length,
    [cards],
  );

  const startSession = useCallback(() => {
    const batch = pickWeightedBatch(entries, loadWeights(), SESSION_SIZE);
    setCards(
      batch.map((entry) => ({
        entry,
        attempt: initialAttempt(),
        reading: "",
        meaning: "",
      })),
    );
    setIndex(0);
    setPhase(batch.length === 0 ? "idle" : "active");
  }, [entries]);

  const setReading = useCallback((value: string) => {
    setCards((currentCards) =>
      currentCards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, reading: value } : card,
      ),
    );
  }, [index]);

  const setMeaning = useCallback((value: string) => {
    setCards((currentCards) =>
      currentCards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, meaning: value } : card,
      ),
    );
  }, [index]);

  const checkAnswer = useCallback(() => {
    const card = cards[index];
    if (!card || card.attempt.status !== "answering") {
      return;
    }

    const attempt = applyCheck(
      card.attempt,
      card.entry,
      card.reading,
      card.meaning,
    );

    setCards((currentCards) =>
      currentCards.map((item, cardIndex) =>
        cardIndex === index ? { ...item, attempt } : item,
      ),
    );

    if (attempt.status !== "answering") {
      saveWeights(
        recordOutcome(
          loadWeights(),
          card.entry.id,
          attempt.status === "passed",
        ),
      );
    }
  }, [cards, index]);

  const goToNext = useCallback(() => {
    if (index + 1 >= cards.length) {
      setPhase("summary");
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
  }, [cards.length, index]);

  return {
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
  };
}
