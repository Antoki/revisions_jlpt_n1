import grammarTextJson from "../../data/grammar-text.json";

export type GrammarTextPart = { text: string } | { blank: number };

export type GrammarTextBlank = {
  id: number;
  choices: string[];
  answer: number;
  explanation: string;
  meaning: string;
};

export type GrammarTextPassage = {
  id: number;
  lead: string;
  source: string;
  notes: string[];
  parts: GrammarTextPart[];
  blanks: GrammarTextBlank[];
};

export type GrammarTextQuestion = {
  passage: GrammarTextPassage;
  blank: GrammarTextBlank;
};

export function getGrammarText(): GrammarTextPassage[] {
  return grammarTextJson as GrammarTextPassage[];
}

export function listQuestions(passages: GrammarTextPassage[]): GrammarTextQuestion[] {
  return passages.flatMap((passage) =>
    passage.blanks.map((blank) => ({ passage, blank })),
  );
}

export function filledPassage(passage: GrammarTextPassage): string {
  return passage.parts
    .map((part) => {
      if ("text" in part) return part.text;
      const blank = passage.blanks.find((item) => item.id === part.blank);
      return blank ? blank.choices[blank.answer] : "";
    })
    .join("");
}
