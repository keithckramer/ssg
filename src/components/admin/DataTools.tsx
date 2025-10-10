"use client";

import { useRef } from "react";

import { useSportsSticks } from "@/components/providers/SportsSticksProvider";

type DataToolsProps = {
  className?: string;
};

export function DataTools({ className }: DataToolsProps) {
  const { exportJson, importJson, resetAll } = useSportsSticks();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cardClasses = ["ssg-card", "space-y-4"];
  if (className) cardClasses.push(className);

  return (
    <section className={cardClasses.join(" ")}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Data tools</h2>
        <p className="text-sm text-slate-500">Export, import, or reset the current board data.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="ssg-btn-dark ssg-btn-sm" onClick={exportJson}>
          Export JSON
        </button>
        <button
          type="button"
          className="ssg-btn ssg-btn-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <button type="button" className="ssg-btn ssg-btn-sm" onClick={resetAll}>
          Reset Data
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        aria-label="Import Sports Sticks data"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            importJson(file);
          }
          event.target.value = "";
        }}
      />
    </section>
  );
}

export default DataTools;
