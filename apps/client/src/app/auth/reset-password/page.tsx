"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatFetchError } from "@/lib/format-fetch-error";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Token mancante. Richiedi un nuovo link di reset.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Qualcosa è andato storto");
      setDone(true);
      setTimeout(() => router.push("/auth"), 3000);
    } catch (err: unknown) {
      setError(formatFetchError(err, API_BASE));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl text-center">
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-[var(--accent-gold)] mb-4">
            Password aggiornata
          </h2>
          <p className="text-gray-400 mb-6">
            Puoi ora effettuare il login con la nuova password. Reindirizzamento...
          </p>
          <Link href="/auth" className="text-[var(--accent-gold)] hover:underline text-sm uppercase tracking-wider">
            Vai al login
          </Link>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl text-center">
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-[var(--accent-gold)] mb-4">
            Link non valido
          </h2>
          <p className="text-gray-400 mb-6">
            Il token è mancante o non valido. Richiedi un nuovo link dalla pagina di recupero.
          </p>
          <Link href="/auth/forgot-password" className="text-[var(--accent-gold)] hover:underline text-sm uppercase tracking-wider">
            Recupera password
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
            Nuova password
          </h2>
          <p className="text-gray-500 text-sm mt-2">Inserisci la nuova password (min 8 caratteri).</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="newPassword"
            type="password"
            label="Nuova password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            name="confirmPassword"
            type="password"
            label="Conferma password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900 text-red-200 text-sm rounded">⚠️ {error}</div>
          )}
          <Button type="submit" isLoading={loading} className="mt-4" disabled={!token}>
            Imposta password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--border-color)] p-8 rounded-lg animate-pulse" />
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
