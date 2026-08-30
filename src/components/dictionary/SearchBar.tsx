"use client";

import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
};

export function SearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
}: SearchBarProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="vocab-search" className="sr-only">
        Search vocabulary
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          id="vocab-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Kanji, kana, or meaning"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border border-line bg-surface py-3 pr-3 pl-10 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        {value.trim()
          ? `${resultCount} match${resultCount === 1 ? "" : "es"}`
          : `${totalCount} words`}
      </p>
    </div>
  );
}
