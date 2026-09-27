"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import type { VerbGroup } from "@/lib/verb-forms";

function VerbGroupCard({
  group,
  defaultOpen,
}: {
  group: VerbGroup;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const showReading = Boolean(group.kana) && group.kana !== group.verb;

  return (
    <article className="rounded-xl border border-line bg-surface px-4 py-4">
      <h3 lang="ja" className="text-2xl font-medium tracking-wide text-ink">
        {group.verb}
      </h3>
      {showReading ? (
        <p lang="ja" className="mt-1 text-sm text-muted">
          {group.kana}
        </p>
      ) : null}
      {open ? null : (
        <p lang="ja" className="mt-2 text-sm leading-relaxed text-ink">
          {group.forms.map((form) => form.form).join("、")}
        </p>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="mt-3 inline-flex items-center gap-1 text-left text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {open ? "Hide meanings" : "See meanings"}
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div id={panelId} className="mt-3 space-y-4 border-t border-line pt-3">
          <p className="text-sm leading-relaxed text-ink">{group.pattern}</p>
          {group.patternFr !== group.pattern ? (
            <p className="text-sm leading-relaxed text-muted">{group.patternFr}</p>
          ) : null}
          <ul className="space-y-4">
            {group.forms.map((form) => (
              <li key={form.form}>
                <p lang="ja" className="text-lg text-ink">
                  {form.form}
                </p>
                {form.kana !== form.form ? (
                  <p lang="ja" className="text-sm text-muted">
                    {form.kana}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-ink">
                  {form.label}
                  {form.labelFr !== form.label ? (
                    <span className="text-muted"> · {form.labelFr}</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-ink">{form.meaning}</p>
                {form.meaningFr !== form.meaning ? (
                  <p className="text-sm text-muted">{form.meaningFr}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <p lang="ja" className="text-sm leading-relaxed text-muted">
            {group.example}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function VerbForms({
  groups,
  defaultOpen,
}: {
  groups: VerbGroup[];
  defaultOpen: boolean;
}) {
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="verb-forms-heading" className="space-y-3">
      <div>
        <h2 id="verb-forms-heading" className="text-sm font-medium text-ink">
          Verb forms
        </h2>
        <p className="mt-1 text-sm text-muted">
          Endings of one verb, built the same way on any verb.
        </p>
      </div>
      <ul className="space-y-3">
        {groups.map((group) => (
          <li key={`${group.id}:${defaultOpen}`}>
            <VerbGroupCard group={group} defaultOpen={defaultOpen} />
          </li>
        ))}
      </ul>
    </section>
  );
}
