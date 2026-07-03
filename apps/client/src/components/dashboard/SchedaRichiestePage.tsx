"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  EXCLUSIVE_SKIRU_REQUEST_OPTIONS,
  MADOSHO_CATALOG,
  ORDER_REQUEST_VALUES,
  PREMIO_FREE_TEXT_MAX,
  PREMIO_FREE_TEXT_MIN,
  PREMIO_REQUEST_OPTIONS,
  TENKAN_REQUEST_VALUE,
  labelForExclusiveSkiruRequest,
  labelForOrderRequest,
  labelForPremioRequest,
  type PlayerRequestKind,
} from "@domain/progression/player-requests";
import { getMadoshoDef } from "@domain/progression/madosho";
import { useSviluppoTaxonomy } from "@/hooks/useSviluppoTaxonomy";
import { api } from "@/lib/api";
import { icons } from "@/lib/icons";

type RequestRow = {
  id: string;
  kind: PlayerRequestKind;
  requestedValue: string;
  requestedLabel: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  locked: boolean;
  staffNote: string | null;
  updatedAt: string;
};

type Assigned = {
  madoshoId: string | null;
  order: string;
  premioSpeciale: string | null;
  exclusiveSkiruId?: string | null;
  exclusiveSkiruLabel?: string | null;
  tenkanOpen?: boolean;
};

const REQUEST_SECTIONS: PlayerRequestKind[] = [
  "MADOSHO",
  "ORDER",
  "SKIRU_ESCLUSIVA",
  "PREMIO",
  "TENKAN",
];

const LOCK_AFTER_APPROVAL_HINT =
  " Dopo l'approvazione staff la sezione si blocca; Admin o Moderatore possono sbloccarla.";

const KIND_META: Record<
  PlayerRequestKind,
  { title: string; hint: string; emptyOption: string }
