import type { Metadata } from "next";
import { GrammarTextPractice } from "@/components/grammar-text/GrammarTextPractice";
import { getGrammarText } from "@/lib/grammar-text";

export const metadata: Metadata = {
  title: "Grammar in text",
};

export default function TextPage() {
  return <GrammarTextPractice book={getGrammarText()} />;
}
