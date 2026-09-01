import type { DailyChallenge } from "./challenge";

const STORAGE_KEY = "jlpt-daily-challenge";

export type ChallengeSession = {
  challenge: DailyChallenge;
  selected: (number | null)[];
  checked: boolean[];
};

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSession: ChallengeSession | null = null;
let storageListenerBound = false;

export function emptySession(challenge: DailyChallenge): ChallengeSession {
  return {
    challenge,
    selected: challenge.questions.map(() => null),
    checked: challenge.questions.map(() => false),
  };
}

export function subscribeChallengeSession(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined" && !storageListenerBound) {
    window.addEventListener("storage", handleStorage);
    storageListenerBound = true;
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined" && storageListenerBound) {
      window.removeEventListener("storage", handleStorage);
      storageListenerBound = false;
    }
  };
}

export function getChallengeSessionSnapshot(): ChallengeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = parseStoredRaw(raw);
  return cachedSession;
}

export function getChallengeSessionServerSnapshot(): ChallengeSession | null {
  return null;
}

export function saveChallengeSession(session: ChallengeSession): void {
  if (typeof window === "undefined") return;

  try {
    const raw = JSON.stringify(session);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedSession = session;
    listeners.forEach((listener) => listener());
  } catch {
    // Private mode and quota errors should not break the challenge.
  }
}

export function parseChallengeSession(raw: unknown): ChallengeSession | null {
  if (typeof raw !== "object" || raw === null) return null;

  const record = raw as Record<string, unknown>;
  const challenge = record.challenge;
  if (typeof challenge !== "object" || challenge === null) return null;

  const payload = challenge as Record<string, unknown>;
  if (typeof payload.date !== "string" || !Array.isArray(payload.questions)) {
    return null;
  }
  if (payload.questions.length === 0) return null;

  const questions = payload.questions;
  const selected = Array.isArray(record.selected)
    ? record.selected.map((value) =>
        typeof value === "number" && Number.isInteger(value) ? value : null,
      )
    : [];
  const checked = Array.isArray(record.checked)
    ? record.checked.map((value) => value === true)
    : [];

  while (selected.length < questions.length) selected.push(null);
  while (checked.length < questions.length) checked.push(false);

  return {
    challenge: challenge as DailyChallenge,
    selected: selected.slice(0, questions.length),
    checked: checked.slice(0, questions.length),
  };
}

function parseStoredRaw(raw: string | null): ChallengeSession | null {
  if (!raw) return null;
  try {
    return parseChallengeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

function handleStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  cachedRaw = undefined;
  listeners.forEach((listener) => listener());
}
