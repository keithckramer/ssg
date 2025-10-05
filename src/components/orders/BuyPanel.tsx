"use client";

import { useState } from "react";
import { clampInt } from "../../lib/game";

type BuyPanelProps = {
  onBuy: (buyer: string, quantity: number) => void;
};

export function BuyPanel({ onBuy }: BuyPanelProps) {
  const [buyer, setBuyer] = useState("");
  const [qty, setQty] = useState<number>(1);

  return (
    <div className="rounded-xl border p-3 bg-white">
      <div className="font-semibold mb-2">Sell sticks</div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <input
          className="input col-span-2 text-left"
          placeholder="Buyer name (optional)"
          value={buyer}
          onChange={(e) => setBuyer(e.target.value)}
        />
        <input
          className="input input-sm"
          type="number"
          min={1}
          max={10}
          value={qty}
          onChange={(e) => setQty(clampInt(e.target.value, 1, 10))}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button className="btn flex-1" onClick={() => onBuy(buyer, qty)}>Buy</button>
        <button
          className="btn-ghost"
          onClick={() => {
            setBuyer("");
            setQty(1);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
