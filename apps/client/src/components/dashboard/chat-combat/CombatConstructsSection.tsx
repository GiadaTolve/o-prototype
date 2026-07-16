"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Presente } from "../types";

const CONSTRUCT_SIZES = ["piccola", "media", "grande", "enorme"] as const;

type FieldConstructRow = {
  id: string;
  label: string;
  wazaTier: number;
  remainingResistance: number;
  maxResistance: number;
  proprieta?: string[];
};

/** Mini-riga "cedi controllo" — trasferisce proprietà DB al nuovo proprietario. */
function ConstructCediRow({
  construct,
  usersInRoom,
  myCharacterId,
  onSuccess,
}: {
  construct: FieldConstructRow;
  usersInRoom: Presente[];
  myCharacterId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const targets = usersInRoom.filter((u) => u.id && u.id !== myCharacterId);

  const confirm = async () => {
    if (!targetId) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/characters/field-constructs/${construct.id}/transfer`, { targetCharacterId: targetId });
      onSuccess();
      setOpen(false);
      setTargetId("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[8px] text-[var(--accent-gold)]/70 hover:text-[var(--accent-gold)] transition-colors shrink-0"
        title="Cedi controllo del costrutto"
      >
        cedi →
      </button>
    );
  }

  return (
    <div className="flex gap-1 items-center flex-1">
      {targets.length === 0 ? (
        <span className="text-[8px] text-gray-500 italic flex-1">Nessun altro in stanza</span>
      ) : (
        <select
          autoFocus
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="flex-1 rounded border border-[var(--border-color)] bg-black/40 px-1 py-0.5 text-[9px] text-white"
        >
          <option value="">— a chi —</option>
          {targets.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        disabled={busy || !targetId}
        onClick={() => void confirm()}
        className="text-[8px] text-[var(--accent-gold)] shrink-0 disabled:opacity-40"
      >
        ↵
      </button>
      <button type="button" onClick={() => { setOpen(false); setErr(null); }} className="text-[8px] text-gray-500 shrink-0">✕</button>
      {err && <span className="text-[8px] text-red-400">{err}</span>}
    </div>
  );
}

export function CombatConstructsSection({
  characterId,
  isMaster = false,
  masterTargetId,
  usersInRoom = [],
  onSendMessage,
}: {
  characterId?: string;
  isMaster?: boolean;
  masterTargetId?: string;
  usersInRoom?: Presente[];
  onSendMessage?: (text: string) => void;
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
    } catch (e) {
      console.error("[CombatConstructsSection] load error:", e);
      // Non svuotare la lista su errore temporaneo (es. auth/rete)
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

  // Resistenza derivata preview per il form
  const sizeMultipliers: Record<string, number> = { piccola: 0.5, media: 1, grande: 1.5, enorme: 2 };
  const resistenzaPreview = Math.floor(cTier * (sizeMultipliers[cSize] ?? 1));

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
                  <span className="text-white">{c.label}</span>{" "}
                  T{c.wazaTier} · Res {c.remainingResistance}/{c.maxResistance}
                  {(c.proprieta?.length ?? 0) > 0 && (
                    <span className="text-[var(--accent-gold)]">
                      {" "}· {(c.proprieta ?? []).join(", ")}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {characterId && (
                    <ConstructCediRow
                      construct={c}
                      usersInRoom={usersInRoom}
                      myCharacterId={characterId}
                      onSuccess={() => { void load(); }}
                    />
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
          className="rounded border border-[var(--border-color)] bg-black/40 px-1 py-1.5 text-[10px] col-span-2 text-white"
        >
          {CONSTRUCT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-[9px] text-[var(--accent-violet-light)] flex items-center justify-center">
          Res {resistenzaPreview}
        </span>
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
              }).then(() => {
                if (onSendMessage) {
                  const stickerTag = proprieta.length > 0
                    ? ` [sticker:${proprieta.join("+")}]`
                    : "";
                  onSendMessage(
                    `Evoco ${cLabel.trim()} (${cSize}, T${cTier}) — Res ${resistenzaPreview}` +
                    ` [costrutto:standalone:${cLabel.trim()}] [taglia:${cSize}] [tier:${cTier}] [res:${resistenzaPreview}]${stickerTag}`
                  );
                }
              }),
            "Costrutto evocato",
          )
        }
        className="chat-combat-master-btn chat-combat-master-btn--gold w-full"
      >
        Evoca costrutto
      </button>

      <p className="text-[8px] text-gray-600 leading-relaxed">
        <strong className="text-gray-500 font-normal">Batteria (Hadō):</strong> con Chikuden attiva,
        spunta «Tag Batteria» all&apos;evocazione — il costrutto può trattenere CS (max 5).
      </p>

      {msg && (
        <p className="text-[9px] text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-2 py-1 bg-black/30">
          {msg}
        </p>
      )}
    </div>
  );
}
