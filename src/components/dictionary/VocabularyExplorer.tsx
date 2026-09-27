"use client";

import { SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { filterVocabulary } from "@/lib/search";
import type { VocabularyEntry } from "@/lib/types";
import { filterVerbGroups, type VerbGroup } from "@/lib/verb-forms";
import { SearchBar } from "./SearchBar";
import { VerbForms } from "./VerbForms";
import { VocabCard } from "./VocabCard";

export function VocabularyExplorer({
  entries,
  verbGroups,
}: {
  entries: VocabularyEntry[];
  verbGroups: VerbGroup[];
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => filterVocabulary(entries, query),
    [entries, query],
  );
  const groups = useMemo(
    () => filterVerbGroups(verbGroups, query),
    [verbGroups, query],
  );
  const searching = query.trim().length > 0;

  return (
    <div className="space-y-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        resultCount={results.length + groups.length}
        totalCount={entries.length}
      />

      <VerbForms groups={groups} defaultOpen={searching} />

      {results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((entry) => (
            <li key={entry.id}>
              <VocabCard entry={entry} />
            </li>
          ))}
        </ul>
      ) : groups.length === 0 ? (
        <div role="status" className="px-4 py-16 text-center">
          <SearchX className="mx-auto size-8 text-muted" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-medium text-ink">No matching words</h2>
          <p className="mt-1 text-sm text-muted">
            Try a kanji, reading, or part of the English or French meaning.
          </p>
        </div>
      ) : null}
    </div>
  );
}
