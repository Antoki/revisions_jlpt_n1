import { generationFailedResponse } from "@/lib/gemini";
import { getOrCreateSentenceBuildSet } from "@/lib/sentence-build-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    return Response.json(await getOrCreateSentenceBuildSet(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return generationFailedResponse(
      error,
      "Could not generate today's sentence-build questions.",
    );
  }
}
