"use client";

import {
  ChatWazaResolutionPost,
  type WazaResolutionPostData,
} from "@/components/dashboard/chat-combat/ChatWazaResolutionPost";
import {
  ChatConstructResolutionPost,
  type ConstructResolutionPostData,
} from "@/components/dashboard/chat-combat/ChatConstructResolutionPost";

/** Mock statico — waza offensiva che entra (Hōshutsu T2, +1 Tier, scudo parziale). */
export const MOCK_WAZA_HIT: WazaResolutionPostData = {
  characterName: "Ren Kazehara",
  descrizione:
    "[Raggio][Energetica] · T2 · CS 3. Un fascio concentrato di Jigo-Ka che perfora la difesa a distanza.",
  wazaRomaji: "Hōshutsu",
  wazaItaliano: "Esplosione radiante",
  toroArma: "Raiden",
  papabili: [
    { label: "Kashin", rank: 5 },
    { label: "Kōsen", rank: 4 },
  ],
  irFinale: 9,
  dannoLordo: 12,
  /** In sintesi: lordo finché lo Shinigami non dichiara entrato; nel mock post-verdetto si può mostrare inflitto. */
  dannoFinale: 12,
  expanded: {
    irBase: { skiruA: "Kashin", valA: 5, skiruB: "Kōsen", valB: 4, media: 4.5 },
    irModifiers: [
      { label: "Combo Shōdō", value: 2 },
      { label: "Artefatto · Lente d'iride", value: 1 },
      { label: "Potenziamento Jikai", value: 1.5 },
    ],
    irDifesa: 7,
    dannoTier: { tier: 2, valore: 8 },
    dannoModifiers: [{ label: "[+1 Tier]", value: 4 }],
    filtroDifesa: {
      lordo: 12,
      scudo: 4,
      dopoScudo: 8,
      itami: 3,
      mitigazionePct: 9,
      finale: 7,
    },
    statusAttivi: ["Potenziamento Jikai", "Vertigini (bersaglio)", "Scudo Genkai attivo"],
  },
};

/** Mock statico — stessi numeri, senza filtro: lo Shinigami dichiara mancato in narrativa. */
export const MOCK_WAZA_MISS: WazaResolutionPostData = {
  characterName: "Mira Okada",
  descrizione:
    "[Contatto][Solido] · T2 · CS 2. Un artiglio d'ombra che colpisce in mischia se il confronto IR è favorevole.",
  wazaRomaji: "Kage no Tsume",
  wazaItaliano: "Artiglio d'ombra",
  papabili: [
    { label: "Gōjin", rank: 3 },
    { label: "Hikan", rank: 2 },
  ],
  irFinale: 6,
  dannoLordo: 8,
  dannoFinale: 8,
  expanded: {
    irBase: { skiruA: "Gōjin", valA: 3, skiruB: "Hikan", valB: 2, media: 2.5 },
    irModifiers: [
      { label: "Buff Undō (bersaglio schiva)", value: 1 },
      { label: "Malus torpore", value: -1 },
      { label: "Oggetto · Mantello nebbia", value: 3 },
    ],
    irDifesa: 8,
    dannoTier: { tier: 2, valore: 8 },
    dannoModifiers: [],
    statusAttivi: ["Torpore (attaccante)", "Evasione Hikan (bersaglio)"],
  },
};

/** Mock statico — Ukabu Tōrō, taglia Media, sticker Tōrō. */
export const MOCK_CONSTRUCT: ConstructResolutionPostData = {
  nome: "Ukabu Tōrō",
  dannoMedio: 8,
  movimentoM: 6,
  taglia: "Media",
  hpCurrent: 18,
  hpMax: 24,
  stickers: ["Tōrō"],
  expanded: {
    bonusMalus: [
      { label: "Resistenza Kongen", value: "+2 tier" },
      { label: "Undō creatore", value: "8 m/quarto × 0,75 (Media) = 6 m/quarto" },
      { label: "Consistenza", value: "Energetica" },
    ],
    note: "Allegato all'azione del creatore fino a distruzione o dissoluzione.",
  },
};

type PreviewMessage = {
  id: string;
  actor: string;
  time: string;
  narrative?: string;
  /** Dichiarazione umana (Shinigami) — separata dalla card meccanica. */
  masterVerdict?: string;
  waza?: WazaResolutionPostData;
  construct?: ConstructResolutionPostData;
};

const PREVIEW_MESSAGES: PreviewMessage[] = [
  {
    id: "1",
    actor: "Ren Kazehara",
    time: "14:32",
    narrative: "L'aria si incendia in un cono di luce.",
    masterVerdict: "— Shinigami (Yuki): Entrato.",
    waza: MOCK_WAZA_HIT,
  },
  {
    id: "2",
    actor: "Ren Kazehara",
    time: "14:32",
    narrative: "Una lanterna fluttuante si stacca dal palmo, orbitando a sei metri.",
    construct: MOCK_CONSTRUCT,
  },
  {
    id: "3",
    actor: "Mira Okada",
    time: "14:33",
    narrative: "L'ombra si allunga verso il fianco del bersaglio.",
    masterVerdict: "— Shinigami (Yuki): Mancato.",
    waza: MOCK_WAZA_MISS,
  },
];

export function ChatResolutionPostsPreview() {
  return (
    <div className="chat-resolution-preview">
      <header className="chat-resolution-preview__header">
        <p className="chat-resolution-preview__eyebrow">Mockup statico · Step 1</p>
        <h1 className="chat-resolution-preview__title">Post waza e costrutto in chat</h1>
        <p className="chat-resolution-preview__lead">
          Una riga compatta per waza: personaggio · nome waza · IR · Danno. Hover sulla waza per la
          descrizione; <strong>[+]</strong> per Skiru, papabili e calcoli. Entrato/Mancato resta
          voce Shinigami. Viewport 380 px.
        </p>
      </header>

      <div className="chat-resolution-preview__frame" aria-label="Anteprima chat 380px">
        <div className="chat-resolution-preview__chat">
          {PREVIEW_MESSAGES.map((msg) => (
            <div key={msg.id} className="chat-resolution-preview__message">
              <div className="chat-resolution-preview__message-head">
                <span className="chat-resolution-preview__time">{msg.time}</span>
                {!msg.waza ? (
                  <span className="chat-resolution-preview__actor">{msg.actor}</span>
                ) : null}
              </div>
              {msg.narrative ? (
                <p className="chat-resolution-preview__narrative">{msg.narrative}</p>
              ) : null}
              {msg.waza ? <ChatWazaResolutionPost data={msg.waza} /> : null}
              {msg.construct ? <ChatConstructResolutionPost data={msg.construct} /> : null}
              {msg.masterVerdict ? (
                <p className="chat-resolution-preview__master-verdict">{msg.masterVerdict}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
