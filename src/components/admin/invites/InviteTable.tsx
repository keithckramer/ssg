"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Invite, InviteStatus } from "@/types/invite";
import { listInvites, resendInvite, updateInvite } from "@/lib/api/invites";

interface InviteTableProps {
  onShowQr(invite: Invite): void;
  refreshToken: number;
}

interface InviteRowAction {
  label: string;
  onAction: (invite: Invite) => Promise<void> | void;
  isDisabled?: (invite: Invite) => boolean;
}

const STATUS_LABEL: Record<InviteStatus, string> = {
  pending: "Pending",
  clicked: "Clicked",
  accepted: "Accepted",
  registered: "Registered",
  revoked: "Revoked",
  expired: "Expired",
};

const STATUS_STYLES: Record<InviteStatus, { background: string; borderColor: string; color: string }> = {
  pending: {
    background: "rgba(148, 163, 184, 0.12)",
    borderColor: "rgba(148, 163, 184, 0.45)",
    color: "#475569",
  },
  clicked: {
    background: "rgba(59, 130, 246, 0.12)",
    borderColor: "rgba(59, 130, 246, 0.35)",
    color: "#1d4ed8",
  },
  accepted: {
    background: "rgba(168, 85, 247, 0.12)",
    borderColor: "rgba(168, 85, 247, 0.35)",
    color: "#6b21a8",
  },
  registered: {
    background: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.35)",
    color: "#15803d",
  },
  revoked: {
    background: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    color: "#b91c1c",
  },
  expired: {
    background: "rgba(113, 113, 122, 0.12)",
    borderColor: "rgba(113, 113, 122, 0.3)",
    color: "#44403c",
  },
};

const PAGE_SIZE = 10;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRecipient(invite: Invite) {
  if (invite.channel === "link" || !invite.recipient) return "Link only";
  return invite.recipient;
}

export function InviteTable({ onShowQr, refreshToken }: InviteTableProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InviteStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ invites: Invite[]; total: number }>({ invites: [], total: 0 });

  const totalPages = useMemo(() => {
    if (data.total === 0) return 1;
    return Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  }, [data.total]);

  const fetchInvites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listInvites({
        page,
        pageSize: PAGE_SIZE,
        status: status === "all" ? undefined : status,
        search: query || undefined,
      });
      setData({ invites: result.invites, total: result.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invites.");
    } finally {
      setIsLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites, refreshToken]);

  useEffect(() => {
    setPage(1);
  }, [status, query, refreshToken]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(search.trim());
  };

  const actions: InviteRowAction[] = useMemo(
    () => [
      {
        label: "Copy link",
        onAction: (invite) => {
          if (navigator.clipboard && "writeText" in navigator.clipboard) {
            void navigator.clipboard.writeText(invite.inviteUrl);
          } else {
            window.prompt("Invite link", invite.inviteUrl);
          }
        },
      },
      {
        label: "Show QR",
        onAction: (invite) => onShowQr(invite),
      },
      {
        label: "Resend",
        onAction: async (invite) => {
          await resendInvite(invite.id);
          await fetchInvites();
        },
        isDisabled: (invite) => invite.status === "revoked" || invite.status === "expired",
      },
      {
        label: "Revoke",
        onAction: async (invite) => {
          if (invite.status === "revoked") return;
          await updateInvite(invite.id, { status: "revoked" });
          await fetchInvites();
        },
        isDisabled: (invite) => invite.status === "revoked",
      },
    ], [fetchInvites, onShowQr],
  );

  return (
    <section className="ssg-card space-y-4" aria-labelledby="invite-table-heading">
      <div className="space-y-1">
        <h2 id="invite-table-heading" className="text-lg font-semibold">
          Manage invites
        </h2>
        <p className="text-sm text-slate-500">Track invite status in real time and take quick actions.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" onSubmit={handleSearch}>
        <label className="flex flex-col space-y-2" style={{ minWidth: "200px", maxWidth: "260px" }}>
          <span className="text-sm font-medium text-slate-600">Status</span>
          <select
            className="ssg-input"
            value={status}
            onChange={(event) => setStatus(event.target.value as InviteStatus | "all")}
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col space-y-2" style={{ flex: "1 1 220px", maxWidth: "320px" }}>
          <span className="text-sm font-medium text-slate-600">Search</span>
          <input
            className="ssg-input"
            placeholder="Email, phone, or code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button type="submit" className="ssg-btn" style={{ alignSelf: "flex-end" }}>
          Search
        </button>
        <button
          type="button"
          className="ssg-btn"
          style={{ alignSelf: "flex-end" }}
          onClick={() => {
            setSearch("");
            setQuery("");
          }}
        >
          Reset
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3">Recipient</th>
              <th className="py-2 pr-3">Channel</th>
              <th className="py-2 pr-3">Code</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3">Expires</th>
              <th className="py-2 pr-3">Clicked</th>
              <th className="py-2 pr-3">Accepted</th>
              <th className="py-2 pr-3">Registered</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-500">
                  Loading invites…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : data.invites.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-500">
                  No invites found.
                </td>
              </tr>
            ) : (
              data.invites.map((invite) => {
                const style = STATUS_STYLES[invite.status];
                return (
                  <tr key={invite.id} className="align-top">
                    <td className="py-3 pr-3 font-medium text-slate-700">{formatRecipient(invite)}</td>
                    <td className="py-3 pr-3 capitalize">{invite.channel}</td>
                    <td className="py-3 pr-3 font-mono text-xs">{invite.code}</td>
                    <td className="py-3 pr-3">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold"
                        style={style}
                      >
                        {STATUS_LABEL[invite.status]}
                      </span>
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(invite.createdAt)}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(invite.expiresAt)}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(invite.clickedAt)}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(invite.acceptedAt)}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDate(invite.registeredAt)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            className="ssg-btn ssg-btn-sm"
                            onClick={() => {
                              if (action.isDisabled?.(invite)) return;
                              void action.onAction(invite);
                            }}
                            disabled={action.isDisabled?.(invite)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t pt-4 text-sm text-slate-600">
        <div>
          {data.total === 0 ? (
            <span>Showing 0 invites</span>
          ) : (
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, data.total)} of {data.total} invites
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ssg-btn"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="ssg-btn"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
