import { generationFailedResponse } from "@/lib/gemini";
import { getOrCreateGrammarTextSet } from "@/lib/grammar-text-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    return Response.json(await getOrCreateGrammarTextSet(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return generationFailedResponse(
      error,
      "Could not generate today's grammar passage.",
    );
  }
}
