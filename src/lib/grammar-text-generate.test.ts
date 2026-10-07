import { describe, expect, it, vi } from "vitest";
import { GenerationError } from "./gemini";
import { filledPassage } from "./grammar-text";
import { N1_PATTERNS } from "./n1-patterns";
import {
  GENERATED_PASSAGE_SOURCE,
  GRAMMAR_TEXT_BLANK_COUNT,
  buildGrammarTextPrompt,
  buildGrammarTextSet,
  parseGrammarTextPayload,
} from "./grammar-text-generate";

const patterns = ["ならでは", "ともなると", "がゆえに", "はおろか"];
const marks = ["甲", "乙", "丙", "丁"];
const safe = "この点は選択の理由を考えるうえで欠かせない論点である。";

function payload() {
  const text = `${safe}${safe}`;
  return {
    lead: "以下は、練習のために書いた文章である。",
    notes: [],
    segments: [text, text, text, text, text],
    blanks: patterns.map((pattern, index) => ({
      choices: [
        `それ${pattern}の話だ`,
        `別の見方${marks[index]}で進む`,
        `単に条件${marks[index]}を見る`,
        `逆の判断${marks[index]}をする`,
      ],
      answer: 0,
      pattern,
      explanation: `${pattern}が文脈に合う表現だ`,
      meaning: "This phrase fits the sentence.",
    })),
  };
}

describe("grammar text generation", () => {
  it("asks Gemini for an original N1 passage", () => {
    const prompt = buildGrammarTextPrompt();
    expect(prompt).toContain("JLPT N1");
    expect(prompt).toContain(`exactly ${GRAMMAR_TEXT_BLANK_COUNT}`);
    for (const pattern of N1_PATTERNS) {
      expect(prompt).toContain(pattern);
    }
  });

  it("builds one passage whose blanks use different N1 patterns", () => {
    const [passage] = parseGrammarTextPayload(payload());
    expect(passage?.source).toBe(GENERATED_PASSAGE_SOURCE);
    expect(passage?.blanks.map((blank) => blank.id)).toEqual([1, 2, 3, 4]);
    expect(passage?.parts.flatMap((part) => ("blank" in part ? [part.blank] : []))).toEqual([
      1, 2, 3, 4,
    ]);

    const filled = passage ? filledPassage(passage) : "";
    passage?.blanks.forEach((blank) => {
      expect(blank.choices).toHaveLength(4);
      expect(filled).toContain(blank.choices[blank.answer]);
      expect(blank.explanation).toContain(patterns[blank.id - 1]);
    });
  });

  it("rejects a passage that reveals the pattern in the text", () => {
    const raw = payload();
    raw.segments[1] = `${raw.segments[1]}ならでは`;

    expect(() => parseGrammarTextPayload(raw)).toThrow(/answer pattern/i);
  });

  it("retries a rejected payload once", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ blanks: [] })
      .mockResolvedValueOnce(payload());

    const passages = await buildGrammarTextSet({ generate });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(passages).toHaveLength(1);
    expect(passages[0]?.blanks).toHaveLength(GRAMMAR_TEXT_BLANK_COUNT);
  });

  it("does not retry a missing API key", async () => {
    const generate = vi.fn().mockRejectedValue(
      new GenerationError(
        "Set GEMINI_API_KEY in .env to generate new exercises.",
        "MISSING_API_KEY",
        500,
      ),
    );

    await expect(buildGrammarTextSet({ generate })).rejects.toMatchObject({
      code: "MISSING_API_KEY",
    });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
