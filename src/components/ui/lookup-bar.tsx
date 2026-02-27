"use client";

import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

export type LookupOption = {
  label: string;
  value: string;
};

export function LookupBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search...",
  options,
  selectedOption,
  onOptionChange,
  actions,
  className,
  actionLabel = "Search",
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  options?: LookupOption[];
  selectedOption?: string;
  onOptionChange?: (value: string) => void;
  actions?: ReactNode;
  className?: string;
  actionLabel?: string;
  disabled?: boolean;
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form className={cn("lookup-bar", className)} onSubmit={handleSubmit}>
      {options && options.length > 0 ? (
        <Select
          className="lookup-select"
          value={selectedOption ?? options[0]?.value}
          onChange={(event) => onOptionChange?.(event.target.value)}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : null}
      <div className="search-field search-field--wide">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="lookup-actions">
        {onClear ? (
          <Button type="button" variant="ghost" onClick={onClear} disabled={disabled}>
            Clear
          </Button>
        ) : null}
        {onSubmit ? (
          <Button type="submit" disabled={disabled || !value.trim()}>
            {actionLabel}
          </Button>
        ) : null}
        {actions}
      </div>
    </form>
  );
}
