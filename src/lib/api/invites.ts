import { api } from "../api";
import type {
  CreateInvitePayload,
  Invite,
  InvitePage,
  InviteStatus,
  UpdateInvitePayload,
} from "@/types/invite";

export interface ListInvitesParams {
  page?: number;
  pageSize?: number;
  status?: InviteStatus | "all";
  search?: string;
}

export async function createInvite(payload: CreateInvitePayload): Promise<Invite> {
  return api<Invite>("/api/invites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listInvites(params: ListInvitesParams = {}): Promise<InvitePage> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search.trim());
  const query = searchParams.toString();
  const path = query ? `/api/invites?${query}` : "/api/invites";
  return api<InvitePage>(path);
}

export async function getInvite(inviteId: string): Promise<Invite> {
  return api<Invite>(`/api/invites/${inviteId}`);
}

export async function resendInvite(inviteId: string): Promise<Invite> {
  return api<Invite>(`/api/invites/${inviteId}/resend`, {
    method: "POST",
  });
}

export async function updateInvite(inviteId: string, payload: UpdateInvitePayload): Promise<Invite> {
  return api<Invite>(`/api/invites/${inviteId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function acceptInvite(code: string): Promise<Invite> {
  return api<Invite>(`/api/invites/${code}/accept`, {
    method: "POST",
  });
}
