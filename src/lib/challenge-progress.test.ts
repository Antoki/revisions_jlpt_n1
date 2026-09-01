import { describe, expect, it } from "vitest";
import { parseChallengeSession } from "./challenge-progress";

describe("parseChallengeSession", () => {
  it("restores answers for a stored daily challenge", () => {
    const session = parseChallengeSession({
      challenge: {
        date: "2026-09-02",
        questions: [
          {
            id: "0",
            type: "reading",
            prompt: "放棄",
            choices: ["ほうき", "ほうぎ", "ほうきょ", "ぼうき"],
            answerIndex: 0,
            source: {
              kind: "vocabulary",
              id: 1,
              kanji: "放棄",
              kana: "ほうき",
              meaning: "abandonment",
              meaningFr: "abandon",
            },
          },
        ],
      },
      selected: [0],
      checked: [true],
    });

    expect(session?.challenge.date).toBe("2026-09-02");
    expect(session?.selected).toEqual([0]);
    expect(session?.checked).toEqual([true]);
  });

  it("returns null for malformed storage", () => {
    expect(parseChallengeSession(null)).toBeNull();
    expect(parseChallengeSession({ challenge: { date: "2026-09-02" } })).toBeNull();
  });
});
