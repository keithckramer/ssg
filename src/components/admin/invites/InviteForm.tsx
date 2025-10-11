"use client";

import { useEffect, useMemo, useState } from "react";

import type { CreateInvitePayload, Invite, InviteChannel } from "@/types/invite";
import { createInvite } from "@/lib/api/invites";

interface InviteFormProps {
  onCreated(invite: Invite): void;
  onShowQr(invite: Invite): void;
}

type Feedback = { type: "success" | "error"; message: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;

const nextWeek = () => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  expires.setMinutes(0, 0, 0);
  return expires.toISOString().slice(0, 16);
};

export function InviteForm({ onCreated, onShowQr }: InviteFormProps) {
  const [channel, setChannel] = useState<InviteChannel>("email");
  const [recipient, setRecipient] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>(() => nextWeek());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [lastInvite, setLastInvite] = useState<Invite | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3600);
    return () => clearTimeout(timer);
  }, [feedback]);

  const recipientLabel = useMemo(() => {
    switch (channel) {
      case "email":
        return "Recipient email";
      case "sms":
        return "Recipient phone";
      default:
        return "Share manually";
    }
  }, [channel]);

  const handleChannelChange = (value: InviteChannel) => {
    setChannel(value);
    setRecipient("");
  };

  const validateRecipient = () => {
    if (channel === "link") return true;
    if (!recipient.trim()) return false;
    if (channel === "email") {
      return EMAIL_RE.test(recipient.trim().toLowerCase());
    }
    return E164_RE.test(recipient.trim());
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validRecipient = validateRecipient();
    if (!validRecipient) {
      setFeedback({ type: "error", message: "Enter a valid recipient." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateInvitePayload = { channel };
      if (channel !== "link") {
        payload.recipient = recipient.trim();
      }
      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }
      const invite = await createInvite(payload);
      setLastInvite(invite);
      onCreated(invite);
      setFeedback({ type: "success", message: "Invite created successfully." });
      if (channel !== "link") {
        setRecipient("");
      }
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to create invite." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="ssg-card space-y-4" aria-labelledby="invite-form-heading">
      <div className="space-y-1">
        <h2 id="invite-form-heading" className="text-lg font-semibold">
          Send invite
        </h2>
        <p className="text-sm text-slate-500">Email, SMS, or link-only invites for quick registration.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset className="space-y-2" aria-label="Invite channel">
          <span className="text-sm font-medium text-slate-600">Delivery method</span>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {(
              [
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "link", label: "Link only" },
              ] as const satisfies readonly { value: InviteChannel; label: string }[]
            ).map(({ value, label }) => {
              const isActive = channel === value;
              return (
                <button
                  key={value}
                  type="button"
                  className="ssg-btn"
                  onClick={() => handleChannelChange(value)}
                  aria-pressed={isActive}
                  style={{
                    background: isActive ? "#111827" : "#ffffff",
                    color: isActive ? "#ffffff" : "#0f172a",
                    borderColor: isActive ? "#0f172a" : "rgba(148, 163, 184, 0.45)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {channel !== "link" ? (
          <label className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-slate-600">{recipientLabel}</span>
            <input
              className="ssg-input"
              placeholder={channel === "email" ? "name@example.com" : "+15551234567"}
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              required={channel !== "link"}
              aria-invalid={feedback?.type === "error" && !validateRecipient()}
            />
            <span className="text-xs text-slate-500">
              {channel === "sms"
                ? "Use E.164 format, e.g. +15551234567"
                : "We\'ll send the registration link immediately."}
            </span>
          </label>
        ) : null}

        <label className="flex flex-col space-y-2" style={{ maxWidth: "260px" }}>
          <span className="text-sm font-medium text-slate-600">Expires</span>
          <input
            type="datetime-local"
            className="ssg-input"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
          <span className="text-xs text-slate-500">Invites automatically deactivate after this time.</span>
        </label>

        <div className="flex justify-end">
          <button type="submit" className="ssg-btn-dark" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Create invite"}
          </button>
        </div>
      </form>

      {feedback ? (
        <div
          className="rounded-xl border p-3 text-sm font-medium"
          style={{
            background: feedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            borderColor: feedback.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.45)",
            color: feedback.type === "success" ? "#047857" : "#b91c1c",
          }}
        >
          {feedback.message}
          {feedback.type === "success" && lastInvite ? (
            <div className="mt-2 space-y-2">
              <button
                type="button"
                className="ssg-btn ssg-btn-sm"
                onClick={() => {
                  if (navigator.clipboard && "writeText" in navigator.clipboard) {
                    void navigator.clipboard.writeText(lastInvite.inviteUrl);
                  } else {
                    window.prompt("Invite link", lastInvite.inviteUrl);
                  }
                }}
              >
                Copy link
              </button>
              <button type="button" className="ssg-btn ssg-btn-sm" onClick={() => onShowQr(lastInvite)}>
                Show QR
              </button>
              <div className="text-xs opacity-70 break-all">{lastInvite.inviteUrl}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
