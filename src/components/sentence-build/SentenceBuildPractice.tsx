"use client";

import { useGeneratedSet } from "@/components/generate/use-generated-set";
import type { SentenceBuildItem } from "@/lib/sentence-build";
import { SentenceBuildSession } from "./SentenceBuildSession";

export function SentenceBuildPractice({ book }: { book: SentenceBuildItem[] }) {
  const generated = useGeneratedSet("/api/sentence-build", readItems);
  const usingGenerated = generated.active && generated.value !== null;
  const items = usingGenerated && generated.value ? generated.value : book;

  return (
    <SentenceBuildSession
      key={usingGenerated ? "generated" : "book"}
      items={items}
      summary={
        usingGenerated
          ? `${items.length} new JLPT N1 questions. Same set until tomorrow.`
          : undefined
      }
      onBegin={generated.cancel}
      generate={
        usingGenerated
          ? undefined
          : {
              label: "New N1 set",
              busyLabel: "Writing the new set",
              busy: generated.busy,
              error: generated.error,
              onGenerate: () => void generated.generate(),
            }
      }
      alternateLabel={usingGenerated ? "Book set" : undefined}
      onAlternate={usingGenerated ? generated.useBook : undefined}
    />
  );
}

function readItems(body: unknown): SentenceBuildItem[] | null {
  if (!isRecord(body) || !Array.isArray(body.items) || body.items.length === 0) return null;
  if (!body.items.every(isSentenceItem)) return null;
  return body.items as SentenceBuildItem[];
}

function isSentenceItem(value: unknown): value is SentenceBuildItem {
  if (!isRecord(value) || !Array.isArray(value.pieces) || !Array.isArray(value.order)) {
    return false;
  }
  return (
    typeof value.before === "string" &&
    typeof value.after === "string" &&
    typeof value.star === "number" &&
    typeof value.explanation === "string" &&
    typeof value.meaning === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
