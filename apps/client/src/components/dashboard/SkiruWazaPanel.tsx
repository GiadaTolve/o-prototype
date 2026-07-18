"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { SchedaSkiruPage } from "./SchedaSkiruPage";
import { PassiveSlotsPanel } from "./PassiveSlotsPanel";
import { StyleHexagonPanel } from "./StyleHexagonPanel";
import { WazaCatalogPanel } from "./WazaCatalogPanel";
import type { CharacterSummary } from "./types";
import "./fetch/fetch-pager.css";

type TabId = "skiru" | "indice" | "sokaiju";

function parseInitialTab(value: string | null | undefined): TabId {
  if (value === "skiru" || value === "indice" || value === "sokaiju") return value;
  return "indice";
}

function ExpKeysBanner({ char }: { char: CharacterSummary }) {
  const exp = char.experienceSpendable ?? 0;
  const keys = char.keys ?? 0;

  return (
    <div className="skiru-exp-hud shrink-0" aria-label={`EXP ${exp}, Keys ${keys}`}>
      <div className="fetch-pager__top skiru-exp-hud__top">
        <span className="fetch-pager__brand skiru-exp-hud__brand">OYASUMI · SŌKAIJU</span>
        <div className="fetch-pager__status skiru-exp-hud__stats">
          <span>
            EXP <strong className="skiru-exp-hud__exp">{exp}</strong>
          </span>
          <span className="skiru-exp-hud__sep" aria-hidden>
            ·
          </span>
          <span>
            KEYS <strong className="skiru-exp-hud__keys">{keys}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export function SkiruWazaPanel({
  char,
  onCharUpdate,
  initialTab,
}: {
  char?: CharacterSummary;
  onCharUpdate?: () => void;
  initialTab?: string | null;
}) {
  const [tab, setTab] = useState<TabId>(() => parseInitialTab(initialTab));

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
    <div className="flex flex-col h-full min-h-0 p-3 md:p-4 gap-2 animate__animated animate__fadeIn">
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
          <div className="h-full overflow-y-auto px-4 md:px-5 py-4 space-y-6">
            <StyleHexagonPanel onCharUpdate={onCharUpdate} />
            <PassiveSlotsPanel onCharUpdate={onCharUpdate} />
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
    <div className="flex flex-col h-full min-h-0 animate__animated animate__fadeIn">
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
