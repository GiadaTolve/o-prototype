"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type IpRow = {
  ip: string;
  isRegistration: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  userAgent: string | null;
};

type DeviceRow = {
  deviceId: string;
  signalHash: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  userAgent: string | null;
};

type UserRow = {
  userId: string;
  email: string;
  role: string;
  banState: string;
  registrationIp: string | null;
  staffNote: string | null;
  characters: Array<{ id: string; name: string; surname: string | null }>;
  ips: IpRow[];
  devices: DeviceRow[];
  matchCount: number;
  deviceMatchCount: number;
};

type MatchRow = {
  ip: string;
  staffNote: string | null;
  noteUpdatedAt: string | null;
  accounts: Array<{ userId: string; email: string; characterLabel: string }>;
};

type DeviceMatchRow = {
  deviceId: string;
  staffNote: string | null;
  noteUpdatedAt: string | null;
  accounts: Array<{ userId: string; email: string; characterLabel: string }>;
};

type Snapshot = {
  users: UserRow[];
  matches: MatchRow[];
  deviceMatches: DeviceMatchRow[];
};

function charLabel(u: UserRow): string {
  if (u.characters.length === 0) return "—";
  return u.characters.map((c) => [c.name, c.surname].filter(Boolean).join(" ")).join(", ");
}

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    if (d.getTime() === 0) return "—";
    return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function shortId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

const NOTE_BTN =
  "min-h-[40px] px-3 rounded border border-[var(--border-color)] text-[10px] uppercase tracking-wide text-[var(--accent-gold)] hover:border-[var(--accent-gold)]/50 disabled:opacity-40";

