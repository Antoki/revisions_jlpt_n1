import type { Metadata } from "next";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { getVocabulary } from "@/lib/vocabulary";

export const metadata: Metadata = {
  title: "Review",
};

export default function PracticePage() {
  const entries = getVocabulary();

  return <PracticeSession entries={entries} />;
}
