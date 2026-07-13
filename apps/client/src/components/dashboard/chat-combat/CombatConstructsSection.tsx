"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const CONSTRUCT_SIZES = ["piccola", "media", "grande", "enorme"] as const;

type FieldConstructRow = {
  id: string;
  label: string;
  wazaTier: number;
  remainingResistance: number;
  maxResistance: number;
  proprieta?: string[];
};

export function CombatConstructsSection({
  characterId,
  isMaster = false,
  masterTargetId,
  onInsertText,
}: {
  characterId?: string;
  isMaster?: boolean;
  /** Se Master: evoca sul bersaglio selezionato. */
  masterTargetId?: string;
  onInsertText?: (text: string) => void;
}) {
  const targetId = isMaster ? masterTargetId : characterId;
  const [constructs, setConstructs] = useState<FieldConstructRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cLabel, setCLabel] = useState("Barriera");
  const [cTier, setCTier] = useState(3);
  const [cSize, setCSize] = useState<(typeof CONSTRUCT_SIZES)[number]>("media");
  const [cBatteria, setCBatteria] = useState(false);
  const [cToro, setCToro] = useState(false);

  const load = useCallback(async () => {
    if (!targetId) {
      setConstructs([]);
      return;
    }
    setLoading(true);
    try {
      const data = (await api.get(`/characters/${targetId}/field-constructs`)) as {
        constructs?: FieldConstructRow[];
      };
      setConstructs(data.constructs ?? []);
    } catch {
      setConstructs([]);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener("characterStatusUpdated", onRefresh);
    return () => window.removeEventListener("characterStatusUpdated", onRefresh);
  }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    if (!targetId) return;
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
      window.dispatchEvent(new CustomEvent("characterStatusUpdated"));
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Operazione fallita");
    } finally {
      setBusy(false);
    }
  };

  if (!targetId) {
    return <p className="text-[9px] text-gray-500 italic">Nessun personaggio selezionato.</p>;
  }

  const proprieta: string[] = [];
  if (cBatteria) proprieta.push("BATTERIA");
  if (cToro) proprieta.push("TORO");

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-[9px] text-gray-500">Caricamento…</p>
      ) : constructs.length === 0 ? (
        <p className="text-[9px] text-gray-600 italic">Nessun costrutto attivo sul campo.</p>
      ) : (
        <ul className="space-y-1 max-h-28 overflow-y-auto">
          {constructs.map((c) => (
            <li key={c.id} className="text-[9px] text-gray-400 flex justify-between gap-1 items-start">
              <span>
                {c.label} T{c.wazaTier} · {c.remainingResistance}/{c.maxResistance}
                {(c.proprieta?.length ?? 0) > 0 && (
                  <span className="text-[var(--accent-gold)]">
                    {" "}
                    · {(c.proprieta ?? []).join(", ")}
                  </span>
                )}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => api.delete(`/characters/field-constructs/${c.id}`), "Rimosso")}
                className="text-red-400/80 hover:text-red-400 shrink-0"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-3 gap-1">
        <input
          value={cLabel}
          onChange={(e) => setCLabel(e.target.value)}
          placeholder="Nome"
          className="rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[10px] col-span-2 text-white"
        />
        <input
          type="number"
          min={1}
          max={5}
          inputMode="numeric"
          value={cTier}
          onChange={(e) => setCTier(Number(e.target.value) || 1)}
          title="Tier waza"
          className="rounded border border-[var(--border-color)] bg-black/40 px-1 py-1.5 text-[10px] text-white"
        />
        <select
          value={cSize}
          onChange={(e) => setCSize(e.target.value as (typeof CONSTRUCT_SIZES)[number])}
          className="rounded border border-[var(--border-color)] bg-black/40 px-1 py-1.5 text-[10px] col-span-3 text-white"
        >
          {CONSTRUCT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 text-[9px] text-[var(--accent-violet-light)] cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={cBatteria}
            onChange={(e) => setCBatteria(e.target.checked)}
            className="accent-[var(--accent-gold)]"
          />
          Tag Batteria
        </label>
        <label className="flex items-center gap-1.5 text-[9px] text-[var(--accent-violet-light)] cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={cToro}
            onChange={(e) => setCToro(e.target.checked)}
            className="accent-[var(--accent-violet)]"
          />
          Sticker Tōrō
        </label>
      </div>

      <button
        type="button"
        disabled={busy || !cLabel.trim()}
        onClick={() =>
          run(
            () =>
              api.post(`/characters/${targetId}/field-constructs`, {
                label: cLabel.trim(),
                wazaTier: cTier,
                size: cSize,
                stationary: true,
                proprieta: proprieta.length > 0 ? proprieta : undefined,
              }),
            "Costrutto evocato",
          )
        }
        className="chat-combat-master-btn chat-combat-master-btn--gold w-full"
      >
        Evoca costrutto
      </button>

      {onInsertText && (
        <button
          type="button"
          disabled={!cLabel.trim()}
          className="chat-combat-master-btn w-full"
          onClick={() => {
            const tags = proprieta.map((p) => `[costrutto:${p.toLowerCase()}]`).join(" ");
            onInsertText(
              `Evoco ${cLabel.trim()} (${cSize}, T${cTier})${tags ? ` ${tags}` : ""} `,
            );
          }}
        >
          Inserisci dichiarazione in chat
        </button>
      )}

      <p className="text-[8px] text-gray-600 leading-relaxed">
        <strong className="text-gray-500 font-normal">Batteria (Hadō):</strong> con Chikuden attiva,
        spunta «Tag Batteria» all&apos;evocazione — il costrutto può trattenere CS (max 5). In narrato
        puoi anche usare <code>[costrutto:batteria]</code>.
      </p>

      {msg && (
        <p className="text-[9px] text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-2 py-1 bg-black/30">
          {msg}
        </p>
      )}
    </div>
  );
}
