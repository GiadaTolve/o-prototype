"use client";

import { hasSessionHint } from "@/lib/auth-session";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { canManageWaza, canPublishWaza } from "@/lib/waza-authoring-access";
import { EditorWaza } from "@/components/sviluppo/waza/EditorWaza";

export default function SviluppoWazaEditorPage() {
  const router = useRouter();
  const params = useParams();
  const wazaId = String(params.id ?? "");
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [canPublish, setCanPublish] = useState(false);

  useEffect(() => {
    const token = hasSessionHint();
    if (!token) {
      router.push("/auth");
      return;
    }
    api
      .get("/characters/me")
      .then((char) => {
        const data = char as Parameters<typeof canManageWaza>[0];
        setAllowed(canManageWaza(data));
        setCanPublish(canPublishWaza(data));
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
      <div className="max-w-4xl mx-auto">
        <EditorWaza wazaId={wazaId} canPublish={canPublish} />
      </div>
    </div>
  );
}
