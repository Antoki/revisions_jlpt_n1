import type { VocabularyEntry } from "./types";

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

export function filterVocabulary(
  entries: VocabularyEntry[],
  query: string,
): VocabularyEntry[] {
  const needle = normalize(query.trim());
  if (!needle) {
    return entries;
  }

  return entries.filter((entry) => {
    return (
      normalize(entry.kanji).includes(needle) ||
      normalize(entry.kana).includes(needle) ||
      normalize(entry.meaning).includes(needle) ||
      normalize(entry.meaningFr).includes(needle)
    );
  });
}
