import type { VocabularyEntry } from "./types";

export const SESSION_SIZE = 10;
export const MAX_HEARTS = 3;
export const FAIL_WEIGHT_BUMP = 2;

export type CardOutcome = "answering" | "passed" | "failed";

export type CardAttempt = {
  hearts: number;
  readingCorrect: boolean;
  meaningCorrect: boolean;
  status: CardOutcome;
};

export type QuizWeights = Record<number, number>;

const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
const KATAKANA_TO_HIRAGANA = 0x60;

export function toHiragana(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code >= KATAKANA_START && code <= KATAKANA_END) {
      result += String.fromCharCode(code - KATAKANA_TO_HIRAGANA);
    } else {
      result += char;
    }
  }
  return result;
}

export function normalizeReading(value: string): string {
  return toHiragana(value.normalize("NFKC")).replace(/\s+/g, "").trim();
}

export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeMeaning(value: string): string {
  return stripDiacritics(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()[\]{}（）]/g, " ")
    .replace(/[/|,;:!?、。·•]/g, " ")
    .replace(/[''`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function acceptedMeanings(entry: Pick<VocabularyEntry, "meaning" | "meaningFr">): Set<string> {
  const accepted = new Set<string>();

  for (const source of [entry.meaning, entry.meaningFr]) {
    if (!source?.trim()) continue;

    const full = normalizeMeaning(source);
    if (full) accepted.add(full);

    for (const part of source.split(/[,;、]+|\s\/\s/)) {
      const cleaned = normalizeMeaning(part);
      if (cleaned) accepted.add(cleaned);

      const withoutParens = normalizeMeaning(part.replace(/\([^)]*\)/g, " "));
      if (withoutParens) accepted.add(withoutParens);
    }

    for (const match of source.matchAll(/\(([^)]+)\)/g)) {
      const inner = normalizeMeaning(match[1]);
      if (inner) accepted.add(inner);
    }
  }

  return accepted;
}

export function isReadingCorrect(input: string, kana: string): boolean {
  const guess = normalizeReading(input);
  const expected = normalizeReading(kana);
  return guess.length > 0 && guess === expected;
}

export function isMeaningCorrect(
  input: string,
  entry: Pick<VocabularyEntry, "meaning" | "meaningFr">,
): boolean {
  const guess = normalizeMeaning(input);
  if (!guess) return false;
  return acceptedMeanings(entry).has(guess);
}

export function initialAttempt(): CardAttempt {
  return {
    hearts: MAX_HEARTS,
    readingCorrect: false,
    meaningCorrect: false,
    status: "answering",
  };
}

export function applyCheck(
  attempt: CardAttempt,
  entry: Pick<VocabularyEntry, "kana" | "meaning" | "meaningFr">,
  reading: string,
  meaning: string,
): CardAttempt {
  if (attempt.status !== "answering") {
    return attempt;
  }

  const readingCorrect =
    attempt.readingCorrect || isReadingCorrect(reading, entry.kana);
  const meaningCorrect =
    attempt.meaningCorrect || isMeaningCorrect(meaning, entry);

  if (readingCorrect && meaningCorrect) {
    return {
      ...attempt,
      readingCorrect,
      meaningCorrect,
      status: "passed",
    };
  }

  const hearts = attempt.hearts - 1;
  return {
    ...attempt,
    readingCorrect,
    meaningCorrect,
    hearts,
    status: hearts <= 0 ? "failed" : "answering",
  };
}

export function weightFor(weights: QuizWeights, id: number): number {
  const value = weights[id];
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function recordOutcome(
  weights: QuizWeights,
  id: number,
  passed: boolean,
): QuizWeights {
  const current = weightFor(weights, id);
  const next = passed
    ? Math.max(1, current - 1)
    : current + FAIL_WEIGHT_BUMP;

  if (next === 1) {
    const rest = { ...weights };
    delete rest[id];
    return rest;
  }

  return { ...weights, [id]: next };
}

export function pickWeightedBatch<T extends { id: number }>(
  entries: T[],
  weights: QuizWeights,
  size: number = SESSION_SIZE,
  random: () => number = Math.random,
): T[] {
  const pool = entries.map((entry) => ({
    entry,
    weight: weightFor(weights, entry.id),
  }));
  const selected: T[] = [];
  const count = Math.min(size, pool.length);

  while (selected.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let ticket = random() * total;

    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i += 1) {
      ticket -= pool[i].weight;
      if (ticket <= 0) {
        index = i;
        break;
      }
    }

    selected.push(pool[index].entry);
    pool.splice(index, 1);
  }

  return selected;
}
