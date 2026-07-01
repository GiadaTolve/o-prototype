"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  MADOSHO_CATALOG,
  ORDER_REQUEST_VALUES,
  PREMIO_REQUEST_OPTIONS,
  labelForOrderRequest,
  labelForPremioRequest,
  type PlayerRequestKind,
} from "@domain/progression/player-requests";
import { getMadoshoDef } from "@domain/progression/madosho";
import { api } from "@/lib/api";
import { icons } from "@/lib/icons";

type RequestRow = {
  id: string;
  kind: PlayerRequestKind;
  requestedValue: string;
  requestedLabel: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  staffNote: string | null;
  updatedAt: string;
};

type Assigned = {
  madoshoId: string | null;
  order: string;
  premioSpeciale: string | null;
};

const KIND_META: Record<
  PlayerRequestKind,
  { title: string; hint: string; emptyOption: string }
> = {
  MADOSHO: {
    title: "Madoshō",
    hint: "Eredità di sangue — approvazione staff.",
    emptyOption: "— Scegli Madoshō —",
  },
  ORDER: {
    title: "Ordine",
    hint: "Mugen-Tai o Chisen-Tai — assegnazione al grado Hakyō (staff).",
    emptyOption: "— Scegli ordine —",
  },
  PREMIO: {
    title: "Premi",
    hint: "Premio speciale / milestone Jiga no Shihaisha.",
    emptyOption: "— Scegli premio —",
  },
};

function statusBadge(status: RequestRow["status"]) {
  if (status === "PENDING") {
    return (
      <span className="text-[9px] uppercase tracking-widest text-[var(--accent-violet-light)] border border-[var(--accent-violet)]/40 px-2 py-0.5 rounded">
        In attesa
      </span>
    );
  }
  if (status === "APPROVED") {
    return (
      <span className="text-[9px] uppercase tracking-widest text-[var(--accent-gold)] border border-[var(--accent-gold)]/40 px-2 py-0.5 rounded">
        Approvata
      </span>
    );
  }
  return (
    <span className="text-[9px] uppercase tracking-widest text-gray-500 border border-[var(--border-color)] px-2 py-0.5 rounded">
      Rifiutata
    </span>
  );
}

function assignedLabel(kind: PlayerRequestKind, assigned: Assigned): string {
  if (kind === "MADOSHO") {
    const m = getMadoshoDef(assigned.madoshoId);
    return m ? m.name : "Nessuna assegnata";
  }
  if (kind === "ORDER") {
    if (assigned.order === "MUGEN-TAI") return "Mugen-Tai";
    if (assigned.order === "CHISEN-TAI") return "Chisen-Tai";
    return "Nessuno";
  }
  return assigned.premioSpeciale
    ? labelForPremioRequest(assigned.premioSpeciale)
    : "Nessuno";
}

export function SchedaRichiestePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PlayerRequestKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [assigned, setAssigned] = useState<Assigned>({
    madoshoId: null,
    order: "NONE",
    premioSpeciale: null,
  });
  const [draft, setDraft] = useState<Record<PlayerRequestKind, string>>({
    MADOSHO: "",
    ORDER: "",
    PREMIO: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.get("/player-requests/me")) as {
        requests?: RequestRow[];
        assigned?: Assigned;
      };
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      if (data.assigned) setAssigned(data.assigned);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento richieste");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const requestForKind = (kind: PlayerRequestKind) =>
    requests.find((r) => r.kind === kind) ?? null;

  const submitKind = async (kind: PlayerRequestKind) => {
    const value = draft[kind].trim();
    if (!value) {
      setError(`Seleziona un valore per ${KIND_META[kind].title}.`);
      return;
    }
    setSaving(kind);
    setError(null);
    try {
      await api.put("/player-requests/me", {
        requests: [{ kind, requestedValue: value }],
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore invio richiesta");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500 p-6 animate__animated animate__fadeIn">Caricamento…</p>;
  }

  return (
    <div className="p-6 space-y-6 animate__animated animate__fadeIn">
      <div className="border-b border-[var(--border-color)] pb-3">
        <h2
          className="font-display text-xl text-[var(--accent-gold)] flex items-center gap-2"
          style={{ textShadow: "0 0 10px var(--glow-gold)" }}
        >
          <FontAwesomeIcon icon={icons.fire} className="w-4 h-4" />
          Richieste
        </h2>
        <p className="text-[11px] text-[var(--accent-violet-light)]/70 mt-1 max-w-lg">
          Indica le tue preferenze per Madoshō, Ordine e Premi. Lo staff le valuta dal pannello Gestione →
          Richieste.
        </p>
      </div>

      {error && (
        <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="space-y-4">
        {(["MADOSHO", "ORDER", "PREMIO"] as const).map((kind) => {
          const meta = KIND_META[kind];
          const current = requestForKind(kind);
          return (
            <section
              key={kind}
              className="rounded-lg border border-[var(--border-color)] bg-black/35 p-4 shadow-[var(--shadow-violet)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-display text-sm text-[var(--accent-gold)]">{meta.title}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{meta.hint}</p>
                </div>
                {current && statusBadge(current.status)}
              </div>

              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Assegnato ora</p>
              <p className="text-sm text-[var(--accent-violet-light)] mb-3">{assignedLabel(kind, assigned)}</p>

              {current && (
                <div className="mb-3 text-[11px] text-gray-400 border border-[var(--border-color)]/60 rounded px-3 py-2 bg-black/30">
                  <span className="text-gray-500">Ultima richiesta: </span>
                  <span className="text-white">{current.requestedLabel}</span>
                  {current.staffNote && (
                    <p className="mt-1 text-[var(--accent-violet-light)]/80">
                      Nota staff: {current.staffNote}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={draft[kind]}
                  onChange={(e) => setDraft((d) => ({ ...d, [kind]: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] outline-none"
                >
                  <option value="">{meta.emptyOption}</option>
                  {kind === "MADOSHO" &&
                    (MADOSHO_CATALOG ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  {kind === "ORDER" &&
                    (ORDER_REQUEST_VALUES ?? []).map((o) => (
                      <option key={o} value={o}>
                        {labelForOrderRequest(o)}
                      </option>
                    ))}
                  {kind === "PREMIO" &&
                    (PREMIO_REQUEST_OPTIONS ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={saving === kind || !draft[kind]}
                  onClick={() => submitKind(kind)}
                  className="shrink-0 px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  {saving === kind ? "…" : "Invia richiesta"}
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
