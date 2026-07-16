"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { SchedaSkiruPage } from "./SchedaSkiruPage";
import { SchedaWazaPage } from "./SchedaWazaPage";
import { PassiveSlotsPanel } from "./PassiveSlotsPanel";
import { StyleHexagonPanel } from "./StyleHexagonPanel";
import { WazaCatalogPanel } from "./WazaCatalogPanel";
import type { CharacterSummary } from "./types";

type TabId = "skiru" | "indice" | "sokaiju";

function ExpKeysBanner({ char }: { char: CharacterSummary }) {
  return (
    <div className="shrink-0 rounded-lg border border-[var(--border-color)] bg-black/40 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-display text-sm uppercase tracking-wider text-[var(--accent-gold)]">
          Skiru &amp; Waza
        </h2>
        <p className="text-sm text-[var(--accent-violet-light)]/80 mt-0.5 max-w-md">
          EXP spendibile condivisa: investi nodi Skiru o acquista skill/Waza. Il Market usa solo REM.
        </p>
      </div>
      <div className="flex flex-wrap gap-6 text-right">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-display">EXP spendibile</p>
          <p className="font-display text-2xl text-[var(--accent-gold)] tabular-nums">
            {char.experienceSpendable ?? 0}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-display">Keys</p>
          <p className="font-display text-2xl text-[var(--accent-violet-light)] tabular-nums">
            {char.keys ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SkiruWazaPanel({
  char,
  onCharUpdate,
}: {
  char?: CharacterSummary;
  onCharUpdate?: () => void;
}) {
  const [tab, setTab] = useState<TabId>("indice");

  if (!char?.id) {
    return <p className="text-sm text-gray-500 p-4">Personaggio non disponibile.</p>;
  }

  const tabClass = (id: TabId) =>
    `flex-1 sm:flex-none px-4 py-2.5 text-xs uppercase tracking-widest font-display border-b-2 transition-colors ${
      tab === id
        ? "border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/5"
        : "border-transparent text-gray-500 hover:text-[var(--accent-violet-light)]"
    }`;

  return (
    <div className="flex flex-col h-full min-h-0 p-4 md:p-5 gap-4 animate__animated animate__fadeIn">
      <ExpKeysBanner char={char} />

      <div className="shrink-0 flex border-b border-[var(--border-color)] bg-black/30 rounded-t-lg overflow-hidden overflow-x-auto">
        <button type="button" className={tabClass("indice")} onClick={() => setTab("indice")}>
          <FontAwesomeIcon icon={icons.file} className="w-3 h-3 mr-1.5 inline" />
          Indice
        </button>
        <button type="button" className={tabClass("skiru")} onClick={() => setTab("skiru")}>
          <FontAwesomeIcon icon={icons.skiru} className="w-3 h-3 mr-1.5 inline" />
          Skiru
        </button>
        <button type="button" className={tabClass("sokaiju")} onClick={() => setTab("sokaiju")}>
          <FontAwesomeIcon icon={icons.sokaiju} className="w-3 h-3 mr-1.5 inline" />
          Sōkaiju
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-b-lg border border-t-0 border-[var(--border-color)] bg-black/20">
        {tab === "skiru" && (
          <div className="h-full min-h-0 overflow-hidden">
            <SchedaSkiruPage char={char} canEdit onCharUpdate={onCharUpdate} branchScope="standard" />
          </div>
        )}
        {tab === "sokaiju" && (
          <div className="h-full min-h-0 overflow-hidden">
            <SchedaSkiruPage char={char} canEdit onCharUpdate={onCharUpdate} branchScope="sokaiju" />
          </div>
        )}
        {tab === "indice" && (
          <div className="h-full overflow-y-auto">
            <SchedaWazaPage isOwnCharacter embedded activeOnly />
            <div className="px-4 md:px-5 pb-5 space-y-6 border-t border-[var(--border-color)]/50 pt-4">
              <StyleHexagonPanel onCharUpdate={onCharUpdate} />
              <PassiveSlotsPanel onCharUpdate={onCharUpdate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DojoPanel({
  char,
  onCharUpdate,
}: {
  char?: CharacterSummary;
  onCharUpdate?: () => void;
}) {
  if (!char || !char.id) {
    return <p className="text-sm text-gray-500 p-4">Personaggio non disponibile.</p>;
  }

  return (
    <div className="flex flex-col h-full min-h-0 p-4 md:p-5 gap-4 animate__animated animate__fadeIn">
      <ExpKeysBanner char={char} />
      <div className="flex-1 min-h-0 overflow-y-auto px-2 md:px-3 py-3">
        <WazaCatalogPanel
          expSpendable={char.experienceSpendable ?? 0}
          charKeys={char.keys ?? 0}
          skiruSheet={char.skiruSheet}
          charMadoshoId={char.madoshoId}
          onCharUpdate={onCharUpdate}
        />
      </div>
    </div>
  );
}
