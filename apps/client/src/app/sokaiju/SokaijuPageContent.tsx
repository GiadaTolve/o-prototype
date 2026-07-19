"use client";

import { hasSessionHint } from "@/lib/auth-session";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SkiruWazaPanel } from "@/components/dashboard/SkiruWazaPanel";
import type { CharacterSummary } from "@/components/dashboard/types";
import { api } from "@/lib/api";

export default function SokaijuPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [char, setChar] = useState<CharacterSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = (await api.get("/characters/me")) as CharacterSummary;
    setChar(data);
  }, []);

  useEffect(() => {
    const token = hasSessionHint();
    if (!token) {
      router.push("/auth");
      return;
    }
    reload()
      .catch(() => setChar(null))
      .finally(() => setLoading(false));
  }, [router, reload]);

  if (loading) {
    return (
      <div className="min-h-full bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Caricamento…</p>
      </div>
    );
  }

  if (!char?.id) {
    return (
      <div className="min-h-full bg-[var(--panel-bg)] flex items-center justify-center p-6">
        <p className="text-gray-400 text-sm">Personaggio non disponibile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full h-full bg-[var(--panel-bg)] overflow-hidden">
      <SkiruWazaPanel char={char} onCharUpdate={reload} initialTab={initialTab} />
    </div>
  );
}
