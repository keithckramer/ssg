"use client";

import { useState } from "react";

type AddMatchupProps = {
  onAdd: (home: string, away: string, kickoff: string) => void;
};

export function AddMatchup({ onAdd }: AddMatchupProps) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [kickoff, setKickoff] = useState("");

  return (
    <div className="rounded-xl border p-3 bg-white space-y-2">
      <div className="kckStyle2 text-sm font-medium">Add a matchup</div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="kckStyle input text-left"
          placeholder="Home"
          value={home}
          onChange={(e) => setHome(e.target.value)}
        />
        <input
          className="kckStyle input text-left"
          placeholder="Away"
          value={away}
          onChange={(e) => setAway(e.target.value)}
        />
      </div>
      <input
        className="input input-wide text-left"
        type="datetime-local"
        value={kickoff}
        onChange={(e) => setKickoff(e.target.value)}
      />
      <button
        className="btn w-full"
        onClick={() => {
          if (!home || !away) {
            alert("Enter home & away team names");
            return;
          }
          onAdd(home.trim(), away.trim(), kickoff || new Date().toISOString());
          setHome("");
          setAway("");
          setKickoff("");
        }}
      >
        Add
      </button>
    </div>
  );
}
