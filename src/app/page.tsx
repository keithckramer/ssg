<<<<<<< HEAD
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SiteShell, { Card } from "@/components/layout/SiteShell";
import {
  Matchup,
  fmtDate,
  useAdminGuard,
  useSportsSticks,
} from "@/components/providers/SportsSticksProvider";

export default function MatchupListPage() {
  const router = useRouter();
  const { matchups, addMatchup, removeMatchup, lastMatchupId, setLastMatchupId, isAdmin } = useSportsSticks();
  const { ensureAdmin } = useAdminGuard();

  const handleSelect = (id: string) => {
    setLastMatchupId(id);
    router.push(`/game/${id}`);
  };

  const handleRemove = (id: string) => {
    if (!ensureAdmin()) return;
    removeMatchup(id);
  };

  const handleAdd = (home: string, away: string, kickoff: string) => {
    if (!ensureAdmin()) return;
    const id = addMatchup(home, away, kickoff);
    setLastMatchupId(id);
    router.push(`/game/${id}`);
  };

  return (
    <SiteShell>
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <Card title="Matchups">
          <MatchupPicker
            matchups={matchups}
            activeId={lastMatchupId}
            onSelect={handleSelect}
            onRemove={isAdmin ? handleRemove : undefined}
          />
          {isAdmin ? (
            <AddMatchup onAdd={handleAdd} />
          ) : (
            <div className="rounded-xl border p-3 bg-white text-sm opacity-70">Admin required to add a matchup.</div>
          )}
        </Card>
      </div>
    </SiteShell>
  );
}

function MatchupPicker({
  matchups,
  activeId,
  onSelect,
  onRemove,
}: {
  matchups: Matchup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border p-2 bg-white mb-3 max-h-[240px] overflow-auto">
      {matchups.length === 0 ? (
        <div className="text-sm opacity-70 p-2">No matchups yet.</div>
      ) : (
        <ul className="space-y-1">
          {matchups.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50">
              <button
                onClick={() => onSelect(m.id)}
                className={`kckStyle text-sm text-left flex-1 ${activeId === m.id ? "font-semibold" : ""}`}
                title={m.kickoff}
              >
                {m.home} vs {m.away}
                <span className="block text-[11px] opacity-60">{fmtDate(m.kickoff)}</span>
              </button>
              {onRemove ? (
                <button className="kckStyle pill pill-ghost" onClick={() => onRemove(m.id)}>Remove</button>
              ) : (
                <span className="text-[11px] opacity-50">Admin only</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddMatchup({ onAdd }: { onAdd: (home: string, away: string, kickoff: string) => void }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [kickoff, setKickoff] = useState("");

  return (
    <div className="rounded-xl border p-3 bg-white space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="input kckStyle2 text-left"
          placeholder="Home team"
          value={home}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHome(e.target.value)}
        />
        <input
          className="input kckStyle2 text-left"
          placeholder="Away team"
          value={away}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAway(e.target.value)}
        />
      </div>
      <input
        className="input input-wide text-left"
        type="datetime-local"
        value={kickoff}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKickoff(e.target.value)}
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
=======
import AppShell from "./AppShell";

export default function Page() {
  return <AppShell/>;
>>>>>>> main
}

// export default function Home() {
//   return (
//     <div className={styles.page}>
//       <main className={styles.main}>
//         <Image
//           className={styles.logo}
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol>
//           <li>
//             Get started by editing <code>src/app/page.tsx</code>.
//           </li>
//           <li>Save and see your changes instantly.</li>
//         </ol>

//         <div className={styles.ctas}>
//           <a
//             className={styles.primary}
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className={styles.logo}
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//             className={styles.secondary}
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className={styles.footer}>
//         <a
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }
