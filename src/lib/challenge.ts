import { normalizeReading, pickWeightedBatch } from "./quiz";
import type { VocabularyEntry } from "./types";

export const CHALLENGE_SIZE = 5;
export const CHOICE_COUNT = 4;
export const CHALLENGE_POOL_SIZE = 24;
export const CHALLENGE_TIMEZONE = "Asia/Tokyo";
export const GENERATION_ATTEMPTS = 2;

export type ChallengeErrorCode =
  | "MISSING_API_KEY"
  | "INSUFFICIENT_CONTENT"
  | "GENERATION_FAILED";

export class ChallengeError extends Error {
  readonly code: ChallengeErrorCode;
  readonly status: number;

  constructor(message: string, code: ChallengeErrorCode, status: number) {
    super(message);
    this.name = "ChallengeError";
    this.code = code;
    this.status = status;
  }
}

export type ChallengeQuestionType = "reading" | "cloze";

/** Content the challenge can draw from. Add passage sources here later. */
export type ChallengeSource = {
  kind: "vocabulary";
  id: number;
  kanji: string;
  kana: string;
  meaning: string;
  meaningFr: string;
};

export type ChallengeQuestion = {
  id: string;
  type: ChallengeQuestionType;
  prompt: string;
  choices: string[];
  answerIndex: number;
  source: ChallengeSource;
};

export type DailyChallenge = {
  date: string;
  questions: ChallengeQuestion[];
};

export const CHALLENGE_JSON_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      minItems: CHALLENGE_SIZE,
      maxItems: CHALLENGE_SIZE,
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["reading", "cloze"] },
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: { type: "string" },
            minItems: CHOICE_COUNT,
            maxItems: CHOICE_COUNT,
          },
          answerIndex: { type: "integer" },
          targetId: { type: "integer" },
        },
        required: ["type", "prompt", "choices", "answerIndex", "targetId"],
      },
    },
  },
  required: ["questions"],
} as const;

const BLANK_MARKER = "（　）";
const BLANK_PATTERN = /（\s*）|\(\s*\)|_{2,}|＿+|□+/;

export function challengeDateKey(
  now: Date = new Date(),
  timeZone: string = CHALLENGE_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function sourcesFromVocabulary(
  entries: VocabularyEntry[],
): ChallengeSource[] {
  return entries.map((entry) => ({
    kind: "vocabulary",
    id: entry.id,
    kanji: entry.kanji,
    kana: entry.kana,
    meaning: entry.meaning,
    meaningFr: entry.meaningFr,
  }));
}

export function pickDailyPool<T extends { id: number }>(
  entries: T[],
  dateKey: string,
  size: number = CHALLENGE_POOL_SIZE,
): T[] {
  return pickWeightedBatch(entries, {}, size, mulberry32(dateSeed(dateKey)));
}

export function parseChallengePayload(
  raw: unknown,
  pool: ChallengeSource[],
): ChallengeQuestion[] {
  if (!isRecord(raw) || !Array.isArray(raw.questions)) {
    throw new Error("Model output must be an object with a questions array.");
  }
  if (raw.questions.length !== CHALLENGE_SIZE) {
    throw new Error(`Challenge must contain ${CHALLENGE_SIZE} questions.`);
  }

  const byId = new Map(pool.map((item) => [item.id, item]));
  const kanjiSet = new Set(pool.map((item) => item.kanji));
  const seenTargets = new Set<number>();
  const questions = raw.questions.map((item, index) =>
    parseQuestion(item, index, byId, kanjiSet, seenTargets),
  );

  const canAskReading = pool.some((item) => item.kanji !== item.kana);
  const types = new Set(questions.map((question) => question.type));
  if (canAskReading && (!types.has("reading") || !types.has("cloze"))) {
    throw new Error("Challenge must mix reading and cloze questions.");
  }

  return questions;
}

export async function buildDailyChallenge(options: {
  dateKey: string;
  entries: VocabularyEntry[];
  generate: (pool: ChallengeSource[]) => Promise<unknown>;
}): Promise<DailyChallenge> {
  if (options.entries.length < CHALLENGE_SIZE) {
    throw new ChallengeError(
      `Need at least ${CHALLENGE_SIZE} vocabulary entries to build a challenge.`,
      "INSUFFICIENT_CONTENT",
      422,
    );
  }

  const pool = pickDailyPool(
    sourcesFromVocabulary(options.entries),
    options.dateKey,
  );

  let lastError: unknown;
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const questions = parseChallengePayload(await options.generate(pool), pool);
      return { date: options.dateKey, questions };
    } catch (error) {
      lastError = error;
    }
  }

  throw new ChallengeError(
    lastError instanceof Error
      ? lastError.message
      : "Could not generate today's challenge.",
    "GENERATION_FAILED",
    503,
  );
}

function parseQuestion(
  raw: unknown,
  index: number,
  byId: Map<number, ChallengeSource>,
  kanjiSet: Set<string>,
  seenTargets: Set<number>,
): ChallengeQuestion {
  if (!isRecord(raw)) {
    throw new Error(`Question ${index + 1} is not an object.`);
  }

  const type = raw.type;
  if (type !== "reading" && type !== "cloze") {
    throw new Error(`Question ${index + 1} has an unknown type.`);
  }

  const targetId = raw.targetId;
  if (typeof targetId !== "number" || !Number.isInteger(targetId)) {
    throw new Error(`Question ${index + 1} is missing a valid target.`);
  }

  const source = byId.get(targetId);
  if (!source) {
    throw new Error(`Question ${index + 1} points at a target outside the pool.`);
  }
  if (seenTargets.has(targetId)) {
    throw new Error("Each question must use a unique target word.");
  }
  seenTargets.add(targetId);

  if (!Array.isArray(raw.choices) || raw.choices.length !== CHOICE_COUNT) {
    throw new Error(`Question ${index + 1} must have ${CHOICE_COUNT} choices.`);
  }

  const choices = raw.choices.map((choice) => {
    if (typeof choice !== "string" || !choice.trim()) {
      throw new Error(`Question ${index + 1} has an empty choice.`);
    }
    return choice.trim();
  });

  const uniqueKey =
    type === "reading"
      ? (choice: string) => normalizeReading(choice)
      : (choice: string) => choice;
  if (new Set(choices.map(uniqueKey)).size !== CHOICE_COUNT) {
    throw new Error(`Question ${index + 1} has duplicate choices.`);
  }

  if (type === "cloze") {
    for (const choice of choices) {
      if (!kanjiSet.has(choice)) {
        throw new Error("Cloze choices must come from the vocabulary pool.");
      }
    }
  }

  let prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : "";
  let answerIndex: number;

  if (type === "reading") {
    prompt = source.kanji;
    answerIndex = choices.findIndex(
      (choice) => normalizeReading(choice) === normalizeReading(source.kana),
    );
    if (answerIndex < 0) {
      throw new Error("Reading choices must include the word's stored kana.");
    }
  } else {
    if (!BLANK_PATTERN.test(prompt)) {
      throw new Error("Cloze questions must include a blank in the sentence.");
    }
    prompt = prompt.replace(BLANK_PATTERN, BLANK_MARKER);
    answerIndex = choices.indexOf(source.kanji);
    if (answerIndex < 0) {
      throw new Error("Cloze choices must include the target word.");
    }
  }

  return {
    id: String(index),
    type,
    prompt,
    choices,
    answerIndex,
    source,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dateSeed(dateKey: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
