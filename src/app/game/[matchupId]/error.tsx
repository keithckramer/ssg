"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteShell, { Card } from "@/components/layout/SiteShell";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MatchupError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const isNotFound = error.name === "MatchupNotFound" || error.message === "MATCHUP_NOT_FOUND";

  return (
    <SiteShell>
      <div className="mt-6 max-w-2xl">
        <Card title={isNotFound ? "Matchup not found" : "Something went wrong"}>
          <p className="text-sm opacity-80">
            {isNotFound
              ? "We couldn't find a matchup with that ID. It may have been removed or you followed an outdated link."
              : "An unexpected error occurred while loading the matchup."}
          </p>
          <div className="flex gap-2 mt-4">
            <button className="btn" onClick={() => router.push("/")}>Return to matchups</button>
            <button className="btn-ghost" onClick={reset}>Try again</button>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
