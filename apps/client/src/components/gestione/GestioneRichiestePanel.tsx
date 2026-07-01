"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type PlayerRequestKind } from "@domain/progression/player-requests";
import { api } from "@/lib/api";
import { icons } from "@/lib/icons";

type StaffRequest = {
  id: string;
  kind: PlayerRequestKind;
  requestedValue: string;
  requestedLabel: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  staffNote: string | null;
  updatedAt: string;
  character: {
    id: string;
    name: string;
    surname: string | null;
    madoshoId: string | null;
    order: string | null;
  } | null;
};

export function GestioneRichiestePanel({
  onQueueChange,
}: {
  onQueueChange?: () => void;
}) {
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [rows, setRows] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "PENDING" ? "/player-requests/admin?status=PENDING" : "/player-requests/admin";
      const data = await api.get(url);
      setRows(Array.isArray(data) ? (data as StaffRequest[]) : []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, decision: "approve" | "reject") => {
    setActingId(id);
    try {
      await api.post(`/player-requests/admin/${id}/${decision}`, {
        staffNote: notes[id]?.trim() || undefined,
      });
      await load();
      onQueueChange?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-display text-white flex items-center gap-2">
          <FontAwesomeIcon icon={icons.fire} className="w-4 h-4 text-[var(--accent-gold)]" />
          Richieste giocatori
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1.5 rounded border text-xs uppercase tracking-wider font-display ${
              filter === "PENDING"
                ? "border-[var(--accent-gold)] text-[var(--accent-gold)]"
                : "border-[var(--border-color)] text-gray-500"
            }`}
          >
            In attesa
          </button>
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded border text-xs uppercase tracking-wider font-display ${
              filter === "ALL"
                ? "border-[var(--accent-gold)] text-[var(--accent-gold)]"
                : "border-[var(--border-color)] text-gray-500"
            }`}
          >
            Tutte
          </button>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
          >
            <FontAwesomeIcon icon={icons.refresh} className="w-3 h-3 mr-1" />
            Aggiorna
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Caricamento…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm italic">Nessuna richiesta{filter === "PENDING" ? " in attesa" : ""}.</p>
      ) : (
        <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/40">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">PG</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Tipo</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Richiesta</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Stato</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                  <td className="px-3 py-2 text-white">
                    {row.character?.name}
                    {row.character?.surname ? ` ${row.character.surname}` : ""}
                  </td>
                  <td className="px-3 py-2 text-[var(--accent-violet-light)] text-xs uppercase">{row.kind}</td>
                  <td className="px-3 py-2 text-gray-300">{row.requestedLabel}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">{row.status}</td>
                  <td className="px-3 py-2">
                    {row.status === "PENDING" ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Nota staff (opz.)"
                          value={notes[row.id] ?? ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
                          className="w-full px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-xs text-gray-300"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actingId === row.id}
                            onClick={() => review(row.id, "approve")}
                            className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] uppercase hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                          >
                            Approva
                          </button>
                          <button
                            type="button"
                            disabled={actingId === row.id}
                            onClick={() => review(row.id, "reject")}
                            className="px-2 py-1 rounded border border-[var(--border-color)] text-gray-400 text-[10px] uppercase hover:text-red-400 disabled:opacity-50"
                          >
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500">{row.staffNote ?? "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
