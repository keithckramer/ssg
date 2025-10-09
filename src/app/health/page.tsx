"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function HealthPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    api("/health").then(setData).catch(e => setErr(String(e)));
  }, []);

  return (
    <pre style={{ padding: 16 }}>{err ? err : JSON.stringify(data, null, 2)}</pre>
  );
}
