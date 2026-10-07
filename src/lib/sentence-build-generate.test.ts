import { describe, expect, it, vi } from "vitest";
import { GenerationError } from "./gemini";
import { N1_PATTERNS } from "./n1-patterns";
import { assembledSentence, starPieceIndex } from "./sentence-build";
import {
  SENTENCE_BUILD_SET_SIZE,
  buildSentenceBuildPrompt,
  buildSentenceBuildSet,
  parseSentenceBuildPayload,
} from "./sentence-build-generate";

const patterns = ["ならでは", "ともなると", "がゆえに", "そばから", "はおろか"];

function payload() {
  return {
    items: patterns.map((pattern, index) => ({
      before: index % 2 === 0 ? "最近の彼は" : "最近の彼女は",
      after: "。",
      chunks: ["その土地", `今${pattern}`, "の味を", "忘れない"],
      star: 1,
      pattern,
      explanation: `${pattern}がこの文の要点だ`,
      meaning: `Sentence ${index} uses a distinct N1 pattern.`,
    })),
  };
}

describe("sentence build generation", () => {
  it("asks Gemini for five listed N1 patterns", () => {
    const prompt = buildSentenceBuildPrompt();
    expect(prompt).toContain(`exactly ${SENTENCE_BUILD_SET_SIZE}`);
    expect(prompt).toContain("JLPT N1");
    for (const pattern of N1_PATTERNS) {
      expect(prompt).toContain(pattern);
    }
  });

  it("shuffles the pieces and keeps the starred pattern", () => {
    const script = [0, 0.99, 0];
    let cursor = 0;
    const items = parseSentenceBuildPayload(payload(), () => {
      const value = script[cursor];
      cursor += 1;
      return value ?? 0.5;
    });

    expect(items).toHaveLength(5);
    expect(items[0]?.pieces).toEqual(["今ならでは", "忘れない", "の味を", "その土地"]);
    expect(items[0]?.order).toEqual([3, 0, 2, 1]);
    expect(items[0] ? starPieceIndex(items[0]) : -1).toBe(0);
    expect(assembledSentence(items[0]!)).toBe(
      "最近の彼はその土地今ならではの味を忘れない。",
    );
    items.forEach((item) => {
      expect(new Set(item.order)).toEqual(new Set([0, 1, 2, 3]));
      expect(item.pieces[starPieceIndex(item)]).toContain(patterns[item.id - 1]);
    });
  });

  it("rejects a pattern that is not in the starred piece", () => {
    const raw = payload();
    raw.items[0]!.star = 0;

    expect(() => parseSentenceBuildPayload(raw)).toThrow(/starred piece/i);
  });

  it("rejects an unlisted pattern", () => {
    const raw = payload();
    raw.items[0]!.pattern = "です";
    raw.items[0]!.chunks[1] = "今です";
    raw.items[0]!.explanation = "ですがこの文の要点だ";

    expect(() => parseSentenceBuildPayload(raw)).toThrow(/listed N1 pattern/i);
  });

  it("retries a rejected payload once", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce(payload());

    const items = await buildSentenceBuildSet({ generate, random: () => 0.5 });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(items).toHaveLength(SENTENCE_BUILD_SET_SIZE);
  });

  it("does not retry a missing API key", async () => {
    const generate = vi.fn().mockRejectedValue(
      new GenerationError(
        "Set GEMINI_API_KEY in .env to generate new exercises.",
        "MISSING_API_KEY",
        500,
      ),
    );

    await expect(buildSentenceBuildSet({ generate })).rejects.toMatchObject({
      code: "MISSING_API_KEY",
    });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
