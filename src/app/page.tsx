import { DailyChallenge } from "@/components/challenge/DailyChallenge";
import type { ChallengeErrorState } from "@/components/challenge/use-daily-challenge";
import { ChallengeError, type DailyChallenge as Challenge } from "@/lib/challenge";
import { getOrCreateDailyChallenge } from "@/lib/challenge-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function HomePage() {
  const result = await loadDailyChallenge();

  if (result.ok) {
    return <DailyChallenge challenge={result.challenge} />;
  }

  return <DailyChallenge error={result.error} />;
}

async function loadDailyChallenge(): Promise<
  | { ok: true; challenge: Challenge }
  | { ok: false; error: ChallengeErrorState }
> {
  try {
    return { ok: true, challenge: await getOrCreateDailyChallenge() };
  } catch (error) {
    const challengeError =
      error instanceof ChallengeError
        ? error
        : new ChallengeError(
            "Could not build today's challenge.",
            "GENERATION_FAILED",
            503,
          );

    if (!(error instanceof ChallengeError)) {
      console.error("Daily challenge failed");
    }

    return {
      ok: false,
      error: {
        code: challengeError.code,
        message: challengeError.message,
      },
    };
  }
}
