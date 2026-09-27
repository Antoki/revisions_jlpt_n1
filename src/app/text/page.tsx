import type { Metadata } from "next";
import { GrammarTextSession } from "@/components/grammar-text/GrammarTextSession";
import { getGrammarText } from "@/lib/grammar-text";

export const metadata: Metadata = {
  title: "Grammar in text",
};

export default function TextPage() {
  return <GrammarTextSession passages={getGrammarText()} />;
}
