"use client";

import { ReactNode } from "react";
import { GhostButton } from "./ui";

export function RepeatRows<T>({
  rows,
  onChange,
  newRow,
  renderRow,
  addLabel = "행 추가",
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  newRow: () => T;
  renderRow: (row: T, update: (patch: Partial<T>) => void, remove: () => void, index: number) => ReactNode;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-3">
          {renderRow(
            row,
            (patch) => {
              const next = [...rows];
              next[i] = { ...next[i], ...patch };
              onChange(next);
            },
            () => onChange(rows.filter((_, idx) => idx !== i)),
            i
          )}
        </div>
      ))}
      <GhostButton type="button" onClick={() => onChange([...rows, newRow()])}>
        + {addLabel}
      </GhostButton>
    </div>
  );
}
