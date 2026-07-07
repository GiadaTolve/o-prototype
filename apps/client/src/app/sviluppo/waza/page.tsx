"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { canAccessWazaAuthoring } from "@/lib/waza-authoring-access";
import { CatalogoWaza } from "@/components/sviluppo/waza/CatalogoWaza";

export default function SviluppoWazaCatalogoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }
    api
      .get("/characters/me")
      .then((char) => {
        setAllowed(canAccessWazaAuthoring(char as Parameters<typeof canAccessWazaAuthoring>[0]));
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
          <p className="text-gray-400 text-sm">
            Accesso riservato ad Admin, Gestione o Master per il catalogo authoring.
          </p>
          <Link href="/sviluppo" className="text-xs text-[var(--accent-gold)]">
            ← Torna a Sviluppo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--panel-bg)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <CatalogoWaza />
      </div>
    </div>
  );
}
