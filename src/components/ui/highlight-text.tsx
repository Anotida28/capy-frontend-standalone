"use client";

import { cn } from "@/lib/utils/cn";

type HighlightTextProps = {
  text: string | number | null | undefined;
  query?: string;
  className?: string;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function HighlightText({ text, query, className }: HighlightTextProps) {
  const value = text == null ? "" : String(text);
  const normalizedQuery = query?.trim() ?? "";

  if (!normalizedQuery) {
    return <span className={className}>{value}</span>;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return <span className={className}>{value}</span>;
  }

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const parts = value.split(pattern);
  const tokenSet = new Set(tokens.map((token) => token.toLowerCase()));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        tokenSet.has(part.toLowerCase()) ? (
          <mark key={`${part}-${index}`} className="text-highlight">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </span>
  );
}
