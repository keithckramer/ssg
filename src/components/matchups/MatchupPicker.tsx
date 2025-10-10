"use client";

import { Matchup } from "../../lib/types";
import { fmtDate } from "../../lib/game";

import styles from "./MatchupPicker.module.css";

type MatchupPickerProps = {
  matchups: Matchup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove?: (id: string) => void;
};

export function MatchupPicker({ matchups, activeId, onSelect, onRemove }: MatchupPickerProps) {
  return (
    <div className={styles.wrapper}>
      {matchups.length === 0 ? (
        <div className={styles.emptyState}>No matchups yet.</div>
      ) : (
        <ul className={styles.list}>
          {matchups.map((matchup) => {
            const isActive = activeId === matchup.id;

            return (
              <li
                key={matchup.id}
                className={`${styles.item} ${isActive ? styles.itemActive : ""}`.trim()}
              >
                <button
                  type="button"
                  onClick={() => onSelect(matchup.id)}
                  className={styles.itemButton}
                  title={matchup.kickoff}
                >
                  {matchup.home} vs {matchup.away}
                  <span>{fmtDate(matchup.kickoff)}</span>
                </button>
                {onRemove ? (
                  <button type="button" className={styles.removeButton} onClick={() => onRemove(matchup.id)}>
                    Remove
                  </button>
                ) : (
                  <span className={styles.metaNote}>Admin only</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
