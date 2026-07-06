"use client";

import type { ReactNode } from "react";

type InfoKind = "guida" | "ambientazione" | "privacy" | "principia";

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
  privacy: {
    title: "Informativa privacy",
    body: (
      <>
        <h1>Privacy</h1>
        <p>
          Oyasumi tratta i dati necessari alla registrazione e al funzionamento del gioco (account, email, preferenze
          espresse in fase di iscrizione). I contenuti di gioco possono includere temi per un pubblico maggiorenne.
        </p>
        <p>
          Per richieste relative ai tuoi dati puoi contattare lo staff all&apos;indirizzo indicato sul sito. L&apos;informativa
          completa sarà aggiornata in versione definitiva prima dell&apos;apertura pubblica.
        </p>
      </>
    ),
  },
  principia: {
    title: "Principia Satirica",
    body: (
      <>
        <h1>Principia Satirica</h1>
        <p>
          In Oyasumi la narrazione è libera, ma la <strong>matematica non si negozia</strong>: dadi, statistiche, costi
          delle Waza e regole di combattimento valgono per tutti allo stesso modo.
        </p>
        <p>
          Il Master arbitra la scena in chat; quando serve un tiro, lo chiede e lo esegue il giocatore. Niente
          &quot;fuffa&quot; che bypassa i numeri — è il patto che tiene in piedi il gioco per tutti gli invitati alla festa.
        </p>
        <p>La versione estesa sarà disponibile dalla guida in gioco.</p>
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
