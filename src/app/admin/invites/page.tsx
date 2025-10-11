"use client";

import Link from "next/link";
import { useState } from "react";

import SiteShell from "@/components/layout/SiteShell";
import { InviteForm } from "@/components/admin/invites/InviteForm";
import { InviteTable } from "@/components/admin/invites/InviteTable";
import { InviteQrModal } from "@/components/admin/invites/InviteQrModal";
import { useAuth } from "@/context/AuthContext";
import type { Invite } from "@/types/invite";

export default function AdminInvitesPage() {
  const { user } = useAuth();
  const isAdminUser = user?.role === "admin";
  const [refreshToken, setRefreshToken] = useState(0);
  const [qrInvite, setQrInvite] = useState<Invite | null>(null);

  if (!isAdminUser) {
    return (
      <SiteShell>
        <div className="mt-6 space-y-4">
          <section className="ssg-card space-y-3">
            <h1 className="text-xl font-semibold">403 – Friendly stick block</h1>
            <p className="text-sm text-slate-600">You need an admin account to access this dashboard.</p>
            <Link href="/" className="ssg-btn ssg-btn-sm" aria-label="Return to matchups">
              Return home
            </Link>
          </section>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mt-6 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Invites</h1>
          <p className="text-sm text-slate-600">
            Send invites for new players and monitor how they move from pending to registered.
          </p>
        </header>

        <InviteForm
          onCreated={(invite) => {
            setRefreshToken((token) => token + 1);
            setQrInvite(invite);
          }}
          onShowQr={(invite) => setQrInvite(invite)}
        />

        <InviteTable
          refreshToken={refreshToken}
          onShowQr={(invite) => {
            setQrInvite(invite);
          }}
        />
      </div>
      <InviteQrModal invite={qrInvite} open={qrInvite !== null} onClose={() => setQrInvite(null)} />
    </SiteShell>
  );
}
