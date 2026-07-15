"use client";

import { useId, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

export type ConstructSticker = "Tōrō" | "Batteria" | "Personale";

export type ConstructResolutionPostData = {
  nome: string;
  dannoMedio?: number;
  movimentoM: number;
  taglia: "Piccola" | "Media" | "Grande" | "Enorme";
  hpCurrent: number;
  hpMax: number;
  stickers: ConstructSticker[];
  mei?: string;
  expanded: {
    bonusMalus: { label: string; value: string }[];
    note?: string;
  };
};

export function ChatConstructResolutionPost({ data }: { data: ConstructResolutionPostData }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const hpPct = Math.max(0, Math.min(100, Math.round((data.hpCurrent / data.hpMax) * 100)));

  return (
    <article
      className="chat-resolution-post chat-resolution-post--construct"
      aria-label={`Costrutto ${data.nome}`}
    >
      <header className="chat-resolution-post__head">
        <FontAwesomeIcon icon={icons.shield} className="chat-resolution-post__icon" aria-hidden />
        <div className="chat-resolution-post__title-block">
          <p className="chat-resolution-post__title">
            <span className="chat-resolution-post__romaji">{data.nome}</span>
          </p>
          <div className="chat-resolution-post__construct-row">
            {data.dannoMedio != null ? (
              <span>
                Danno <strong>{data.dannoMedio}</strong>
              </span>
            ) : null}
            <span>
              Mov. <strong>{data.movimentoM} m</strong>/quarto
            </span>
            <span>
              Taglia <strong>{data.taglia}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="chat-resolution-post__hp" role="group" aria-label="Integrità costrutto">
        <div className="chat-resolution-post__hp-labels">
          <span>Resistenza</span>
          <span>
            {data.hpCurrent} / {data.hpMax}
          </span>
        </div>
        <div
          className="chat-resolution-post__hp-bar"
          role="progressbar"
          aria-valuenow={data.hpCurrent}
          aria-valuemin={0}
          aria-valuemax={data.hpMax}
        >
          <span className="chat-resolution-post__hp-fill" style={{ width: `${hpPct}%` }} />
        </div>
      </div>

      {data.stickers.length > 0 ? (
        <div className="chat-resolution-post__stickers" aria-label="Sticker costrutto">
          {data.stickers.map((s) => (
            <span key={s} className="chat-resolution-post__sticker">
              {s}
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className="chat-resolution-post__toggle"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="chat-resolution-post__toggle-chev">{open ? "−" : "+"}</span>
        <span>Dettaglio costrutto</span>
      </button>

      {open ? (
        <div
          id={detailId}
          className="chat-resolution-post__detail animate__animated animate__fadeIn motion-reduce:animate-none"
        >
          {(data.expanded.bonusMalus.length > 0 || data.mei) && (
            <section className="chat-resolution-post__detail-section">
              <h4 className="chat-resolution-post__detail-title">Bonus e malus</h4>
              <ul className="chat-resolution-post__steps">
                {data.expanded.bonusMalus.map((b) => (
                  <li key={b.label}>
                    {b.label} <strong>{b.value}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.mei ? (
            <section className="chat-resolution-post__detail-section">
              <h4 className="chat-resolution-post__detail-title">Mei (Genzai)</h4>
              <p className="chat-resolution-post__mei">{data.mei}</p>
            </section>
          ) : null}

          {data.expanded.note ? (
            <p className="chat-resolution-post__note">{data.expanded.note}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