function StaffNoteEditor({
  label,
  initial,
  busy,
  onSave,
}: {
  label: string;
  initial: string;
  busy: boolean;
  onSave: (note: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  return (
    <div className="space-y-1.5">
      <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-display">
        {label}
      </label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        maxLength={4000}
        placeholder="Es. Stesso PC di casa / persone diverse…"
        className="w-full min-h-[56px] rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[11px] text-white"
      />
      <button
        type="button"
        disabled={busy || draft.trim() === initial.trim()}
        className={NOTE_BTN}
        onClick={() => void onSave(draft)}
      >
        Salva nota
      </button>
    </div>
  );
}

/** Gestione → Supervisione: IP + device fingerprint. */
export function GestioneSupervisionePanel() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [onlyMatches, setOnlyMatches] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const snap = (await api.get("/admin/supervisione")) as Snapshot;
      setData({
        users: Array.isArray(snap.users) ? snap.users : [],
        matches: Array.isArray(snap.matches) ? snap.matches : [],
        deviceMatches: Array.isArray(snap.deviceMatches) ? snap.deviceMatches : [],
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore Supervisione");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveIpNote = async (ip: string, note: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await api.put("/admin/supervisione/ip-note", { ip, note });
      setMsg("Nota IP salvata");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Errore salvataggio");
    } finally {
      setBusy(false);
    }
  };

  const saveDeviceNote = async (deviceId: string, note: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await api.put("/admin/supervisione/device-note", { deviceId, note });
      setMsg("Nota device salvata");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Errore salvataggio");
    } finally {
      setBusy(false);
    }
  };

  const saveUserNote = async (userId: string, note: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await api.put("/admin/supervisione/user-note", { userId, note });
      setMsg("Nota account salvata");
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Errore salvataggio");
    } finally {
      setBusy(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.users.filter((u) => {
      if (onlyMatches && u.matchCount <= 0 && u.deviceMatchCount <= 0) return false;
      if (!needle) return true;
      const hay = [
        u.email,
        charLabel(u),
        u.registrationIp ?? "",
        u.staffNote ?? "",
        ...u.ips.map((i) => i.ip),
        ...u.devices.map((d) => d.deviceId),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [data, q, onlyMatches]);

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento Supervisione…</p>;
  }

  if (error) {
    return (
      <p className="text-xs text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate__animated animate__fadeIn motion-reduce:animate-none">
      <header className="space-y-1">
        <h2 className="text-lg font-display text-[var(--accent-gold)]">Supervisione</h2>
        <p className="text-xs text-gray-500 max-w-2xl">
          Match IP = stessa rete pubblica. Match device = stesso profilo browser (ID persistente).
          Entrambi sono segnali: usa le note per condivisioni legittime.
        </p>
        {msg && (
          <p className="text-[10px] text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-2 py-1 bg-black/30">
            {msg}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)] font-display">
            Match IP ({data.matches.length})
          </h3>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-[40px] px-3 rounded border border-[var(--border-color)] text-[10px] uppercase tracking-wide text-gray-300 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)]/50"
          >
            Aggiorna
          </button>
        </div>
        {data.matches.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nessun match IP.</p>
        ) : (
          <ul className="space-y-2">
            {data.matches.map((m) => (
              <li
                key={m.ip}
                className="rounded border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/5 p-3 space-y-2"
              >
                <p className="text-sm font-display text-[var(--accent-gold)] tabular-nums">{m.ip}</p>
                <ul className="space-y-1">
                  {m.accounts.map((a) => (
                    <li key={a.userId} className="text-xs text-gray-300">
                      <span className="text-white font-display">{a.characterLabel}</span>
                      <span className="text-gray-500"> · {a.email}</span>
                    </li>
                  ))}
                </ul>
                <StaffNoteEditor
                  label="Nota interna (IP)"
                  initial={m.staffNote ?? ""}
                  busy={busy}
                  onSave={(note) => saveIpNote(m.ip, note)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)] font-display">
          Match device ({data.deviceMatches.length})
        </h3>
        {data.deviceMatches.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nessun match device.</p>
        ) : (
          <ul className="space-y-2">
            {data.deviceMatches.map((m) => (
              <li
                key={m.deviceId}
                className="rounded border border-[var(--accent-violet)]/40 bg-[var(--accent-violet)]/5 p-3 space-y-2"
              >
                <p className="text-sm font-display text-[var(--accent-violet-light)] font-mono">
                  {shortId(m.deviceId)}
                </p>
                <p className="text-[9px] text-gray-600 break-all">{m.deviceId}</p>
                <ul className="space-y-1">
                  {m.accounts.map((a) => (
                    <li key={a.userId} className="text-xs text-gray-300">
                      <span className="text-white font-display">{a.characterLabel}</span>
                      <span className="text-gray-500"> · {a.email}</span>
                    </li>
                  ))}
                </ul>
                <StaffNoteEditor
                  label="Nota interna (device)"
                  initial={m.staffNote ?? ""}
                  busy={busy}
                  onSave={(note) => saveDeviceNote(m.deviceId, note)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)] font-display">
          Account · IP · device
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca nome PG, email, IP, device…"
            className="flex-1 min-h-[44px] rounded border border-[var(--border-color)] bg-black/40 px-3 text-sm text-white"
          />
          <label className="inline-flex items-center gap-2 min-h-[44px] px-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={onlyMatches}
              onChange={(e) => setOnlyMatches(e.target.checked)}
              className="rounded border-[var(--border-color)]"
            />
            Solo con match
          </label>
        </div>

        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Nessun risultato.</p>
          ) : (
            filteredUsers.map((u) => (
              <article
                key={u.userId}
                className={`rounded border p-3 space-y-2 ${
                  u.matchCount > 0 || u.deviceMatchCount > 0
                    ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/5"
                    : "border-[var(--border-color)]/70 bg-black/25"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-display text-white truncate">{charLabel(u)}</p>
                    <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="shrink-0 text-right space-y-0.5">
                    {u.matchCount > 0 && (
                      <p className="text-[9px] uppercase tracking-wider text-[var(--accent-gold)] font-display">
                        IP ×{u.matchCount}
                      </p>
                    )}
                    {u.deviceMatchCount > 0 && (
                      <p className="text-[9px] uppercase tracking-wider text-[var(--accent-violet-light)] font-display">
                        Device ×{u.deviceMatchCount}
                      </p>
                    )}
                  </div>
                </div>
                <ul className="space-y-1">
                  {u.ips.length === 0 ? (
                    <li className="text-[10px] text-gray-600 italic">Nessun IP</li>
                  ) : (
                    u.ips.map((ip) => (
                      <li
                        key={ip.ip}
                        className="text-[11px] text-[var(--accent-violet-light)] tabular-nums"
                      >
                        IP {ip.ip}
                        {ip.isRegistration ? " · reg." : " · sess."}
                        <span className="text-gray-600"> · {fmt(ip.lastSeenAt)}</span>
                      </li>
                    ))
                  )}
                  {u.devices.map((d) => (
                    <li key={d.deviceId} className="text-[11px] text-gray-400 font-mono">
                      Device {shortId(d.deviceId)}
                      <span className="text-gray-600 font-sans"> · {fmt(d.lastSeenAt)}</span>
                    </li>
                  ))}
                </ul>
                {u.staffNote && (
                  <p className="text-[10px] text-[var(--accent-violet-light)] italic border-l-2 border-[var(--accent-violet)]/40 pl-2">
                    {u.staffNote}
                  </p>
                )}
                <StaffNoteEditor
                  label="Nota interna (account)"
                  initial={u.staffNote ?? ""}
                  busy={busy}
                  onSave={(note) => saveUserNote(u.userId, note)}
                />
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
