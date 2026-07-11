"use client";

import { useMemo } from "react";
import {
  deriveConstructProfile,
  formatConstructProfilePreview,
  type ConstructProprietaId,
} from "@domain/combat/construct-profile";

const PREVIEW_SHEET = { kongen: 3, undo: 4, seimitsu: 4 };

type AnteprimaCostruttoProps = {
  blocco: Record<string, unknown>;
  wazaTier: number | null;
  genitore: string | null;
};

export function AnteprimaCostrutto({ blocco, wazaTier, genitore }: AnteprimaCostruttoProps) {
  const tier = wazaTier && wazaTier >= 1 && wazaTier <= 5 ? wazaTier : 2;

  const profile = useMemo(() => {
    const proprieta = (Array.isArray(blocco.proprieta) ? blocco.proprieta : []) as ConstructProprietaId[];
    const meiRaw = blocco.mei as { etichetta?: string; inviolabile?: boolean } | undefined;
    return deriveConstructProfile({
      wazaTier: tier,
      taglia: String(blocco.taglia ?? "Media"),
      consistenza: String(blocco.consistenza ?? ""),
      comportamento: String(blocco.comportamento ?? "COMANDATO"),
      proprieta,
      toro_da_arma: blocco.toro_da_arma !== false,
      resistenza: blocco.resistenza ?? "DERIVATA",
      danno: blocco.danno ?? "DERIVATA",
      gittata_controllo_m:
        typeof blocco.gittata_controllo_m === "number" ? blocco.gittata_controllo_m : undefined,
      armaSorgente: proprieta.includes("TORO")
        ? { dannoBase: 8, taglia: "piccola" }
        : undefined,
      mei: meiRaw ?? (genitore && /genzai/i.test(genitore) ? {} : null),
      creator: {
        sheet: PREVIEW_SHEET,
        styleGenitore: genitore,
      },
    });
  }, [blocco, tier, genitore]);

  const summary = formatConstructProfilePreview(profile, { kongenRank: 3, wazaTier: tier });

  return (
    <div
      className="rounded border border-[var(--accent-violet)]/25 bg-black/20 px-3 py-2 text-xs text-[var(--accent-violet-light)] space-y-1"
      aria-live="polite"
    >
      <p className="text-[10px] uppercase tracking-wider text-gray-500">
        Anteprima costrutto (Kongen 3 · Undō 4 · Seimitsu 4)
      </p>
      <p>{summary}</p>
      <p className="text-gray-500">
        Limite Gosa globale: {profile.limite_globale_costrutti_gosa} costrutti simultanei (2 + Seimitsu).
        {profile.flags.scioglie_se_analista_ko_o_morto
          ? " Personale: si dissolve se l’analista perde i sensi o muore (non per distanza)."
          : null}
        {profile.gittata_controllo_m != null
          ? ` Gittata controllo: ${profile.gittata_controllo_m} m.`
          : null}
      </p>
    </div>
  );
}
