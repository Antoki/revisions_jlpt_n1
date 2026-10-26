import type { Metadata } from "next";
import { SentenceBuildPractice } from "@/components/sentence-build/SentenceBuildPractice";
import { getSentenceBuild } from "@/lib/sentence-build";

export const metadata: Metadata = {
  title: "Sentence build",
};

export default function BuildPage() {
  const items = getSentenceBuild();

  return <SentenceBuildPractice book={items} />;
}
