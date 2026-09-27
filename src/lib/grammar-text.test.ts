import { describe, expect, it } from "vitest";
import {
  filledPassage,
  getGrammarText,
  insertedText,
  listQuestions,
} from "./grammar-text";

const answers = [2, 2, 1, 3, 4, 4, 1, 3, 4, 1, 2, 4, 1, 4, 3];

const snippets = [
  "自分にとって魅力的な仕事であるに越したことはない。",
  "取り組むに値する行為だからこそやる",
  "言われてみれば当たり前の話かもしれないが",
  "「絶対に無理」「できそうもない」",
  "かどうか、つまり、「主観的に知覚された成功の見込み」",
  "そんな時、ホームの天井から",
  "これなら辛うじて間に合うなと",
  "解決した途端、何事もなかったかの様に次の関心事",
  "イライラに対して及ぼされていると思うと",
  "切り替わった瞬間の小さな驚きのせいであった。",
  "そうやっていた。母に言わせると、お父さんは",
  "読みふける。読みふけるフリをする。",
  "ところが、出張から帰った父は、ことのほかご機嫌ななめで",
  "そんなに居てもらいたいのなら",
  "確執があると思われるに違いない。",
];

describe("grammar in text", () => {
  const passages = getGrammarText();
  const questions = listQuestions(passages);

  it("covers the fifteen blanks in book order", () => {
    expect(questions.map((item) => item.blank.id)).toEqual(
      answers.map((_, index) => index + 1),
    );
  });

  it("keeps four choices and the answer key", () => {
    questions.forEach((item, index) => {
      expect(item.blank.choices).toHaveLength(4);
      expect(new Set(item.blank.choices).size).toBe(4);
      expect(item.blank.answer + 1).toBe(answers[index]);
      expect(item.blank.explanation.length).toBeGreaterThan(0);
      expect(item.blank.meaning.length).toBeGreaterThan(0);
    });
  });

  it("inserts a chosen expression and keeps the blank number until then", () => {
    const blank = questions[0].blank;
    expect(insertedText(blank, null)).toBe(String(blank.id));
    expect(insertedText(blank, blank.answer)).toBe(blank.choices[blank.answer]);
    expect(insertedText(blank, -1)).toBe(String(blank.id));
    expect(insertedText(blank, blank.choices.length)).toBe(String(blank.id));
  });

  it("fills each passage with the keyed expression", () => {
    const filled = passages.map(filledPassage).join("\n");
    snippets.forEach((snippet) => {
      expect(filled).toContain(snippet);
    });
  });
});