> = {
  MADOSHO: {
    title: "Madoshō",
    hint: `Eredità di sangue — approvazione staff.${LOCK_AFTER_APPROVAL_HINT}`,
    emptyOption: "— Scegli Madoshō —",
  },
  ORDER: {
    title: "Ordine",
    hint: `Mugen-Tai o Chisen-Tai — assegnazione al grado Hakyō (staff).${LOCK_AFTER_APPROVAL_HINT}`,
    emptyOption: "— Scegli ordine —",
  },
  SKIRU_ESCLUSIVA: {
    title: "Skiru esclusive",
    hint: `Milestone Jiga no Shihaisha — approvazione staff, EXP all'approvazione (un solo percorso attivo).${LOCK_AFTER_APPROVAL_HINT}`,
    emptyOption: "— Scegli Skiru esclusiva —",
  },
  PREMIO: {
    title: "Premi narrativi",
    hint: `Patti e premi speciali — approvazione staff.${LOCK_AFTER_APPROVAL_HINT}`,
    emptyOption: "— Scegli premio —",
  },
  TENKAN: {
    title: "Tenkan — Terzo Occhio",
    hint: `Apertura accademica Sōkaiju — approvazione staff dopo evento narrativo (non si compra con EXP).${LOCK_AFTER_APPROVAL_HINT}`,
    emptyOption: "",
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
  if (kind === "SKIRU_ESCLUSIVA") {
    if (assigned.exclusiveSkiruLabel) return assigned.exclusiveSkiruLabel;
    if (assigned.exclusiveSkiruId) {
      return labelForExclusiveSkiruRequest(assigned.exclusiveSkiruId);
    }
    return "Nessuna";
  }
  if (kind === "PREMIO") {
    return assigned.premioSpeciale
      ? labelForPremioRequest(assigned.premioSpeciale)
      : "Nessuno";
  }
  if (kind === "TENKAN") {
    return assigned.tenkanOpen ? "Terzo Occhio aperto" : "Non ancora aperto";
  }
  return "—";
}

export function SchedaRichiestePage() {
  const { state: taxonomy } = useSviluppoTaxonomy();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PlayerRequestKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [serverPremioOptions, setServerPremioOptions] = useState(PREMIO_REQUEST_OPTIONS);
  const [assigned, setAssigned] = useState<Assigned>({
    madoshoId: null,
    order: "NONE",
    premioSpeciale: null,
  });
  const [draft, setDraft] = useState<Record<PlayerRequestKind, string>>({
    MADOSHO: "",
    ORDER: "",
    SKIRU_ESCLUSIVA: "",
    PREMIO: "",
    TENKAN: TENKAN_REQUEST_VALUE,
  });

  const premioOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const p of serverPremioOptions) map.set(p.id, p);
    for (const p of PREMIO_REQUEST_OPTIONS) map.set(p.id, p);
    for (const p of taxonomy.premio) {
      map.set(p.id, { id: p.id, label: p.name });
    }
    return [...map.values()];
  }, [serverPremioOptions, taxonomy.premio]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.get("/player-requests/me")) as {
        requests?: RequestRow[];
        premioOptions?: Array<{ id: string; label: string }>;
        assigned?: Assigned;
      };
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      if (Array.isArray(data.premioOptions)) setServerPremioOptions(data.premioOptions);
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

  const isFormLocked = (kind: PlayerRequestKind) => {
    const current = requestForKind(kind);
    return current?.status === "APPROVED" && current.locked === true;
  };

  const submitKind = async (kind: PlayerRequestKind) => {
    if (isFormLocked(kind)) {
      setError("Richiesta bloccata dopo l'approvazione. Contatta Admin o Moderatore.");
      return;
    }

    const value = kind === "TENKAN" ? TENKAN_REQUEST_VALUE : draft[kind].trim();
    if (!value) {
      setError(`Seleziona o compila un valore per ${KIND_META[kind].title}.`);
      return;
    }
    if (kind === "PREMIO" && premioOptions.length === 0) {
      if (value.length < PREMIO_FREE_TEXT_MIN || value.length > PREMIO_FREE_TEXT_MAX) {
        setError(
          `Descrivi il premio narrativo (${PREMIO_FREE_TEXT_MIN}–${PREMIO_FREE_TEXT_MAX} caratteri).`,
        );
        return;
      }
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
          Indica le tue preferenze per Madoshō, Ordine, Skiru esclusive, Premi e Tenkan. Dopo
          l&apos;approvazione staff la richiesta si blocca; solo Admin e Moderatore possono
          sbloccarla in Gestione → Richieste.
        </p>
      </div>

      {error && (
        <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="space-y-4">
        {REQUEST_SECTIONS.map((kind) => {
          const meta = KIND_META[kind];
          const current = requestForKind(kind);
          const locked = isFormLocked(kind);
          const tenkanDone = kind === "TENKAN" && assigned.tenkanOpen;
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
                <div className="flex items-center gap-2">
                  {locked && (
                    <span
                      className="text-[var(--accent-gold)]/80"
                      title="Richiesta bloccata — contatta staff per sbloccare"
                    >
                      <FontAwesomeIcon icon={icons.lock} className="w-3 h-3" />
                    </span>
                  )}
                  {current && statusBadge(current.status)}
                </div>
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
                  {locked && (
                    <p className="mt-1 text-[var(--accent-gold)]/80">
                      Bloccata dopo approvazione. Per ripensamenti chiedi sblocco ad Admin o Moderatore.
                    </p>
                  )}
                </div>
              )}

              {locked ? (
                <p className="text-[11px] text-gray-500 italic">
                  Non puoi inviare una nuova richiesta finché lo staff non sblocca questa sezione.
                </p>
              ) : tenkanDone ? (
                <p className="text-[11px] text-[var(--accent-gold)]/80 italic">
                  Terzo Occhio già aperto in scheda — nessuna ulteriore richiesta necessaria.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  {kind === "TENKAN" ? (
                    <p className="flex-1 text-[11px] text-[var(--accent-violet-light)]/80 px-1 py-2">
                      Richiedi l&apos;inserimento di{" "}
                      <strong className="text-[var(--accent-gold)]">tenkan: 1</strong> in scheda dopo
                      l&apos;evento narrativo di apertura del Terzo Occhio.
                    </p>
                  ) : kind === "PREMIO" && premioOptions.length === 0 ? (
                    <textarea
                      value={draft[kind]}
                      onChange={(e) => setDraft((d) => ({ ...d, [kind]: e.target.value }))}
                      placeholder={`Descrivi il premio narrativo che richiedi (${PREMIO_FREE_TEXT_MIN}–${PREMIO_FREE_TEXT_MAX} caratteri)…`}
                      maxLength={PREMIO_FREE_TEXT_MAX}
                      rows={3}
                      className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] outline-none resize-y min-h-[72px]"
                    />
                  ) : (
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
                      {kind === "SKIRU_ESCLUSIVA" &&
                        (EXCLUSIVE_SKIRU_REQUEST_OPTIONS ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      {kind === "PREMIO" &&
                        premioOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                    </select>
                  )}
                  <button
                    type="button"
                    disabled={saving === kind || tenkanDone || (kind !== "TENKAN" && !draft[kind])}
                    onClick={() => submitKind(kind)}
                    className="shrink-0 px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                  >
                    {saving === kind ? "…" : kind === "TENKAN" ? "Richiedi Tenkan" : "Invia richiesta"}
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
