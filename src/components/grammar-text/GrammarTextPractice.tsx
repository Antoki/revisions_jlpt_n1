"use client";

import { useGeneratedSet } from "@/components/generate/use-generated-set";
import { listQuestions, type GrammarTextPassage } from "@/lib/grammar-text";
import { GrammarTextSession } from "./GrammarTextSession";

export function GrammarTextPractice({ book }: { book: GrammarTextPassage[] }) {
  const generated = useGeneratedSet("/api/grammar-text", readPassages);
  const usingGenerated = generated.active && generated.value !== null;
  const passages = usingGenerated && generated.value ? generated.value : book;
  const blanks = listQuestions(passages).length;

  return (
    <GrammarTextSession
      key={usingGenerated ? "generated" : "book"}
      passages={passages}
      summary={
        usingGenerated
          ? `1 new JLPT N1 passage, ${blanks} blanks. Same passage until tomorrow.`
          : undefined
      }
      onBegin={generated.cancel}
      generate={
        usingGenerated
          ? undefined
          : {
              label: "New N1 passage",
              busyLabel: "Writing the passage",
              busy: generated.busy,
              error: generated.error,
              onGenerate: () => void generated.generate(),
            }
      }
      alternateLabel={usingGenerated ? "Book passages" : undefined}
      onAlternate={usingGenerated ? generated.useBook : undefined}
    />
  );
}

function readPassages(body: unknown): GrammarTextPassage[] | null {
  if (!isRecord(body) || !Array.isArray(body.passages) || body.passages.length === 0) {
    return null;
  }
  if (!body.passages.every(isPassage)) return null;
  return body.passages as GrammarTextPassage[];
}

function isPassage(value: unknown): value is GrammarTextPassage {
  if (!isRecord(value) || !Array.isArray(value.parts) || !Array.isArray(value.blanks)) {
    return false;
  }
  return typeof value.lead === "string" && typeof value.source === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
