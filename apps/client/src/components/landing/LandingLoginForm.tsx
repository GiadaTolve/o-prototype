"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatFetchError } from "@/lib/format-fetch-error";
import { getDevicePayload } from "@/lib/device-fingerprint";
import { markSession } from "@/lib/auth-session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function LandingLoginForm() {
  const router = useRouter();
  const [nomePg, setNomePg] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const device = getDevicePayload();
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nomePg, password, ...device }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Accesso non riuscito");
      markSession();
      router.push("/dashboard");
    } catch (err) {
      setError(formatFetchError(err, API_BASE));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="landing-login-form" onSubmit={handleSubmit}>
      <h2>Accesso</h2>
      {error && <p className="landing-error">{error}</p>}
      <div className="landing-field">
        <input
          type="text"
          className="landing-input"
          placeholder="Nome PG (es. Botan Miyazaki)"
          value={nomePg}
          onChange={(e) => setNomePg(e.target.value)}
          required
          autoComplete="username"
        />
      </div>
      <div className="landing-field">
        <input
          type="password"
          className="landing-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="landing-submit" disabled={loading}>
        {loading ? "Accesso…" : "Entra nel sistema"}
      </button>
      <Link href="/auth/forgot-password" className="landing-forgot">
        Password dimenticata?
      </Link>
    </form>
  );
}
