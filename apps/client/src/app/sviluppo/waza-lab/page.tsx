"use client";

import { hasSessionHint } from "@/lib/auth-session";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { canManageWaza } from "@/lib/waza-authoring-access";
import { WazaLabPanel } from "@/components/sviluppo/waza/WazaLabPanel";

function isBotanOwner(char: Record<string, unknown>): boolean {
  const name = String(char?.name ?? "").trim().toLowerCase();
  const surname = String(char?.surname ?? "").trim().toLowerCase();
  const roleIcon = String(
    ((char?.uiMetadata as { roleIcon?: string } | undefined)?.roleIcon ?? ""),
  )
    .trim()
    .toLowerCase();
  return name === "botan" && surname === "mizuhara" && roleIcon === "admin";
}

export default function WazaLabPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = hasSessionHint();
    if (!token) {
      router.push("/auth");
      return;
    }
    api
      .get("/characters/me")
      .then((char) => {
        const typed = char as Parameters<typeof canManageWaza>[0] & Record<string, unknown>;
        setAllowed(canManageWaza(typed) && isBotanOwner(typed));
      })
      .catch(() => setAllowed(false))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Caricamento…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-gray-400 text-sm">Accesso riservato al Proprietario Botan.</p>
          <Link href="/sviluppo" className="text-xs text-[var(--accent-gold)]">
            ← Torna a Sviluppo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--panel-bg)] p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/sviluppo"
          className="inline-block text-xs text-gray-500 hover:text-[var(--accent-gold)] mb-4"
        >
          ← Sviluppo
        </Link>
        <WazaLabPanel />
      </div>
    </div>
  );
}
