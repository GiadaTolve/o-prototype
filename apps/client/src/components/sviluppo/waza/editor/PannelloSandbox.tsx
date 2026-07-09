"use client";

import { useCallback, useMemo, useState } from "react";
import { getSkiruDef } from "@domain/skiru/catalog";
import type { WazaSandboxLogLine, WazaSandboxResult } from "@domain/combat/waza-sandbox";
import { wazaApi } from "./waza-api";

const SANDBOX_SKIRU_KEYS = [
  "kensei",
  "seimitsu",
  "bakuryoku",
  "itami",
  "undo",
  "dokusei",
  "konjou",
] as const;

type SandboxSkiruState = Record<string, number>;

type PannelloSandboxProps = {
  effetti: Record<string, unknown>[];
  tier: number | null;
  skiruIr: string[];
  collapsed?: boolean;
  onToggle?: () => void;
};

function skiruLabel(id: string): string {
  const def = getSkiruDef(id);
  return def?.nameRomaji ? `${def.name} (${def.nameRomaji})` : (def?.name ?? id);
}

function defaultSkiruState(): SandboxSkiruState {
  const base: SandboxSkiruState = {};
  for (const id of SANDBOX_SKIRU_KEYS) base[id] = 0;
  return base;
}

function lineClass(kind: WazaSandboxLogLine["kind"]): string {
  switch (kind) {
    case "master":
      return "text-[var(--accent-gold)]";
    case "warn":
      return "text-amber-400/90";
    case "info":
      return "text-gray-400";
    default:
      return "text-[var(--accent-violet-light)]/90";
  }
}

