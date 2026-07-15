"use client";

import { useId, useState } from "react";

export type WazaResolutionPostData = {
  characterName: string;
  descrizione: string;
  wazaRomaji: string;
  wazaItaliano: string;
  toroArma?: string;
  papabili: { label: string; rank: number }[];
  irFinale: number;
  dannoFinale: number;
  dannoLordo?: number;
  isPassive?: boolean;
  /** Waza senza IR e senza Danno (percezioni, olfatti, dichiarazioni narrative). Card visibile a tutti, senza i numeri combat. */
  isNarrativa?: boolean;
  notInCatalog?: boolean;
  /** Waza con effetto rimandato ([setup:1]): mostra badge "in attesa" nel collapsed card. */
  setupPending?: boolean;
  expanded: {
    irBase: { skiruA: string; valA: number; skiruB: string; valB: number; media: number };
    irModifiers: { label: string; value: number }[];
    irDifesa?: number;
    wazaDescription?: string | null;
    wazaEffect?: string | null;
    dannoTier?: { tier: number; valore: number };
    dannoModifiers?: { label: string; value: number }[];
    filtroDifesa?: {
      lordo: number;
      scudo: number;
      dopoScudo: number;
      itami: number;
      mitigazionePct: number;
      finale: number;
    };
    statusAttivi?: string[];
  };
};

