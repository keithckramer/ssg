"use client";

import Image from "next/image";
import { useEffect } from "react";

import type { Invite } from "@/types/invite";

interface InviteQrModalProps {
  invite: Invite | null;
  open: boolean;
  onClose(): void;
}

export function InviteQrModal({ invite, open, onClose }: InviteQrModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !invite) return null;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(invite.inviteUrl)}`;
  const trackingUrl = `/api/invites/track/${invite.code}`;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="invite-qr-heading" onClick={onClose}>
      <div className="modal-panel space-y-4" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close QR code" onClick={onClose}>
          ×
        </button>
        <div className="space-y-1">
          <h2 id="invite-qr-heading" className="text-lg font-semibold">
            Invite QR code
          </h2>
          <p className="text-sm text-slate-500">Scan to open the invite link instantly.</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-3xl border bg-white p-4" style={{ borderColor: "rgba(148, 163, 184, 0.45)" }}>
            <Image src={qrSrc} alt="Invite QR code" width={224} height={224} className="h-56 w-56" unoptimized />
          </div>
          <div className="text-xs text-slate-500 break-all text-center">{invite.inviteUrl}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ssg-btn"
            aria-label="Open invite tracking link"
          >
            Open tracking link
          </a>
          <button
            type="button"
            className="ssg-btn-dark"
            onClick={() => {
              window.open(invite.inviteUrl, "_blank", "noopener,noreferrer");
            }}
          >
            Open invite link
          </button>
        </div>
      </div>
    </div>
  );
}
