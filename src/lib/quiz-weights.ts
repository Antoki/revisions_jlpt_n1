import type { QuizWeights } from "./quiz";

const STORAGE_KEY = "jlpt-quiz-weights";

export function loadWeights(): QuizWeights {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const weights: QuizWeights = {};

    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (!Number.isInteger(id) || typeof value !== "number" || value < 1) {
        continue;
      }
      weights[id] = value;
    }

    return weights;
  } catch {
    return {};
  }
}

export function saveWeights(weights: QuizWeights): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
  } catch {
    // Private mode and quota errors should not break a review session.
  }
}
