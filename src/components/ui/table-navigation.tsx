"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type RowOptions = {
  onEnter?: () => void;
  className?: string;
  disabled?: boolean;
};

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("button, a, input, select, textarea, [role='button']"));
};

export function useTableKeyboardNavigation(rowCount: number) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (rowCount <= 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex > rowCount - 1) {
      setActiveIndex(rowCount - 1);
    }
  }, [rowCount, activeIndex]);

  const focusRow = useCallback((index: number) => {
    const row = tableRef.current?.querySelector<HTMLTableRowElement>(`tr[data-row-index="${index}"]`);
    if (row) {
      row.focus();
    }
  }, []);

  const move = useCallback(
    (current: number, delta: number) => {
      if (rowCount <= 0) return;
      let next = current + delta;
      if (next < 0) next = 0;
      if (next > rowCount - 1) next = rowCount - 1;
      setActiveIndex(next);
      focusRow(next);
    },
    [rowCount, focusRow]
  );

  const getRowProps = useCallback(
    (index: number, options?: RowOptions) => {
      const { onEnter, className, disabled } = options ?? {};
      return {
        "data-row-index": index,
        tabIndex: index === activeIndex ? 0 : -1,
        className: cn("table-row", index === activeIndex && "table-row--active", className),
        "aria-selected": index === activeIndex ? true : undefined,
        onFocus: () => setActiveIndex(index),
        onMouseDown: (event: React.MouseEvent<HTMLTableRowElement>) => {
          if (isInteractiveTarget(event.target)) return;
          event.currentTarget.focus();
          setActiveIndex(index);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
          if (event.currentTarget !== event.target) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            move(index, 1);
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            move(index, -1);
            return;
          }
          if ((event.key === "Enter" || event.key === " ") && onEnter && !disabled) {
            event.preventDefault();
            onEnter();
          }
        }
      } as React.HTMLAttributes<HTMLTableRowElement>;
    },
    [activeIndex, move]
  );

  return { tableRef, getRowProps };
}
