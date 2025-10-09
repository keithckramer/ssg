"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [emailOrPhone, setId] = useState("");
  const [password, setPw] = useState("");
  const [token, setToken] = useState(""); // invite token (optional UI)
  const [msg, setMsg] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    try {
      const res = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ emailOrPhone, password, token }),
      });
      localStorage.setItem("jwt", res.token);
      setMsg("Registered. Token saved.");
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 360, padding: 16 }}>
      <input placeholder="email or phone" value={emailOrPhone} onChange={e => setId(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e => setPw(e.target.value)} />
      <input placeholder="invite token (optional)" value={token} onChange={e => setToken(e.target.value)} />
      <button type="submit">Register</button>
      <div>{msg}</div>
    </form>
  );
}
