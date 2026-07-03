"use client";

import { useState } from "react";

/** Dimensioni fisse pannello guida chat */
const INFO_PANEL_W = 440;
const INFO_PANEL_H = 280;

/**
 * Guida rapida chat — testo, parlato, dadi, tag combattimento.
 * Bottone sopra il campo Luogo (allineato a sinistra).
 */
export function ChatInfoPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] font-display uppercase tracking-[0.15em] px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--accent-violet-light)] bg-[var(--panel-bg)]/80 hover:border-[var(--accent-gold)]/40 hover:text-[var(--accent-gold)] transition-colors"
        aria-expanded={open}
        aria-controls="chat-info-panel"
      >
        info
      </button>

      {open && (
        <div
          id="chat-info-panel"
          className="absolute bottom-full left-0 mb-1.5 z-50 flex flex-col rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/95 shadow-[var(--shadow-violet)] animate__animated animate__fadeIn motion-reduce:animate-none overflow-hidden"
          style={{ width: INFO_PANEL_W, height: INFO_PANEL_H }}
        >
          <h4 className="shrink-0 font-display text-[10px] uppercase tracking-[0.2em] text-[var(--accent-gold)] px-3 pt-2.5 pb-1.5 border-b border-[var(--border-color)]/60">
            Guida chat
          </h4>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 text-[11px] leading-relaxed text-[var(--accent-violet-light)]">
            <section className="mb-2.5">
              <p className="font-display text-[9px] uppercase text-gray-500 mb-1">Azione narrativa</p>
              <p className="text-gray-400">
                Scrivi azioni in terza persona nel box principale. Ogni messaggio narrativo vale EXP (1 ogni 500 caratteri totali). I tiri dado <strong className="text-gray-500 font-normal">non</strong> danno EXP.
              </p>
            </section>

            <section className="mb-2.5">
              <p className="font-display text-[9px] uppercase text-gray-500 mb-1">Parlato</p>
              <p className="text-gray-400">
                Usa le virgolette francesi: <span className="text-[var(--accent-gold)]">«testo parlato»</span>
              </p>
            </section>

            <section className="mb-2.5">
              <p className="font-display text-[9px] uppercase text-gray-500 mb-1">Luogo / posizione</p>
              <p className="text-gray-400">
                Campo sotto il bottone info: etichetta opzionale (es. <span className="text-[var(--accent-gold)]">Sala centrale</span>) mostrata accanto al nome.
              </p>
            </section>

            <section className="mb-2.5">
              <p className="font-display text-[9px] uppercase text-gray-500 mb-1">Dadi</p>
              <p className="text-gray-400 mb-1">
                Lancia un dado nel messaggio; il server sostituisce il comando con il risultato:
              </p>
              <ul className="list-none space-y-0.5 font-mono text-[10px] text-[var(--accent-gold)]">
                <li>/d 20</li>
                <li>/d 100</li>
                <li>/d 3</li>
                <li>/dado 44</li>
              </ul>
              <p className="text-gray-500 mt-1 text-[10px]">
                Facce ammesse: 2–1000. In chat: <span className="text-gray-400">Lancia un dado, esito:</span>{' '}
                <span className="dice-tag inline-block">🎲 50/100</span> — senza avatar del personaggio. Non dà EXP.
              </p>
            </section>

            <section className="mb-1">
              <p className="font-display text-[9px] uppercase text-gray-500 mb-1">Combattimento (tag + pannello)</p>
              <p className="text-[10px] text-gray-400 mb-1">
                Colonna sinistra: pannello <strong className="text-[var(--accent-violet-light)] font-normal">Combattimento</strong> con vitali, status, tag PG e strumenti Master.
              </p>
              <ul className="list-none space-y-0.5 text-[10px] text-gray-400">
                <li>
                  <span className="text-[var(--accent-gold)]">[waza:Nome]</span> — lancio tecnica;
                  in chat compare una <strong className="text-[var(--accent-violet-light)] font-normal">striscia</strong> con
                  Dō, tier, CS, danno e IR risolto; passa col mouse per la descrizione (i tag restano nel testo grezzo per il log)
                </li>
                <li>
                  <span className="text-[var(--accent-gold)]">[tenkan]</span> apre la Corona — ogni azione
                  ≥500 caratteri accumula <strong className="text-[var(--accent-gold)] font-normal">+3 CS</strong> in automatico;
                  <span className="text-[var(--accent-violet-light)]"> [tenkan:off]</span> chiude
                </li>
                <li><span className="text-[var(--accent-gold)]">[cs:N]</span> · <span className="text-[var(--accent-gold)]">[1/4]…[4/4]</span> · <span className="text-[var(--accent-gold)]">[Scudo]</span> · <span className="text-[var(--accent-gold)]">[IR:N]</span></li>
                <li>HP: Master aggiorna barra da <strong className="text-[var(--accent-violet-light)] font-normal">Strumenti Master</strong> (non compare in chat; narrato nel masterscreen)</li>
                <li><span className="text-[var(--accent-gold)]">[toro]</span> · consistenza/categoria · status</li>
                <li>
                  <span className="text-[var(--accent-gold)]">[investimento:+N]</span> versa CS in Tōshi (Hadō);{" "}
                  <span className="text-[var(--accent-gold)]">[investimento:riscuoti]</span> riscatta il pool
                </li>
                <li>
                  Shakkin: <span className="text-[var(--accent-gold)]">[waza:Shakkin…]</span> +{" "}
                  <span className="text-[var(--accent-gold)]">[debito:NomePG]</span> ·{" "}
                  <span className="text-[var(--accent-gold)]">[debito:restituisci]</span> (−1 stack) ·{" "}
                  <span className="text-[var(--accent-gold)]">[debito:riscuoti]</span>
                </li>
                <li>
                  Kōmei: <span className="text-[var(--accent-gold)]">[waza:Kōmei…]</span> inverte status negativi
                  (richiede almeno uno attivo)
                </li>
                <li>
                  Shokushin: <span className="text-[var(--accent-gold)]">[waza:Shokushin…]</span> +{" "}
                  <span className="text-[var(--accent-gold)]">[lettura:NomePG]</span>
                </li>
                <li>
                  Nagori: <span className="text-[var(--accent-gold)]">[waza:Nagori…]</span> · shift{" "}
                  <span className="text-[var(--accent-gold)]">[yuragi:liquido→solido]</span>
                </li>
                <li>
                  Giurisdizione: <span className="text-[var(--accent-gold)]">[waza:Kankatsu…]</span> +{" "}
                  <span className="text-[var(--accent-gold)]">[giurisdizione:Proiettile]</span> o{" "}
                  <span className="text-[var(--accent-gold)]">[giurisdizione:Raggio]</span> · reclamo{" "}
                  <span className="text-[var(--accent-gold)]">[giurisdizione:reclama]</span>
                </li>
                <li>
                  Chokurei: <span className="text-[var(--accent-gold)]">[waza:Chokurei…]</span> +{" "}
                  <span className="text-[var(--accent-gold)]">[decreto: testo]</span>
                </li>
                <li>
                  Eden / Mugen-Shihai: tag waza + zone attiva · spezza dominio{" "}
                  <span className="text-[var(--accent-gold)]">[dominio:spezza]</span>
                </li>
                <li>
                  Meisaku: <span className="text-[var(--accent-gold)]">[meisaku:nome]</span> · chiudi{" "}
                  <span className="text-[var(--accent-gold)]">[meisaku:termine]</span>
                </li>
                <li>
                  Hōgō: <span className="text-[var(--accent-gold)]">[waza:Hōgō…]</span> +{" "}
                  <span className="text-[var(--accent-gold)]">[sutura:NomePG:offensiva|stile|elementale]</span> ·
                  spezza <span className="text-[var(--accent-gold)]">[sutura:spezza]</span>
                </li>
                <li>
                  Omocha / Gangushi: tag waza · <span className="text-[var(--accent-gold)]">[omocha:oggetto]</span>
                </li>
                <li>
                  Shinryaku: tag waza · costrutto{" "}
                  <span className="text-[var(--accent-gold)]">[shinryaku:nome]</span> · contatto{" "}
                  <span className="text-[var(--accent-gold)]">[shinryaku:contatto:NomePG]</span>
                </li>
                <li>
                  Eden: tag waza · rigenera costrutti{" "}
                  <span className="text-[var(--accent-gold)]">[eden:rigenera]</span> o{" "}
                  <span className="text-[var(--accent-gold)]">[eden:rigenera:2]</span> (−2 CS/costr.)
                </li>
                <li>
                  Igyō-Rensei: <span className="text-[var(--accent-gold)]">[waza:Igyō…]</span> +{" "}
                  <span className="text-[var(--accent-gold)]">[igyo:liquido]</span> o{" "}
                  <span className="text-[var(--accent-gold)]">[igyo:solido→liquido]</span>
                </li>
                <li>
                  Generiche: Ippuku via tag waza (+3 CS) · status al colpo{" "}
                  <span className="text-[var(--accent-gold)]">[generiche:colpito:NomePG]</span> (Suishin, Nenmō, Kyōkan, Hankyō, Kyōshin)
                </li>
                <li>
                  Komonoire (solo clan): dado{" "}
                  <span className="text-[var(--accent-gold)]">[komonoire:tira:N]</span> (N=1–6) · accetta{" "}
                  <span className="text-[var(--accent-gold)]">[komonoire:accetta]</span> · rifiuto{" "}
                  <span className="text-[var(--accent-gold)]">[komonoire:rifiuta]</span> → [Debitore]
                </li>
                <li>
                  Kōmei Rovente: colpo a contatto da Master con{" "}
                  <span className="text-[var(--accent-gold)]">contactHit</span> → [Incendiato]
                </li>
                <li>
                  <span className="text-[var(--accent-gold)]">[stato: …]</span> — riepilogo automatico a fine azione
                  (Tensione, status, Investimento, Kōmei, Lettura, Nagori, zone Dō)
                </li>
              </ul>
            </section>

            <section className="mb-1">
              <p className="font-display text-[9px] uppercase text-gray-500 mb-1">Tempo &amp; Tenkan</p>
              <p className="text-[10px] text-gray-400">
                I quarti <span className="text-[var(--accent-gold)]">[1/4]…[4/4]</span> li tieni tu in autonomia.
                La <strong className="text-[var(--accent-violet-light)] font-normal">Corona (Tenkan)</strong> si apre con{" "}
                <span className="text-[var(--accent-gold)]">[tenkan]</span>: ogni azione ≥500 caratteri dà +3 CS
                automatici finché resta aperta.
              </p>
            </section>
          </div>

          <div className="shrink-0 px-3 py-1.5 border-t border-[var(--border-color)]/60">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[9px] font-display uppercase text-gray-500 hover:text-[var(--accent-gold)]"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
