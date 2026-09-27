import type { Metadata } from "next";
import { SentenceBuildSession } from "@/components/sentence-build/SentenceBuildSession";
import { getSentenceBuild } from "@/lib/sentence-build";

export const metadata: Metadata = {
  title: "Sentence build",
};

export default function BuildPage() {
  const items = getSentenceBuild();

  return <SentenceBuildSession items={items} />;
}
