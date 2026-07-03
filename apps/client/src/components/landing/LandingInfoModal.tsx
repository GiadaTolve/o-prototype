"use client";

import type { ReactNode } from "react";

type InfoKind = "guida" | "ambientazione";

const CONTENT: Record<InfoKind, { title: string; body: ReactNode }> = {
  guida: {
    title: "Guida Introduttiva",
    body: (
      <>
        <h1>Benvenuto in Oyasumi</h1>
        <p>
          Questa guida ti aiuterà a muovere i primi passi nel mondo di gioco. Il sistema si basa su un&apos;interfaccia a
          finestre: mappa, chat, scheda personaggio e strumenti di gioco convivono nello stesso spazio.
        </p>
        <h2>Comandi di base</h2>
        <p>
          Per parlare usa la sintassi <strong>&lt;...&gt;</strong> che verrà trasformata in «...». Il combattimento
          avviene in chat; il Master arbitra turni, Waza e dadi quando richiesti.
        </p>
        <p>Dopo la registrazione troverai la guida completa e aggiornata dal pannello in gioco.</p>
      </>
    ),
  },
  ambientazione: {
    title: "L&apos;Ambientazione di Oyasumi",
    body: (
      <>
        <h1>Il Mondo di Oyasumi</h1>
        <p>
          Ci troviamo in un Giappone futuristico, un luogo dove tecnologia e antiche tradizioni si scontrano. Le
          corporazioni controllano le città illuminate dai neon, mentre nelle ombre si muovono creature del folklore e
          analisti che leggono la realtà che sanguina.
        </p>
        <p>
          Oyasumi è un dark fantasy narrativo: la storia viene prima, ma le regole — matematica compresa — non si
          piegano arbitrariamente.
        </p>
      </>
    ),
  },
};

export function LandingInfoModal({ kind, onClose }: { kind: InfoKind; onClose: () => void }) {
  const { title, body } = CONTENT[kind];
  return (
    <div className="landing-info-modal animate__animated animate__fadeIn">
      <h2 style={{ fontFamily: "var(--font-cinzel)", color: "var(--accent-gold)", marginBottom: "1rem" }}>{title}</h2>
      {body}
      <button type="button" className="landing-info-close" onClick={onClose}>
        Chiudi
      </button>
    </div>
  );
}
