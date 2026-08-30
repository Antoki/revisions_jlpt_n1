import vocabularyJson from "../../data/vocabulary.json";
import type { VocabularyEntry } from "./types";

export function getVocabulary(): VocabularyEntry[] {
  return vocabularyJson as VocabularyEntry[];
}
