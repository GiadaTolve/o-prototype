/**
 * Sorgente canonica Rin'gai — Oyasumi_Guida_Codifica_Ringai.md
 */

export type RingaiCatalogEntry = {
  slug: string;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string;
  poolName: string;
  flavor: string;
  meccanica: string;
  /** Tier waza (tabella waza); null = passiva senza tier. */
  tier?: number | null;
  tags?: string[];
  cs?: number;
  tempoQuarti?: number | null;
  skiruIr?: string[];
  effetti: unknown[];
  /** Note implementative da riportare nel riepilogo. */
  implementazioneNote?: string[];
};

function desc(kind: "passiva" | "attiva", flavor: string, meccanica: string): string {
  const header =
    kind === "passiva"
      ? "[Rin'gai · Passiva lignaggio]"
      : "[Rin'gai · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

const MACCHIE_NOTA =
  "Sistema macchie (sottosistema terreno non implementato): il Master traccia generazione, posizione, consumo e durata.";

const MACCHIATO_SPENDIBILE =
  "DA IMPLEMENTARE come status a stack spendibili nel pannello: counter consumabili per effetti (vedi nota Master). Per ora modellato come APPLICA_STATUS con stack variabile.";

export const RINGAI_CATALOG: RingaiCatalogEntry[] = [
  {
    slug: "zanei",
    nomeRomaji: "Zan'ei",
    nomeItaliano: "Traccia d'Ego",
    kanji: "残影",
    poolName: "Zan'ei (残影) — Traccia d'Ego",
    flavor: "Una sagoma eterea di Jigo-Ka, sempre un movimento in ritardo.",
    meccanica: "Passiva · CS 0. Sagoma residua (Costrutto Energetico) a ogni spostamento; waza solo tramite sagoma se distante dal corpo.",
    tier: null,
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Ogni spostamento lascia una sagoma residua (Costrutto Energetico) nel punto d'origine. Al movimento successivo la sagoma segue l'ultimo movimento (resta un passo indietro). Finché analista e sagoma sono in posizioni diverse, l'analista lancia waza SOLO attraverso la sagoma, non dal corpo. La sagoma è immune ai danni non psichici. In Trance Onirica: la sagoma torna all'analista, si fonde, inutilizzabile per la durata della trance.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Sagoma-costrutto + vincolo di lancio → solo Master (🔴)."],
  },
  {
    slug: "kegare",
    nomeRomaji: "Kegare",
    nomeItaliano: "Untore",
    kanji: "穢れ",
    poolName: "Kegare (穢れ) — Untore",
    flavor: "L'impronta che il terreno non riesce a smaltire.",
    meccanica:
      "Passiva · CS 0. Ogni waza genera una macchia 1,5 m (5 turni). Blocco lancio waza sopra macchia (eccetto Shoheki).",
    tier: null,
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo: `${MACCHIE_NOTA} Ogni waza lanciata genera una macchia larga 1,5 m sotto i piedi (sotto la sagoma di Zan'ei, se attiva). La macchia dura 5 turni. L'analista non può lanciare waza finché resta sopra una macchia, eccetto Shoheki.`,
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Sistema macchie → solo Nota Master (🔴)."],
  },
  {
    slug: "kokurui",
    nomeRomaji: "Kokurui",
    nomeItaliano: "Lacrime Nere",
    kanji: "黒涙",
    poolName: "Kokurui (黒涙) — Lacrime Nere",
    flavor: "La Jigo-Ka come pianto del mondo onirico.",
    meccanica:
      "Passiva · CS 0. Le waza Liquide infliggono Torpore, +1 tier resistenza, −2 CS (o −1 tier resistenza costrutto).",
    tier: null,
    effetti: [
      {
        tipo: "APPLICA_STATUS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        status: "torpore",
        stack: 1,
        nota_master: "Solo quando una waza Liquide dell'analista colpisce un bersaglio.",
      },
      {
        tipo: "MOD_RESISTENZA",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        delta_resistenza: 1,
        nota_master: "+1 tier di resistenza alle waza Liquide dell'analista (solidità Kongen / Scudo Genkai — Master arbitra il bersaglio).",
      },
      {
        tipo: "MOD_CS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "DRENA",
        quantita: { tipo: "FISSO", n: 2 },
        nota_master: "Quando le waza Liquide infliggono Torpore al bersaglio colpito.",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        testo:
          "Se il bersaglio del Torpore è un Costrutto, invece dei −2 CS gli togli 1 tier di resistenza (Kongen).",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "hando",
    nomeRomaji: "Handō",
    nomeItaliano: "Elastico",
    kanji: "反動",
    poolName: "Handō (反動) — Elastico",
    flavor: "Un costrutto richiamato torna ad alta velocità, come un elastico teso a rottura.",
    meccanica:
      "Attiva · [Proiettile][Personale] · Tier 2 · CS 2 · 1/4. Richiama Costrutto entro 12 m; danno lungo il ritorno.",
    tier: 2,
    tags: ["Proiettile"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["hansha", "goju", "kongen"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "LINEA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        area: { forma: "linea", profondita_m: 12 },
        nota_master: "Danno = tier a ciò che attraversa lungo la traiettoria di ritorno del costrutto.",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 1 },
        valore: { tipo: "TIER_DELTA", n: 1 },
        nota_master:
          "+1 tier alla prossima azione ogni 4 m percorsi dal costrutto richiamato (max +2 tier). Decade a fine turno.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo:
          "Richiama un proprio Costrutto entro 12 m verso di sé; assume la consistenza del costrutto richiamato (se Energetica, non subisce danni nel tragitto). Sticker [Personale] (tag non in vocabolario — tracciato a mano). Ignora il vincolo di Zan'ei (lanciabile dal corpo anche con sagoma altrove).",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Tag [Personale] assente dal vocabolario tag — descritto in nota Master."],
  },
  {
    slug: "magai-jigoku",
    nomeRomaji: "Magai Jigoku",
    nomeItaliano: "Inferno non così Onirico",
    kanji: "紛い地獄",
    poolName: "Magai Jigoku (紛い地獄) — Inferno non così Onirico",
    flavor: "Lame e artigli informi sbocciano dal terreno.",
    meccanica:
      "Attiva · [Liquido][Emanazione] · Tier 3 · CS 3 · 1/4. Area 6 m, altezza 3 m, danno = tier.",
    tier: 3,
    tags: ["Liquido", "Emanazione"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: ["hansha", "shodo"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "AREA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Liquido",
        area: { forma: "cerchio", raggio_m: 6 },
        nota_master: "Area 6 m attorno all'analista, altezza 3 m.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo: `${MACCHIE_NOTA} Genera anche una macchia sotto i piedi (Kegare). Con una macchia esistente entro 8 m, può usarla come origine: quella macchia scompare.`,
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "hedo",
    nomeRomaji: "Hedo",
    nomeItaliano: "Rigurgito della Psiche",
    kanji: "反吐",
    poolName: "Hedo (反吐) — Rigurgito della Psiche",
    flavor: "Un fiotto di energia psichica liquida, un cedimento controllato.",
    meccanica: "Attiva · [Liquido][Raggio] · Tier 2 · CS 2 · 1/4. Raggio 15 m, danno = tier al primo bersaglio.",
    tier: 2,
    tags: ["Liquido", "Raggio"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["hansha", "chiko"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "LINEA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Liquido",
        area: { forma: "linea", profondita_m: 15 },
        nota_master: "Danno = tier al primo bersaglio lungo il raggio (15 m).",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Durante il turno può muovere l'arto/testa per cambiare direzione (verticale, orizzontale, dritta). Genera 1 macchia ogni 10 m di gittata percorsa, lungo il tragitto.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "tamashii-no-hake",
    nomeRomaji: "Tamashii no Hake",
    nomeItaliano: "Spolverino dell'Anima",
    kanji: "魂の刷毛",
    poolName: "Tamashii no Hake (魂の刷毛) — Spolverino dell'Anima",
    flavor: "L'arma muta in pennello: fatto per raccogliere ciò che si è lasciato indietro.",
    meccanica:
      "Attiva · [Solido][Costrutto] · Tier 2 · CS 2 · 1/4 · dura 3 turni. Pennello Solido Media; carico da macchia.",
    tier: 2,
    tags: ["Solido", "Costrutto"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["hansha", "kongen", "kensei"],
    effetti: [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        taglia: "Media",
        consistenza: "Solido",
        comportamento: "STATICO",
        nota_master: "Pennello — arma contundente trasformata, Costrutto Solido.",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        nota_master:
          "+1 tier al prossimo danno mentre il pennello è carico (dopo assorbimento macchia). Stato carico: nota Master (macchie).",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo: `${MACCHIE_NOTA} Colpendo una propria macchia, questa sparisce e il pennello si carica. Da carico: dopo il colpo +1 tier, genera una macchia a 2 m oltre l'impatto, torna scarico.`,
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "yobimodoshi",
    nomeRomaji: "Yobimodoshi",
    nomeItaliano: "Richiamo dell'Essere",
    kanji: "呼び戻し",
    poolName: "Yobimodoshi (呼び戻し) — Richiamo dell'Essere",
    flavor: "Ogni macchia torna a casa; il corpo si riempie di ciò che aveva scartato.",
    meccanica:
      "Attiva · [Nessuna] · CS 2 · 1/4. Assorbe macchie entro 10 m → status Macchiato (counter = macchie).",
    tier: null,
    tags: ["Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["hansha", "itten-kokan", "juryoku-kokan", "shintai-kokan"],
    effetti: [
      {
        tipo: "APPLICA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        status: "macchiato",
        stack: 1,
        nota_master: `Counter = numero di macchie assorbite entro 10 m (variabile al lancio). Decade dopo 3 turni o a counter esauriti. ${MACCHIATO_SPENDIBILE}`,
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo: `${MACCHIE_NOTA} Richiama ogni macchia entro 10 m (non ne genera, anche con Kegare). Spesa counter Macchiato: 1 counter → rigenera 2 CS; 2 counter → Proiettile Liquido (tier 2, danno 8) per 12 m + macchia all'impatto; 5+ counter → Raggio Energetico (tier 4, danno 17) per 15 m.`,
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Macchiato a counter spendibili: DA IMPLEMENTARE nel pannello (banco di prova futuro).",
      "Skiru papabili Shinka no Nagare: itten-kokan, juryoku-kokan, shintai-kokan (no sochu-kokan — non implementata).",
    ],
  },
  {
    slug: "butto",
    nomeRomaji: "Buttō",
    nomeItaliano: "Bollore d'Ego",
    kanji: "沸騰",
    poolName: "Buttō (沸騰) — Bollore d'Ego",
    flavor: "Un cono di rabbia indistinta; una pentola che ha smesso di reggere il bollore.",
    meccanica:
      "Attiva · [Propagazione Conica][Liquido] · Tier 2 · CS 2 · 1/4. Cono 4×8 m, danno = tier, sbalzo 3 m.",
    tier: 2,
    tags: ["Propagazione Conica", "Liquido"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["hansha", "hikan"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "CONO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Liquido",
        area: { forma: "cono", profondita_m: 8 },
        nota_master: "Cono 4 m di apertura × 8 m di lunghezza.",
      },
      {
        tipo: "MOD_TRAIETTORIA",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "SPINGI",
        valore: { tipo: "FISSO", n: 3 },
        nota_master: "Sbalza i bersagli colpiti di 3 m nella direzione dell'attacco.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo: `${MACCHIE_NOTA} Con una macchia entro 8 m, può usarla come origine: la macchia scompare.`,
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kugutsushi",
    nomeRomaji: "Kugutsushi",
    nomeItaliano: "Marionettista del Dolore",
    kanji: "傀儡師",
    poolName: "Kugutsushi (傀儡師) — Marionettista del Dolore",
    flavor: "Una copia di sé in Jigo-Ka liquida: colpisce una volta e si scioglie.",
    meccanica:
      "Attiva · [Liquido][Costrutto] · Tier 2 · CS 2 · 1/4. Copia liquida, 1 attacco fino a 10 m.",
    tier: 2,
    tags: ["Liquido", "Costrutto"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["hansha", "kongen"],
    effetti: [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "ISTANTANEA" },
        taglia: "Media",
        consistenza: "Liquido",
        movimento_m: 10,
        attacchi_per_turno: 1,
        danno: { tipo: "TIER" },
        comportamento: "COMANDATO",
        nota_master:
          "Copia dell'analista in Jigo-Ka liquida; si lancia in una direzione, 1 attacco (danno = tier), fino a 10 m poi si dissolve.",
      },
      {
        tipo: "APPLICA_STATUS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        status: "macchiato",
        stack: 1,
        nota_master: "1 stack Macchiato al bersaglio vivente colpito dalla copia.",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo: `${MACCHIE_NOTA} Dissolvendosi genera una macchia sotto di sé. Con una macchia entro 8 m, può originare da essa: la macchia scompare.`,
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "uzu",
    nomeRomaji: "Uzu",
    nomeItaliano: "Purgatorio, il Mulinello",
    kanji: "渦",
    poolName: "Uzu (渦) — Purgatorio, il Mulinello",
    flavor: "Un mulinello che si stringe quarto dopo quarto fino a esplodere.",
    meccanica:
      "Attiva · [Emanazione][Liquido] · CS 1 per quarto (fino a 4/4). Mulinello 6 m a stadi progressivi.",
    tier: null,
    tags: ["Emanazione", "Liquido"],
    cs: 1,
    tempoQuarti: 4,
    skiruIr: ["hansha", "shodo"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "1/4: attrae tutto verso l'origine per 2 m; danno tier 1 (4). 2/4: sposta i bersagli in senso orario/antiorario per 3 m; danno tier 2 (8). 3/4: schiaccia i bersagli; danno tier 3 (12) + applica Macchiato. 4/4: esplode, danno tier 4 (17), sbalza ogni bersaglio 5 m verso l'esterno.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Modifica traiettoria per stadio: attrazione (1/4), rotazione (2/4), schiacciamento (3/4), sbalzo esplosivo 5 m (4/4). Ogni stadio richiede IR più alto del precedente per essere contrastato.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo: `${MACCHIE_NOTA} Ogni macchia nella gittata potenzia i danni e rende più difficile uscire; per ogni macchia assorbita, può infliggere Macchiato a un bersaglio. A fine waza genera tante macchie quanti i quarti usati, equidistanti.`,
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Waza multi-quarto a stadi: DIFFERITO non modellato (nessun esempio in catalogo) — stadi in Nota Master (🔴).",
      "DA IMPLEMENTARE: DIFFERITO o motore quarti-progressivi per danno tier 1→4 automatico.",
    ],
  },
];

export function ringaiDescrizione(entry: RingaiCatalogEntry): string {
  const kind = entry.cs != null && entry.cs > 0 ? "attiva" : "passiva";
  return desc(kind, entry.flavor, entry.meccanica);
}

export function allRingaiImplementazioneNotes(): string[] {
  const notes: string[] = [];
  for (const e of RINGAI_CATALOG) {
    for (const n of e.implementazioneNote ?? []) {
      if (!notes.includes(n)) notes.push(n);
    }
  }
  return notes;
}
