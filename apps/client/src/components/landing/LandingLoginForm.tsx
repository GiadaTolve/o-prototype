"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatFetchError } from "@/lib/format-fetch-error";

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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomePg, password }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Accesso non riuscito");
      if (!data.token) throw new Error("Risposta senza token");
      localStorage.setItem("token", data.token);
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
