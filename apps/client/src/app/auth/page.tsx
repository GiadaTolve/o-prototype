"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    nomePg: "",
    email: "",
    password: "",
    characterName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checkServer = async () => {
    setChecking(true);
    setServerOk(null);
    setError("");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      setServerOk(res.ok);
      if (!res.ok) setError(`Server risponde con ${res.status}. Avvialo con \`bun run dev\` in apps/server.`);
    } catch {
      clearTimeout(t);
      setServerOk(false);
      setError(
        "Server non raggiungibile. Avvia in un terminale: \`bun run dev:server\` (dalla root) oppure \`cd apps/server && bun run dev\`. " +
          "Poi verifica che \`curl http://localhost:4000/health\` risponda."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 12_000);
        let res: Response;
        try {
          res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nomePg: formData.nomePg,
              password: formData.password,
            }),
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        const contentType = res.headers.get("content-type");
        let data: { token?: string; error?: string };
        if (contentType?.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `Errore ${res.status}. Verifica che il server sia avviato (es. \`bun run dev\` in apps/server).`);
        }
        if (!res.ok) throw new Error(data.error || "Qualcosa è andato storto");
        if (data.token) {
          localStorage.setItem("token", data.token);
          router.push("/dashboard");
        } else {
          throw new Error("Risposta senza token. Riprova.");
        }
      } else {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 12_000);
        let res: Response;
        try {
          res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              characterName: formData.characterName,
            }),
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        const contentType = res.headers.get("content-type");
        let data: { success?: boolean; error?: string };
        if (contentType?.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `Errore ${res.status}. Verifica che il server sia avviato.`);
        }
        if (!res.ok) throw new Error(data.error || "Qualcosa è andato storto");
        if (data.success) {
          alert("Account creato! Ora accedi con Nome PG + Password.");
          setIsLogin(true);
          setFormData((prev) => ({ ...prev, nomePg: formData.characterName, email: "", password: "", characterName: "" }));
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Server non raggiungibile (timeout). Avvia il server con \`bun run dev\` in apps/server e verifica NEXT_PUBLIC_API_URL.");
      } else {
        setError(err instanceof Error ? err.message : "Errore");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold uppercase tracking-widest text-[var(--accent-gold)]">
            {isLogin ? "Accesso" : "Nuova Anima"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isLogin ? (
            <>
              <Input
                name="nomePg"
                type="text"
                label="Nome PG"
                placeholder="Nome personaggio"
                value={formData.nomePg}
                onChange={handleChange}
                required
              />
              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </>
          ) : (
            <>
              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="mail@esempio.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Input
                name="characterName"
                type="text"
                label="Nome PG"
                placeholder="Nome personaggio"
                value={formData.characterName}
                onChange={handleChange}
                required
              />
            </>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900 text-red-200 text-sm rounded">
              ⚠️ {error}
            </div>
          )}

          <Button type="submit" isLoading={loading} className="mt-4">
            {isLogin ? "Entra nel Sistema" : "Registrati"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-[10px] text-gray-600">
            API: <code className="bg-black/30 px-1 rounded">{API_BASE}</code>
            {serverOk === true && <span className="ml-2 text-green-500">● Server ok</span>}
            {serverOk === false && <span className="ml-2 text-red-400">● Server offline</span>}
          </p>
          <button
            type="button"
            onClick={checkServer}
            disabled={checking}
            className="text-xs text-gray-500 hover:text-[var(--accent-gold)] underline disabled:opacity-50"
          >
            {checking ? "Verifica…" : "Verifica server"}
          </button>
          {isLogin && (
            <Link
              href="/auth/forgot-password"
              className="text-xs text-gray-500 hover:text-[var(--accent-gold)] underline"
            >
              Password dimenticata?
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-xs text-gray-500 hover:text-[var(--accent-gold)] underline"
          >
            {isLogin ? "Non hai un account? Creane uno." : "Hai già un account? Accedi."}
          </button>
        </div>
      </div>
    </main>
  );
}
