"use client";
import { useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function InvitesPage() {
  const [emailOrPhone, setId] = useState("");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");

  async function createInvite(e: any) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || ""
        },
        body: JSON.stringify({ emailOrPhone })
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setToken(json.token);
      setMsg("Invite created. Copy token for the user.");
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <form onSubmit={createInvite} style={{ display: "grid", gap: 8, maxWidth: 420, padding: 16 }}>
      <input placeholder="email or phone" value={emailOrPhone} onChange={e => setId(e.target.value)} />
      <button type="submit">Create Invite</button>
      <div>{msg}</div>
      {token && <pre>Invite Token: {token}</pre>}
    </form>
  );
}
