"use client";

import { buildGroupSlots, fmtDate } from "../../lib/game";
import { Stick } from "../../lib/types";

type GroupGridProps = {
  sticks: Stick[];
  winDigit: number | null;
};

export function GroupGrid({ sticks, winDigit }: GroupGridProps) {
  const slots = buildGroupSlots(sticks);

  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map(({ num, stick }) => (
        <div
          key={num}
          className={`slot ${winDigit !== null && num === winDigit ? "win" : ""}`}
          title={stick ? `Buyer: ${stick.buyer}\nPaid: $${Number(stick.price).toFixed(2)}\nAt: ${fmtDate(stick.createdAt)}` : ""}
        >
          <div className="text-[11px] opacity-60">#{num}</div>
          <div className="text-sm">{stick ? stick.buyer : "—"}</div>
        </div>
      ))}
    </div>
  );
}
