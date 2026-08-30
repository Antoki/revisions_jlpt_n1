import type { Metadata } from "next";
import { VocabularyExplorer } from "@/components/dictionary/VocabularyExplorer";
import { getVocabulary } from "@/lib/vocabulary";

export const metadata: Metadata = {
  title: "Dictionary",
};

export default function DictionaryPage() {
  const entries = getVocabulary();

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dictionary</h1>
        <p className="mt-1 text-sm text-muted">
          Search the full N1 list by kanji, reading, or meaning.
        </p>
      </div>
      <VocabularyExplorer entries={entries} />
    </section>
  );
}
