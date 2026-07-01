"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatFetchError } from "@/lib/format-fetch-error";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Qualcosa è andato storto");
      setSent(true);
    } catch (err: unknown) {
      setError(formatFetchError(err, API_BASE));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl text-center">
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-[var(--accent-gold)] mb-4">
            Link inviato
          </h2>
          <p className="text-gray-400 mb-6">
            Se l’email è associata a un account, riceverai un link per reimpostare la password.
          </p>
          <Link href="/auth" className="text-[var(--accent-gold)] hover:underline text-sm uppercase tracking-wider">
            Torna al login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold uppercase tracking-widest text-[var(--accent-gold)]">
            Recupero password
          </h2>
          <p className="text-gray-500 text-sm mt-2">Inserisci l’email del tuo account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="mail@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900 text-red-200 text-sm rounded">⚠️ {error}</div>
          )}
          <Button type="submit" isLoading={loading} className="mt-4">
            Invia link reset
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth" className="text-xs text-gray-500 hover:text-[var(--accent-gold)] underline">
            Torna al login
          </Link>
        </div>
      </div>
    </main>
  );
}
