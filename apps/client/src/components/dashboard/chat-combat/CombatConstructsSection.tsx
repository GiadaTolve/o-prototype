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

/** Mini-riga "agisce" espandibile per ogni costrutto. */
function ConstructAgisceRow({
  construct,
  onInsertText,
}: {
  construct: FieldConstructRow;
  onInsertText: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");

  const confirm = () => {
    const text = action.trim();
    if (!text) return;
    onInsertText(`Il costrutto ${construct.label} agisce: ${text} [costrutto:agisce]`);
    setAction("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[8px] text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)] transition-colors shrink-0"
      >
        agisce →
      </button>
    );
  }

  return (
    <div className="flex gap-1 items-center flex-1">
      <input
        autoFocus
        value={action}
        onChange={(e) => setAction(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Dichiarazione azione…"
        className="flex-1 rounded border border-[var(--border-color)] bg-black/40 px-1.5 py-0.5 text-[9px] text-white"
      />
      <button type="button" onClick={confirm} className="text-[8px] text-[var(--accent-gold)] shrink-0">↵</button>
      <button type="button" onClick={() => setOpen(false)} className="text-[8px] text-gray-500 shrink-0">✕</button>
    </div>
  );
}

/** Mini-riga "cedi controllo" — per Ubaiito, Inversione di Proprietà, Dominazione Onirica. */
function ConstructCediRow({
  construct,
  onInsertText,
}: {
  construct: FieldConstructRow;
  onInsertText: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");

  const confirm = () => {
    const name = target.trim();
    if (!name) return;
    onInsertText(`Cedo il controllo di ${construct.label} a ${name} [cedi-controllo:${construct.label}→${name}]`);
    setTarget("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[8px] text-[var(--accent-gold)]/70 hover:text-[var(--accent-gold)] transition-colors shrink-0"
        title="Cedi controllo del costrutto (Ubaiito / Inversione / Dominazione)"
      >
        cedi →
      </button>
    );
  }

  return (
    <div className="flex gap-1 items-center flex-1">
      <input
        autoFocus
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Nuovo controllore…"
        className="flex-1 rounded border border-[var(--border-color)] bg-black/40 px-1.5 py-0.5 text-[9px] text-white"
      />
      <button type="button" onClick={confirm} className="text-[8px] text-[var(--accent-gold)] shrink-0">↵</button>
      <button type="button" onClick={() => setOpen(false)} className="text-[8px] text-gray-500 shrink-0">✕</button>
    </div>
  );
}

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
      setTimeout(() => setMsg(null), 3000);
      window.dispatchEvent(new CustomEvent("characterStatusUpdated"));
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Operazione fallita");
      setTimeout(() => setMsg(null), 5000);
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
        <ul className="space-y-1.5 max-h-36 overflow-y-auto">
          {constructs.map((c) => (
            <li key={c.id} className="text-[9px] text-gray-400 flex flex-col gap-0.5">
              <div className="flex justify-between gap-1 items-center">
                <span className="flex-1 min-w-0">
                  <span className="text-white">{c.label}</span> T{c.wazaTier} · {c.remainingResistance}/{c.maxResistance}
                  {(c.proprieta?.length ?? 0) > 0 && (
                    <span className="text-[var(--accent-gold)]">
                      {" "}· {(c.proprieta ?? []).join(", ")}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {onInsertText && (
                    <>
                      <ConstructAgisceRow construct={c} onInsertText={onInsertText} />
                      <ConstructCediRow construct={c} onInsertText={onInsertText} />
                    </>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => api.delete(`/characters/field-constructs/${c.id}`), "Rimosso")}
                    className="text-red-400/80 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              </div>
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
