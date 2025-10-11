export type InviteChannel = "email" | "sms" | "link";

export type InviteStatus =
  | "pending"
  | "clicked"
  | "accepted"
  | "registered"
  | "revoked"
  | "expired";

export interface Invite {
  id: string;
  code: string;
  channel: InviteChannel;
  recipient: string | null;
  status: InviteStatus;
  inviteUrl: string;
  createdAt: string;
  expiresAt: string | null;
  clickedAt: string | null;
  acceptedAt: string | null;
  registeredAt: string | null;
}

export interface InvitePage {
  invites: Invite[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateInvitePayload {
  channel: InviteChannel;
  recipient?: string;
  expiresAt?: string | null;
}

export interface UpdateInvitePayload {
  status?: InviteStatus;
  expiresAt?: string | null;
}
