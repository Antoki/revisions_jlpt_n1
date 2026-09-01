import {
  ChallengeError,
  type DailyChallenge,
} from "@/lib/challenge";
import { getOrCreateDailyChallenge } from "@/lib/challenge-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const challenge: DailyChallenge = await getOrCreateDailyChallenge();
    return Response.json(challenge, {
      headers: { "Cache-Control": "no-store" },
    });
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

    return Response.json(
      {
        error: {
          code: challengeError.code,
          message: challengeError.message,
        },
      },
      {
        status: challengeError.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
