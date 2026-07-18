"use client";

import { useState } from "react";
import { ItemCatalogManagement } from "@/components/gestione/ItemCatalogManagement";
import { LootTablesManagement } from "@/components/gestione/LootTablesManagement";
import { BlueprintCatalogManagement } from "@/components/gestione/BlueprintCatalogManagement";

type MarketTab = "catalogo" | "liste-loot" | "blueprint";

/**
 * Sviluppo → Market — catalogo oggetti, tabelle loot, blueprint (fonte unica DB).
 */
export function MarketSviluppoPanel() {
  const [tab, setTab] = useState<MarketTab>("catalogo");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display text-[var(--accent-gold)]">Market — Economia oggetti</h2>
        <p className="text-xs text-[var(--accent-violet-light)] mt-1 max-w-3xl">
          Unica fonte per chat, zaino, mercato, craft e Cedi Drop. Nome, descrizione, effetto e parametri
          modificati qui si riflettono ovunque in gioco.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border-color)] pb-1">
        {(
          [
            { id: "catalogo" as const, label: "Catalogo Oggetti" },
            { id: "liste-loot" as const, label: "Liste Loot" },
            { id: "blueprint" as const, label: "Blueprint" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-[44px] px-3 py-2 text-[10px] uppercase tracking-wider font-display border-b-2 transition-colors ${
              tab === t.id
                ? "text-[var(--accent-gold)] border-[var(--accent-gold)]"
                : "text-gray-500 border-transparent hover:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "catalogo" && <ItemCatalogManagement />}
      {tab === "liste-loot" && <LootTablesManagement />}
      {tab === "blueprint" && <BlueprintCatalogManagement />}
    </div>
  );
}
