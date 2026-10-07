"use client";

import { useCallback, useRef, useState } from "react";

export function useGeneratedSet<T>(url: string, read: (body: unknown) => T | null) {
  const [value, setValue] = useState<T | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const generate = useCallback(async () => {
    const id = ++requestId.current;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, { cache: "no-store" });
      const body: unknown = await response.json();
      if (requestId.current !== id) return;
      if (!response.ok) {
        setError(messageFrom(body));
        return;
      }
      const next = read(body);
      if (!next) {
        setError("Could not generate a new set.");
        return;
      }
      setValue(next);
      setActive(true);
    } catch {
      if (requestId.current !== id) return;
      setError("Could not generate a new set.");
    } finally {
      if (requestId.current === id) setBusy(false);
    }
  }, [read, url]);

  const cancel = useCallback(() => {
    requestId.current += 1;
    setBusy(false);
  }, []);

  const useBook = useCallback(() => {
    requestId.current += 1;
    setBusy(false);
    setActive(false);
    setError(null);
  }, []);

  return { value, active, busy, error, generate, cancel, useBook };
}

function messageFrom(body: unknown): string {
  if (!isRecord(body) || !isRecord(body.error) || typeof body.error.message !== "string") {
    return "Could not generate a new set.";
  }
  const message = body.error.message.trim();
  return message || "Could not generate a new set.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