export function ChatWazaResolutionPost({ data }: { data: WazaResolutionPostData }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const hasFiltro = data.expanded.filtroDifesa != null;

  const showCombatStats = !data.isPassive && !data.isNarrativa;

  return (
    <article
      className={`chat-waza-launch-post${data.notInCatalog ? " chat-waza-launch-post--unknown" : ""}`}
      aria-label={`Lancio waza ${data.wazaRomaji} · ${data.characterName}`}
    >
      <div className="chat-waza-launch-post__row">
        <div className="chat-waza-launch-post__line">
          <span className="chat-waza-launch-post__actor">{data.characterName}</span>
          <span className="chat-waza-launch-post__sep" aria-hidden>
            ·
          </span>
          <span className="chat-waza-launch-post__waza-wrap">
            <span className="chat-waza-launch-post__waza">
              <span className="chat-waza-launch-post__romaji">{data.wazaRomaji}</span>
              <span className="chat-waza-launch-post__italiano">{data.wazaItaliano}</span>
            </span>
            <span className="chat-waza-launch-post__tooltip" role="tooltip">
              {data.descrizione}
            </span>
          </span>
          {showCombatStats ? (
            <span className="chat-waza-launch-post__stats">
              IR <strong>{data.irFinale}</strong>
              <span className="chat-waza-launch-post__stat-sep" aria-hidden>
                ·
              </span>
              Danno <strong>{data.dannoFinale}</strong>
              {data.setupPending && (
                <span className="chat-waza-launch-post__stat-sep" aria-hidden>·</span>
              )}
              {data.setupPending && (
                <span style={{ color: "var(--accent-violet-light)", fontStyle: "italic", fontSize: "0.75em" }}>
                  in attesa
                </span>
              )}
            </span>
          ) : (
            <span className="chat-waza-launch-post__stats chat-waza-launch-post__stats--passive">
              {data.isNarrativa && !data.isPassive ? "Narrativa" : "Passiva"}
            </span>
          )}
        </div>

        <button
          type="button"
          className="chat-waza-launch-post__expand"
          aria-expanded={open}
          aria-controls={detailId}
          aria-label={open ? "Chiudi dettaglio tecnico" : "Apri dettaglio tecnico"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "−" : "+"}
        </button>
      </div>

      {open ? (
        <div
          id={detailId}
          className="chat-waza-launch-post__detail animate__animated animate__fadeIn motion-reduce:animate-none"
        >
          {data.isPassive ? (
            <section className="chat-waza-launch-post__detail-section">
              <p className="chat-waza-launch-post__detail-text">
                Waza passiva — nessun confronto IR o danno al lancio.
              </p>
            </section>
          ) : (
            <>

          <section className="chat-waza-launch-post__detail-section">
            <h4 className="chat-waza-launch-post__detail-title">Skiru papabili (IR)</h4>
            <ul className="chat-waza-launch-post__steps">
              {data.papabili.length > 0 ? (
                data.papabili.map((p) => (
                  <li key={p.label}>
                    {p.label} <strong>{p.rank}</strong>
                  </li>
                ))
              ) : (
                <li className="chat-waza-launch-post__detail-text">Scheda non disponibile in chat.</li>
              )}
            </ul>
          </section>

          {data.toroArma ? (
            <section className="chat-waza-launch-post__detail-section">
              <h4 className="chat-waza-launch-post__detail-title">Tōrō / arma</h4>
              <p className="chat-waza-launch-post__detail-text">{data.toroArma}</p>
            </section>
          ) : null}

          <section className="chat-waza-launch-post__detail-section">
            <h4 className="chat-waza-launch-post__detail-title">Indice di riuscita</h4>
            <ul className="chat-waza-launch-post__steps">
              <li>
                Base ({data.expanded.irBase.skiruA} {data.expanded.irBase.valA} +{" "}
                {data.expanded.irBase.skiruB} {data.expanded.irBase.valB}) ÷ 2 ={" "}
                <strong>{data.expanded.irBase.media}</strong>
              </li>
              {data.expanded.irModifiers.map((m) => (
                <li key={m.label}>
                  {m.label}
                  {m.value !== 0 ? (
                    <>
                      {" "}
                      <strong>
                        {m.value >= 0 ? "+" : ""}
                        {m.value}
                      </strong>
                    </>
                  ) : null}
                </li>
              ))}
              <li className="chat-waza-launch-post__steps-total">
                IR attaccante <strong>{data.irFinale}</strong>
                {data.expanded.irDifesa != null ? (
                  <>
                    {" "}
                    · IR difesa bersaglio <strong>{data.expanded.irDifesa}</strong>
                  </>
                ) : null}
              </li>
            </ul>
          </section>

          {data.expanded.dannoTier ? (
            <section className="chat-waza-launch-post__detail-section">
              <h4 className="chat-waza-launch-post__detail-title">Danno lordo</h4>
              <ul className="chat-waza-launch-post__steps">
                <li>
                  Valore tier T{data.expanded.dannoTier.tier} ={" "}
                  <strong>{data.expanded.dannoTier.valore}</strong>
                </li>
                {(data.expanded.dannoModifiers ?? []).map((m) => (
                  <li key={m.label}>
                    {m.label}{" "}
                    <strong>
                      {m.value >= 0 ? "+" : ""}
                      {m.value}
                    </strong>
                  </li>
                ))}
                {data.dannoLordo != null ? (
                  <li className="chat-waza-launch-post__steps-total">
                    Danno prodotto <strong>{data.dannoLordo}</strong>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {hasFiltro ? (
            <section className="chat-waza-launch-post__detail-section">
              <h4 className="chat-waza-launch-post__detail-title">Filtro difensivo bersaglio</h4>
              <p className="chat-waza-launch-post__master-hint">
                Applicato solo se lo Shinigami dichiara il colpo entrato.
              </p>
              <ul className="chat-waza-launch-post__steps">
                <li>
                  Danno lordo <strong>{data.expanded.filtroDifesa!.lordo}</strong>
                </li>
                <li>
                  − Scudo <strong>{data.expanded.filtroDifesa!.scudo}</strong> →{" "}
                  <strong>{data.expanded.filtroDifesa!.dopoScudo}</strong>
                </li>
                <li>
                  × mitigazione Itami ({data.expanded.filtroDifesa!.itami} pt, −
                  {data.expanded.filtroDifesa!.mitigazionePct}%) →{" "}
                  <strong>{data.expanded.filtroDifesa!.finale}</strong>
                </li>
                <li className="chat-waza-launch-post__steps-total">
                  Danno inflitto (se entrato) <strong>{data.expanded.filtroDifesa!.finale}</strong>
                </li>
              </ul>
            </section>
          ) : null}

          <p className="chat-waza-launch-post__verdict">
            Entrato / mancato / stallo: <strong>valutazione Shinigami</strong>, non del sistema.
          </p>
            </>
          )}

          {(data.expanded.wazaDescription || data.expanded.wazaEffect) ? (
            <section className="chat-waza-launch-post__detail-section">
              <h4 className="chat-waza-launch-post__detail-title">Descrizione</h4>
              {data.expanded.wazaDescription && (
                <p className="chat-waza-launch-post__detail-text chat-waza-launch-post__detail-text--lore">
                  {data.expanded.wazaDescription}
                </p>
              )}
              {data.expanded.wazaEffect && (
                <p className="chat-waza-launch-post__detail-text">
                  {data.expanded.wazaEffect}
                </p>
              )}
            </section>
          ) : null}

          {(data.expanded.statusAttivi?.length ?? 0) > 0 ? (
            <section className="chat-waza-launch-post__detail-section">
              <h4 className="chat-waza-launch-post__detail-title">Bonus, malus e status</h4>
              <ul className="chat-waza-launch-post__tags">
                {data.expanded.statusAttivi!.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
