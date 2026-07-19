"use client";

import type { ReactNode } from "react";
import {
  PNG_TIPO_LABELS,
  type PngScheda,
  type PngTipo,
} from "@domain/shinigami";

export type FieldNpc = PngScheda & {
  room_id?: string;
  bestiario_id?: string | null;
  albo_id?: string | null;
};

function Stat({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="rounded border border-[var(--border-color)]/60 bg-black/30 px-2 py-1.5 text-center">
      <p className="text-[8px] uppercase tracking-wider text-gray-500 font-display">{label}</p>
      <p className="text-sm font-display text-[var(--accent-gold)] tabular-nums">{value}</p>
    </div>
  );
}

/** Scheda PNG — linee guida Master (§4). */
export function SchedaPngView({
  entry,
  footer,
  title = "Scheda PNG",
}: {
  entry: Partial<PngScheda> & { nome: string; tipo?: PngTipo };
  footer?: ReactNode;
  title?: string;
}) {
  const tipo = entry.tipo ?? "mob";
  return (
    <article className="rounded-lg border border-[var(--accent-violet)]/40 bg-[var(--panel-bg)] p-3 space-y-3 animate__animated animate__fadeIn motion-reduce:animate-none">
      <header>
        <p className="text-[9px] uppercase tracking-widest text-[var(--accent-violet-light)] font-display">
          {title} · {PNG_TIPO_LABELS[tipo] ?? tipo}
          {entry.tier != null ? ` · T${entry.tier}` : ""}
        </p>
        <h3 className="font-display text-lg text-[var(--accent-gold)] truncate">{entry.nome}</h3>
      </header>
      {entry.note && (
        <p className="text-xs text-gray-400 font-accent leading-relaxed whitespace-pre-wrap">{entry.note}</p>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <Stat
          label="HP"
          value={
            entry.hp_max != null
              ? `${entry.hp_correnti ?? entry.hp_max}/${entry.hp_max}`
              : entry.hp_correnti
          }
        />
        <Stat
          label="CS"
          value={
            entry.cs_max != null
              ? `${entry.cs_correnti ?? 0}/${entry.cs_max}`
              : entry.cs_correnti
          }
        />
        <Stat label="IR atk" value={entry.ir_attacco} />
        <Stat label="IR def" value={entry.ir_difesa} />
      </div>
      {(entry.waza?.length ?? 0) > 0 && (
        <ul className="text-[11px] text-[var(--accent-violet-light)] space-y-0.5 border-t border-[var(--border-color)]/40 pt-2">
          {entry.waza!.map((w, i) => (
            <li key={`${w.nome}-${i}`}>
              {w.nome}
              {w.danno != null ? ` · dmg ${w.danno}` : ""}
              {w.descrizione ? ` — ${w.descrizione}` : ""}
            </li>
          ))}
        </ul>
      )}
      {footer}
    </article>
  );
}

export function SchedaBestiarioView({
  entry,
  footer,
}: {
  entry: Partial<PngScheda> & {
    nome: string;
    tipo?: PngTipo;
    lore?: string | null;
    onimori?: string | null;
    tag_caccia?: boolean;
    name_jp?: string | null;
    habitat?: string | null;
    comportamento?: string | null;
    drop_table?: Array<{
      item_id?: string;
      item_nome?: string;
      quantita_min?: number;
      quantita_max?: number;
      probabilita?: number;
    }>;
  };
  footer?: ReactNode;
}) {
  return (
    <SchedaPngView
      entry={{ ...entry, note: entry.lore ?? entry.note }}
      title="Scheda Bestiario"
      footer={
        <>
          {entry.name_jp && (
            <p className="text-[10px] text-gray-500">{entry.name_jp}</p>
          )}
          {entry.onimori && (
            <p className="text-[10px] text-[var(--accent-violet-light)]">Onimori: {entry.onimori}</p>
          )}
          {entry.habitat && (
            <p className="text-[10px] text-gray-500">Habitat: {entry.habitat}</p>
          )}
          {entry.comportamento && (
            <p className="text-[10px] text-gray-500">Comportamento: {entry.comportamento}</p>
          )}
          {entry.tag_caccia && (
            <p className="text-[9px] uppercase tracking-wider text-[var(--accent-gold)] font-display">
              [mob-caccia]
            </p>
          )}
          {(entry.drop_table?.length ?? 0) > 0 && (
            <ul className="text-[10px] text-gray-400 space-y-0.5 border-t border-[var(--border-color)]/40 pt-2">
              {entry.drop_table!.map((d, i) => (
                <li key={`${d.item_id ?? d.item_nome}-${i}`}>
                  {d.item_nome ?? d.item_id}
                  {d.quantita_min != null
                    ? ` ×${d.quantita_min}${d.quantita_max != null && d.quantita_max !== d.quantita_min ? `–${d.quantita_max}` : ""}`
                    : ""}
                  {d.probabilita != null ? ` · ${d.probabilita}%` : ""}
                </li>
              ))}
            </ul>
          )}
          {footer}
        </>
      }
    />
  );
}
