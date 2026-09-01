import { describe, expect, it, vi } from "vitest";
import {
  CHALLENGE_SIZE,
  buildDailyChallenge,
  challengeDateKey,
  parseChallengePayload,
  pickDailyPool,
  sourcesFromVocabulary,
} from "./challenge";
import type { ChallengeSource } from "./challenge";
import type { VocabularyEntry } from "./types";

const pool: ChallengeSource[] = [
  vocab(1, "放棄", "ほうき", "abandonment"),
  vocab(2, "共存", "きょうぞん", "coexistence"),
  vocab(3, "両立", "りょうりつ", "compatibility"),
  vocab(4, "分配", "ぶんぱい", "distribution"),
  vocab(5, "干渉", "かんしょう", "interference"),
  vocab(6, "推移", "すいい", "transition"),
];

function vocab(
  id: number,
  kanji: string,
  kana: string,
  meaning: string,
): ChallengeSource {
  return {
    kind: "vocabulary",
    id,
    kanji,
    kana,
    meaning,
    meaningFr: meaning,
  };
}

function entry(
  id: number,
  kanji: string,
  kana: string,
  meaning: string,
): VocabularyEntry {
  return {
    id,
    kanji,
    kana,
    meaning,
    meaningFr: meaning,
    nuance: "",
    example: "",
    group: "1",
  };
}

function validPayload() {
  return {
    questions: [
      {
        type: "reading",
        prompt: "放棄",
        choices: ["ほうき", "ほうぎ", "ほうきょ", "ぼうき"],
        answerIndex: 0,
        targetId: 1,
      },
      {
        type: "reading",
        prompt: "共存",
        choices: ["きょうそん", "きょうぞん", "ごうぞん", "きょうざん"],
        answerIndex: 1,
        targetId: 2,
      },
      {
        type: "cloze",
        prompt: "仕事と家庭の（　）は簡単ではない。",
        choices: ["放棄", "両立", "分配", "干渉"],
        answerIndex: 1,
        targetId: 3,
      },
      {
        type: "cloze",
        prompt: "利益の公平な（　）が求められている。",
        choices: ["推移", "干渉", "分配", "共存"],
        answerIndex: 2,
        targetId: 4,
      },
      {
        type: "cloze",
        prompt: "内政（　）と批判された。",
        choices: ["干渉", "推移", "両立", "放棄"],
        answerIndex: 0,
        targetId: 5,
      },
    ],
  };
}

describe("challengeDateKey", () => {
  it("uses the Tokyo calendar date, not UTC", () => {
    expect(challengeDateKey(new Date("2026-09-01T16:00:00.000Z"))).toBe(
      "2026-09-02",
    );
    expect(challengeDateKey(new Date("2026-09-01T14:00:00.000Z"))).toBe(
      "2026-09-01",
    );
  });
});

describe("sourcesFromVocabulary", () => {
  it("tags each entry as vocabulary content", () => {
    const sources = sourcesFromVocabulary([
      entry(1, "放棄", "ほうき", "abandonment"),
    ]);

    expect(sources).toEqual([
      {
        kind: "vocabulary",
        id: 1,
        kanji: "放棄",
        kana: "ほうき",
        meaning: "abandonment",
        meaningFr: "abandonment",
      },
    ]);
  });
});

describe("pickDailyPool", () => {
  const entries = pool.map((item) =>
    entry(item.id, item.kanji, item.kana, item.meaning),
  );

  it("returns the same words for the same date", () => {
    const first = pickDailyPool(entries, "2026-09-02");
    const second = pickDailyPool(entries, "2026-09-02");
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
  });

  it("can return a different order on another date", () => {
    const first = pickDailyPool(entries, "2026-09-02").map((item) => item.id);
    const second = pickDailyPool(entries, "2026-09-03").map((item) => item.id);
    expect(first).not.toEqual(second);
  });
});

describe("parseChallengePayload", () => {
  it("accepts a mixed set of five JLPT-style questions", () => {
    const questions = parseChallengePayload(validPayload(), pool);

    expect(questions).toHaveLength(CHALLENGE_SIZE);
    expect(questions.some((question) => question.type === "reading")).toBe(true);
    expect(questions.some((question) => question.type === "cloze")).toBe(true);
    expect(questions[2]?.prompt).toContain("（　）");
    expect(questions[0]?.source.kanji).toBe("放棄");
    expect(questions[0]?.choices).toHaveLength(4);
  });

  it("corrects a reading answer index when the stored kana is among the choices", () => {
    const payload = validPayload();
    payload.questions[0].answerIndex = 3;

    const [reading] = parseChallengePayload(payload, pool);
    expect(reading?.choices[reading.answerIndex]).toBe("ほうき");
  });

  it("normalizes underscore blanks in cloze prompts", () => {
    const payload = validPayload();
    payload.questions[2].prompt = "仕事と家庭の___は簡単ではない。";

    const questions = parseChallengePayload(payload, pool);
    expect(questions[2]?.prompt).toContain("（　）");
    expect(questions[2]?.prompt).not.toContain("___");
  });

  it("rejects a payload that is not five questions", () => {
    const payload = validPayload();
    payload.questions.pop();

    expect(() => parseChallengePayload(payload, pool)).toThrow(/5 questions/i);
  });

  it("rejects a reading question whose kana is not among the choices", () => {
    const payload = validPayload();
    payload.questions[0].choices = ["ほうぎ", "ほうきょ", "ぼうき", "ほうきい"];

    expect(() => parseChallengePayload(payload, pool)).toThrow(/reading/i);
  });

  it("rejects a cloze question with no blank", () => {
    const payload = validPayload();
    payload.questions[2].prompt = "仕事と家庭の両立は簡単ではない。";

    expect(() => parseChallengePayload(payload, pool)).toThrow(/blank/i);
  });

  it("rejects a target that is not in the daily pool", () => {
    const payload = validPayload();
    payload.questions[0].targetId = 99;

    expect(() => parseChallengePayload(payload, pool)).toThrow(/target/i);
  });

  it("rejects duplicate target words", () => {
    const payload = validPayload();
    payload.questions[1].targetId = 1;
    payload.questions[1].prompt = "放棄";

    expect(() => parseChallengePayload(payload, pool)).toThrow(/unique/i);
  });
});

describe("buildDailyChallenge", () => {
  const entries = pool.map((item) =>
    entry(item.id, item.kanji, item.kana, item.meaning),
  );

  it("retries once when the model returns invalid JSON, then succeeds", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ questions: [] })
      .mockResolvedValueOnce(validPayload());

    const challenge = await buildDailyChallenge({
      dateKey: "2026-09-02",
      entries,
      generate,
    });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(challenge.date).toBe("2026-09-02");
    expect(challenge.questions).toHaveLength(5);
  });

  it("fails when there are fewer than five vocabulary entries", async () => {
    await expect(
      buildDailyChallenge({
        dateKey: "2026-09-02",
        entries: entries.slice(0, 4),
        generate: async () => validPayload(),
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_CONTENT" });
  });
});
