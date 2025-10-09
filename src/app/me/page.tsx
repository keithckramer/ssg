"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function MePage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/me")
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  return <pre style={{ padding: 16 }}>{err ? err : JSON.stringify(data, null, 2)}</pre>;
}
