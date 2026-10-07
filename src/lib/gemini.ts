import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.5-flash-lite";
const GENERATION_TIMEOUT_MS = 55_000;

export const GENERATION_ATTEMPTS = 2;

export type GenerationErrorCode = "MISSING_API_KEY" | "GENERATION_FAILED";

export class GenerationError extends Error {
  readonly code: GenerationErrorCode;
  readonly status: number;

  constructor(message: string, code: GenerationErrorCode, status: number) {
    super(message);
    this.name = "GenerationError";
    this.code = code;
    this.status = status;
  }
}

type MemoryStore<T> = {
  memory: Map<string, T>;
  inflight: Map<string, Promise<T>>;
};

export function rememberStore<T>(key: string): MemoryStore<T> {
  const holder = globalThis as unknown as Record<string, MemoryStore<T> | undefined>;
  const existing = holder[key];
  if (existing) return existing;

  const created: MemoryStore<T> = {
    memory: new Map(),
    inflight: new Map(),
  };
  holder[key] = created;
  return created;
}

export async function getOrCreateCached<T>(options: {
  store: MemoryStore<T>;
  dateKey: string;
  read: (dateKey: string) => Promise<T | null>;
  write: (value: T) => Promise<void>;
  create: () => Promise<T>;
}): Promise<T> {
  const cached =
    options.store.memory.get(options.dateKey) ?? (await options.read(options.dateKey));
  if (cached) {
    options.store.memory.set(options.dateKey, cached);
    return cached;
  }

  const pending = options.store.inflight.get(options.dateKey);
  if (pending) return pending;

  const promise = options
    .create()
    .then(async (value) => {
      options.store.memory.set(options.dateKey, value);
      await options.write(value);
      return value;
    })
    .finally(() => {
      options.store.inflight.delete(options.dateKey);
    });

  options.store.inflight.set(options.dateKey, promise);
  return promise;
}

export async function generateJson(options: {
  system: string;
  prompt: string;
  schema: object;
  emptyMessage: string;
  failureMessage: string;
}): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GenerationError(
      "Set GEMINI_API_KEY in .env to generate new exercises.",
      "MISSING_API_KEY",
      500,
    );
  }

  const client = new GoogleGenAI({ apiKey });
  try {
    const interaction = await client.interactions.create(
      {
        model: MODEL,
        store: false,
        system_instruction: options.system,
        input: options.prompt,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: options.schema,
        },
      },
      { timeout: GENERATION_TIMEOUT_MS },
    );

    const text = interaction.output_text?.trim();
    if (!text) {
      throw new GenerationError(options.emptyMessage, "GENERATION_FAILED", 503);
    }

    return parseJsonText(text);
  } catch (error) {
    if (error instanceof GenerationError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/\b429\b/u.test(message) || /quota/iu.test(message)) {
      throw new GenerationError(
        "The question generator is busy. Try again in a minute.",
        "GENERATION_FAILED",
        503,
      );
    }
    throw new GenerationError(options.failureMessage, "GENERATION_FAILED", 503);
  }
}

export async function attemptGeneration<T>(
  generate: () => Promise<unknown>,
  parse: (raw: unknown) => T,
  failureMessage: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    try {
      return parse(await generate());
    } catch (error) {
      if (error instanceof GenerationError && error.code === "MISSING_API_KEY") {
        throw error;
      }
      lastError = error;
    }
  }

  if (lastError instanceof GenerationError) throw lastError;
  console.error(
    failureMessage,
    lastError instanceof Error ? lastError.message : lastError,
  );
  throw new GenerationError(failureMessage, "GENERATION_FAILED", 503);
}

export function generationFailedResponse(error: unknown, fallback: string): Response {
  const known =
    error instanceof GenerationError
      ? error
      : new GenerationError(fallback, "GENERATION_FAILED", 503);

  if (!(error instanceof GenerationError)) {
    console.error(fallback);
  }

  return Response.json(
    {
      error: {
        code: known.code,
        message: known.message,
      },
    },
    {
      status: known.status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function readCachedJson(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

export async function writeCachedJson(filePath: string, value: unknown): Promise<void> {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(value), "utf8");
  } catch {
    // Cache writes are optional.
  }
}

function parseJsonText(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new GenerationError(
      "The model did not return JSON.",
      "GENERATION_FAILED",
      503,
    );
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    throw new GenerationError(
      "The model returned invalid JSON.",
      "GENERATION_FAILED",
      503,
    );
  }
}