export function PannelloSandbox({
  effetti,
  tier,
  skiruIr,
  collapsed = true,
  onToggle,
}: PannelloSandboxProps) {
  const [lanciatoreSkiru, setLanciatoreSkiru] = useState<SandboxSkiruState>(defaultSkiruState);
  const [bersaglioHp, setBersaglioHp] = useState(35);
  const [bersaglioScudo, setBersaglioScudo] = useState(0);
  const [bersaglioItami, setBersaglioItami] = useState(2);
  const [toroBatteria, setToroBatteria] = useState(false);
  const [grado, setGrado] = useState("Bunsekikan");
  const [irFisica, setIrFisica] = useState("");
  const [irIncanalamento, setIrIncanalamento] = useState("");
  const [vinceIr, setVinceIr] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WazaSandboxResult | null>(null);

  const irOptions = useMemo(() => {
    const ids = skiruIr.length > 0 ? skiruIr : ["kensei", "seimitsu"];
    return ids.map((id) => ({ id, label: skiruLabel(id) }));
  }, [skiruIr]);

  const runSandbox = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const skiruMap: Record<string, number> = {};
      for (const [key, val] of Object.entries(lanciatoreSkiru)) {
        if (val > 0) skiruMap[key] = val;
      }
      const fisica = irFisica || irOptions[0]?.id || "kensei";
      const incanalamento = irIncanalamento || irOptions[1]?.id || irOptions[0]?.id || "seimitsu";

      const res = await wazaApi.post<WazaSandboxResult>("/admin/waza/sandbox", {
        effetti,
        tier,
        skiruIr,
        contesto: {
          lanciatore: {
            skiru: skiruMap,
            grado,
            stato: toroBatteria ? { "toro.batteria": true } : {},
            skiruIrFisica: fisica,
            skiruIrIncanalamento: incanalamento,
          },
          bersaglio: {
            hp: bersaglioHp,
            scudo: bersaglioScudo,
            itami: bersaglioItami,
          },
          opzioni: { vinciConfrontoIndice: vinceIr },
        },
      });
      setResult(res);
      if (onToggle && collapsed) onToggle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sandbox");
      setResult(null);
    } finally {
      setRunning(false);
    }
  }, [
    bersaglioHp,
    bersaglioItami,
    bersaglioScudo,
    collapsed,
    effetti,
    grado,
    irFisica,
    irIncanalamento,
    irOptions,
    lanciatoreSkiru,
    onToggle,
    skiruIr,
    tier,
    toroBatteria,
    vinceIr,
  ]);

  const patchSkiru = (id: string, value: number) => {
    setLanciatoreSkiru((prev) => ({ ...prev, [id]: Math.max(0, Math.min(10, value)) }));
  };

  const inputNumClass =
    "w-full min-h-[44px] rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-sm tabular-nums text-[var(--foreground)]";

  return (
    <section className="rounded border border-[var(--accent-gold)]/30 bg-black/25 overflow-hidden animate__animated animate__fadeIn motion-reduce:animate-none">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left min-h-[44px] hover:bg-[var(--accent-gold)]/5 transition-colors"
      >
        <span className="text-sm font-display text-[var(--accent-gold)]">Banco di prova</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">
          {collapsed ? "apri" : "chiudi"}
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-color)]/50 pt-3">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Personaggio di prova e bersaglio finto. I calcoli usano le stesse funzioni del motore
            (IR, tier, mitigazione Itami).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]">
                Lanciatore — Skiru
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {SANDBOX_SKIRU_KEYS.map((id) => (
                  <label key={id} className="space-y-0.5">
                    <span className="text-[9px] text-gray-500 block truncate">{skiruLabel(id)}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={10}
                      value={lanciatoreSkiru[id] ?? 0}
                      onChange={(e) => patchSkiru(id, Number(e.target.value) || 0)}
                      className={inputNumClass}
                    />
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 min-h-[44px] text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={toroBatteria}
                  onChange={(e) => setToroBatteria(e.target.checked)}
                  className="rounded border-[var(--border-color)]"
                />
                Tōrō — Batteria attiva
              </label>
              <label className="block space-y-0.5">
                <span className="text-[9px] text-gray-500">Grado PG</span>
                <select
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                  className={inputNumClass}
                >
                  {[
                    "Nemuribito",
                    "Hakyō",
                    "Bunsekikan",
                    "Sentatsu Bunsekikan",
                    "Kanteikan",
                    "Shin'enkan",
                    "Akumu Zankyō",
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]">
                Bersaglio
              </h4>
              <label className="block space-y-0.5">
                <span className="text-[9px] text-gray-500">HP</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={bersaglioHp}
                  onChange={(e) => setBersaglioHp(Math.max(0, Number(e.target.value) || 0))}
                  className={inputNumClass}
                />
              </label>
              <label className="block space-y-0.5">
                <span className="text-[9px] text-gray-500">Scudo (Resistenza)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={bersaglioScudo}
                  onChange={(e) => setBersaglioScudo(Math.max(0, Number(e.target.value) || 0))}
                  className={inputNumClass}
                />
              </label>
              <label className="block space-y-0.5">
                <span className="text-[9px] text-gray-500">Itami (punti mitigazione)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10}
                  value={bersaglioItami}
                  onChange={(e) => setBersaglioItami(Math.max(0, Number(e.target.value) || 0))}
                  className={inputNumClass}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="space-y-0.5">
              <span className="text-[9px] text-gray-500">Skiru IR fisica</span>
              <select
                value={irFisica || irOptions[0]?.id || ""}
                onChange={(e) => setIrFisica(e.target.value)}
                className={inputNumClass}
              >
                {irOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-0.5">
              <span className="text-[9px] text-gray-500">Skiru IR incanalamento</span>
              <select
                value={irIncanalamento || irOptions[1]?.id || irOptions[0]?.id || ""}
                onChange={(e) => setIrIncanalamento(e.target.value)}
                className={inputNumClass}
              >
                {irOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-400 min-h-[44px]">
            <input
              type="checkbox"
              checked={vinceIr}
              onChange={(e) => setVinceIr(e.target.checked)}
              className="rounded border-[var(--border-color)]"
            />
            Vince il confronto IR (applica danno)
          </label>

          <button
            type="button"
            disabled={running || effetti.length === 0}
            onClick={() => void runSandbox()}
            className="w-full min-h-[44px] rounded border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] text-sm font-display uppercase tracking-wider disabled:opacity-50 hover:bg-[var(--accent-gold)]/10 transition-colors"
          >
            {running ? "Calcolo…" : "Esegui prova"}
          </button>

          {error && (
            <p className="text-xs text-red-400 border border-red-400/30 rounded px-3 py-2">{error}</p>
          )}

          {result && (
            <div className="rounded border border-[var(--border-color)] bg-black/40 p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Log calcolo</p>
              <ol className="space-y-1 font-mono text-xs leading-relaxed">
                {result.righe.map((riga) => (
                  <li key={riga.step} className={lineClass(riga.kind)}>
                    <span className="text-[var(--accent-gold)]/60 mr-1">[{riga.step}]</span>
                    {riga.text}
                  </li>
                ))}
              </ol>
              {result.dannoFinaleHp != null && (
                <p className="text-xs text-[var(--accent-gold)] pt-1 border-t border-[var(--border-color)]/40">
                  Esito: {result.dannoFinaleHp} danno HP
                  {result.hpBersaglioDopo != null ? ` · bersaglio a ${result.hpBersaglioDopo} HP` : ""}
                  {result.gittataM != null ? ` · gittata ${result.gittataM} m` : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
