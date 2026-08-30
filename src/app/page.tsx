import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Daily Challenge</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Five words, same set all day. The game lands in the next slice.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface px-4 py-8 text-center">
        <Sparkles className="mx-auto size-8 text-accent" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-ink">Coming next</p>
        <p className="mt-1 text-sm text-muted">
          Fill-in-the-blank and multiple-choice review, seeded by today&apos;s
          date.
        </p>
        <Link
          href="/dictionary"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Browse the dictionary
        </Link>
      </div>
    </section>
  );
}
