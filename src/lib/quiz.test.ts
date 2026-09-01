import { describe, expect, it } from "vitest";
import {
  acceptedMeanings,
  applyCheck,
  initialAttempt,
  isMeaningCorrect,
  isReadingCorrect,
  pickWeightedBatch,
  recordOutcome,
} from "./quiz";

const entry = {
  kana: "ほうき",
  meaning: "abandonment",
  meaningFr: "abandon, renonciation",
};

describe("isReadingCorrect", () => {
  it("accepts the stored hiragana", () => {
    expect(isReadingCorrect("ほうき", "ほうき")).toBe(true);
  });

  it("accepts katakana that matches the hiragana reading", () => {
    expect(isReadingCorrect("ホウキ", "ほうき")).toBe(true);
  });

  it("accepts hiragana for a katakana loanword", () => {
    expect(isReadingCorrect("りすく", "リスク")).toBe(true);
  });

  it("ignores surrounding spaces", () => {
    expect(isReadingCorrect("  ほうき  ", "ほうき")).toBe(true);
  });

  it("rejects a different reading", () => {
    expect(isReadingCorrect("ほうぎ", "ほうき")).toBe(false);
  });

  it("rejects an empty guess", () => {
    expect(isReadingCorrect("   ", "ほうき")).toBe(false);
  });
});

describe("isMeaningCorrect", () => {
  it("accepts the English meaning, case-insensitive", () => {
    expect(isMeaningCorrect("Abandonment", entry)).toBe(true);
  });

  it("accepts either French alternative", () => {
    expect(isMeaningCorrect("abandon", entry)).toBe(true);
    expect(isMeaningCorrect("renonciation", entry)).toBe(true);
  });

  it("accepts slash-separated English alternatives", () => {
    expect(
      isMeaningCorrect("anxious", {
        meaning: "jealous / anxious",
        meaningFr: "jaloux",
      }),
    ).toBe(true);
  });

  it("ignores French diacritics", () => {
    expect(
      isMeaningCorrect("repartition", {
        meaning: "distribution",
        meaningFr: "répartition",
      }),
    ).toBe(true);
  });

  it("accepts a French headword and ignores a trailing parenthetical", () => {
    expect(
      isMeaningCorrect("cachet", {
        meaning: "payment",
        meaningFr: "cachet, rémunération (freelance/artiste)",
      }),
    ).toBe(true);
    expect(
      isMeaningCorrect("remuneration", {
        meaning: "payment",
        meaningFr: "cachet, rémunération (freelance/artiste)",
      }),
    ).toBe(true);
  });

  it("rejects a meaning that is only a substring", () => {
    expect(isMeaningCorrect("abandon", { meaning: "abandonment", meaningFr: "" })).toBe(
      false,
    );
  });

  it("rejects an empty guess", () => {
    expect(isMeaningCorrect("  ", entry)).toBe(false);
  });
});

describe("acceptedMeanings", () => {
  it("keeps the full phrase and each comma part", () => {
    const accepted = acceptedMeanings(entry);
    expect(accepted.has("abandonment")).toBe(true);
    expect(accepted.has("abandon")).toBe(true);
    expect(accepted.has("renonciation")).toBe(true);
    expect(accepted.has("abandon renonciation")).toBe(true);
  });
});

describe("applyCheck", () => {
  it("locks a correct field and spends a shared heart when the other is wrong", () => {
    const next = applyCheck(initialAttempt(), entry, "ほうき", "nope");

    expect(next.readingCorrect).toBe(true);
    expect(next.meaningCorrect).toBe(false);
    expect(next.hearts).toBe(2);
    expect(next.status).toBe("answering");
  });

  it("passes without spending a heart when both fields are correct", () => {
    const next = applyCheck(initialAttempt(), entry, "ほうき", "abandonment");

    expect(next.status).toBe("passed");
    expect(next.hearts).toBe(3);
  });

  it("can pass on a later try after a field was already locked", () => {
    const first = applyCheck(initialAttempt(), entry, "ほうき", "nope");
    const second = applyCheck(first, entry, "ほうき", "abandon");

    expect(second.status).toBe("passed");
    expect(second.hearts).toBe(2);
    expect(second.readingCorrect).toBe(true);
    expect(second.meaningCorrect).toBe(true);
  });

  it("fails after the third missed check", () => {
    let attempt = initialAttempt();
    attempt = applyCheck(attempt, entry, "wrong", "wrong");
    attempt = applyCheck(attempt, entry, "wrong", "wrong");
    attempt = applyCheck(attempt, entry, "wrong", "wrong");

    expect(attempt.hearts).toBe(0);
    expect(attempt.status).toBe("failed");
  });

  it("does not spend a heart on an already resolved card", () => {
    const passed = applyCheck(initialAttempt(), entry, "ほうき", "abandon");
    const again = applyCheck(passed, entry, "wrong", "wrong");

    expect(again).toEqual(passed);
  });
});

describe("recordOutcome", () => {
  it("increases the weight of a failed word", () => {
    expect(recordOutcome({}, 1, false)).toEqual({ 1: 3 });
  });

  it("decays a boosted word after a pass and drops default weights", () => {
    expect(recordOutcome({ 1: 3 }, 1, true)).toEqual({ 1: 2 });
    expect(recordOutcome({ 1: 2 }, 1, true)).toEqual({});
  });
});

describe("pickWeightedBatch", () => {
  const words = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it("picks the higher-weight word when the draw lands in its range", () => {
    const picked = pickWeightedBatch(words, { 3: 98 }, 1, () => 0.5);
    expect(picked).toEqual([{ id: 3 }]);
  });

  it("never repeats a word in the same batch", () => {
    const picked = pickWeightedBatch(words, {}, 3, () => 0.2);
    expect(picked.map((word) => word.id).sort()).toEqual([1, 2, 3]);
  });

  it("returns every entry when the list is smaller than the session size", () => {
    expect(pickWeightedBatch(words, {}, 10).length).toBe(3);
  });
});
