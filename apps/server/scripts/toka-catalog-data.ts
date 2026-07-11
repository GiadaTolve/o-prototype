/**
 * Sorgente canonica Tōka-dō — guida codifica allineata (Giocattolo / Giocattolaio inclusi).
 */

export type TokaCatalogEntry = {
  slug: string;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string;
  poolName: string;
  flavor: string;
  meccanica: string;
  tier?: number | null;
  tags?: string[];
  cs?: number;
  tempoQuarti?: number | null;
  skiruIr?: string[];
  effetti: unknown[];
  implementazioneNote?: string[];
};

/** Papabile-arma: il PG sceglie quella coerente col Tōrō (lama / fuoco / improvvisata). */
const PAPABILE_ARMA = ["kensei", "jusei", "kenka-o"] as const;

function desc(kind: "passiva" | "attiva", flavor: string, meccanica: string): string {
  const header =
    kind === "passiva" ? "[Tōka-dō · Passiva lignaggio]" : "[Tōka-dō · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

export const TOKA_CATALOG: TokaCatalogEntry[] = [
  {
    slug: "toro-lanterna-incisa",
    nomeRomaji: "Tōrō",
    nomeItaliano: "Lanterna Incisa",
    kanji: "灯籠",
    poolName: "Tōrō (灯籠) — Lanterna Incisa",
    flavor:
      "La Jigo-Ka cola dal terzo occhio fino al palmo e affonda nell'oggetto stretto in pugno: legno, acciaio o vetro si accendono di una brace interna che solo l'analista vede.",
    meccanica:
      "Passiva · CS 0. Designi un'arma o un oggetto impugnato come Tōrō. Finché lo tocchi, non può essere bersaglio di waza di Manipolazione o Trasformazione altrui, e funge da origine per lanciare le tue waza.",
    tier: null,
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Designi un'arma/oggetto impugnato come Tōrō (Arma Psichica). Finché lo tocchi: (1) non bersagliabile da Manipolazione/Trasformazione altrui; (2) funge da origine per lanciare le tue waza.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Keystone Tōrō — vincoli costrutto/origine → Master (sagoma-costrutto non modellato)."],
  },
  {
    slug: "michishirube-luce-guida",
    nomeRomaji: "Michishirube",
    nomeItaliano: "Luce Guida",
    kanji: "道標",
    poolName: "Michishirube (道標) — Luce Guida",
    flavor:
      "La fiamma non scalda soltanto: indica. Punti il Tōrō e la luce traccia nell'aria la via che il colpo dovrà percorrere.",
    meccanica:
      "Passiva · CS 0. Impugnando il Tōrō, le waza [Energetica][Contatto] diventano [Energetica][Proiettile] con origine dal Tōrō. Gittata = 8 m + 1 m per punto di Seimitsu.",
    tier: null,
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "PRE_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "categoria",
        da_tag: "Contatto",
        a_tag: "Proiettile",
        oggetto: "WAZA_PROPRIA",
        condizione: "toro.lanciata == true",
        nota_master: "Solo waza proprie [Energetica][Contatto]; origine dal Tōrō usato per mirare.",
        effetti_collaterali: [
          {
            tipo: "MOD_GITTATA",
            valore: { tipo: "FORMULA", base: 8, skiru: "Seimitsu", per_punto: 1 },
          },
        ],
      },
    ],
  },
  {
    slug: "shoka-fiamma-docile",
    nomeRomaji: "Shōka",
    nomeItaliano: "Fiamma Docile",
    kanji: "小火",
    poolName: "Shōka (小火) — Fiamma Docile",
    flavor:
      "Chi conosce la propria fiamma non la spreca. L'analista la piega, la addomestica, la fa bruciare lenta.",
    meccanica: "Passiva · CS 0. Ogni waza lanciata attraverso il Tōrō costa −1 CS, minimo 1.",
    tier: null,
    effetti: [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_COSTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        delta_cs: -1,
        minimo_cs: 1,
        condizione: "toro.lanciata == true",
      },
    ],
  },
  {
    slug: "nokuribi-fuoco-residuo",
    nomeRomaji: "Nokuribi",
    nomeItaliano: "Fuoco Residuo",
    kanji: "残り火",
    poolName: "Nokuribi (残り火) — Fuoco Residuo",
    flavor:
      "Quando la fiamma elementale si spegne, qualcosa resta aggrappato al vetro: una brace che non vuole morire.",
    meccanica:
      "Passiva · CS 0. Il Tōrō trattiene il residuo dell'ultima waza Elementale fino a fine turno successivo; waza Energetiche dal Tōrō diventano Elementali (status di riferimento), poi l'arma perde l'elemento.",
    tier: null,
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Il Tōrō trattiene il residuo dell'ultima waza Elementale fino alla fine del turno successivo. Finché l'elemento permane, ogni waza Energetica lanciata dal Tōrō diventa Elementale (applica lo status di riferimento); applicato l'effetto, l'arma perde l'elemento.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Residuo elementale tra waza → motore eventi assente, solo Master."],
  },
  {
    slug: "kintsugi-legame-dei-frammenti",
    nomeRomaji: "Kintsugi",
    nomeItaliano: "Legame dei Frammenti",
    kanji: "金継ぎ",
    poolName: "Kintsugi (金継ぎ) — Legame dei Frammenti",
    flavor:
      "Nulla, sotto la mano dell'analista, è davvero rotto. Le crepe si riempiono d'oro-Ego e ciò che era spezzato torna intero.",
    meccanica:
      "Passiva · CS 0. Richiami la Jigo-Ka di un oggetto rotto o Costrutto distrutto nel turno precedente, ricreandolo fino a fine turno prossimo. Non ciò distrutto da energia psichica.",
    tier: null,
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Richiami la Jigo-Ka di un oggetto rotto o di un Costrutto distrutto nel turno precedente, ricreandolo; dura fino a fine turno prossimo. Non è ricostruibile ciò distrutto da energia psichica.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kakucho-espansione-della-luce",
    nomeRomaji: "Kakuchō",
    nomeItaliano: "Espansione della Luce",
    kanji: "拡張",
    poolName: "Kakuchō (拡張) — Espansione della Luce",
    flavor:
      "La luce non conosce confini di forma. Trabocca dal filo della lama e la fa crescere — il coltello si fa spada, la spada si fa zanna.",
    meccanica:
      "Attiva · [Potenziamento][Nessuna] · Tier 1 · CS 1 · 1/4. +1 tier danno e +1 m gittata ai colpi a Contatto col Tōrō per 1 turno. Il Tōrō sale di una taglia (mantiene il tipo di danno); se è già un Tōrō, dura l'intero turno.",
    tier: 1,
    tags: ["Potenziamento", "Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: [...PAPABILE_ARMA, "seimitsu"],
    effetti: [
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 1 },
        valore: { tipo: "TIER_DELTA", n: 1 },
        filtro_waza: { tag: ["Contatto"] },
        nota_master: "+1 tier ai colpi a Contatto col Tōrō; +1 m gittata (stessa durata).",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Il Tōrō sale di una taglia (mantiene il tipo di danno). Se è già un Tōrō designato, l'effetto dura l'intero turno.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "hoshutsu-rilascio-della-fiamma",
    nomeRomaji: "Hōshutsu",
    nomeItaliano: "Rilascio della Fiamma",
    kanji: "放出",
    poolName: "Hōshutsu (放出) — Rilascio della Fiamma",
    flavor:
      "Tutto ciò che la lanterna ha trattenuto, in un solo respiro, fuori. Il vetro si frantuma e la fiamma divampa in avanti.",
    meccanica:
      "Attiva · [Propagazione Conica][Energetica] · Tier 2 · CS 2 · 1/4. Cono 6 m, danno = tier. Con carica Tōrō: +1 tier ma l'arma si disintegra (no disintegrazione da grado Sentatsu Bunsekikan).",
    tier: 2,
    tags: ["Propagazione Conica", "Energetica"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: [...PAPABILE_ARMA, "seimitsu"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "CONO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Energetica",
        area: { forma: "cono", profondita_m: 6 },
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        condizione: "toro.batteria == true",
        nota_master: "Solo se il Tōrō ha carica (batteria) al lancio.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "toro.batteria == true",
        testo:
          "Con carica Tōrō: +1 tier (già applicato) ma l'arma si disintegra — dal grado Sentatsu Bunsekikan la disintegrazione non avviene più.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Eccezione disintegrazione a Sentatsu Bunsekikan: condizione grado >= non valutata in sandbox (verifica Master).",
    ],
  },
  {
    slug: "ukabu-toro-lanterna-fluttuante",
    nomeRomaji: "Ukabu Tōrō",
    nomeItaliano: "Lanterna Fluttuante",
    kanji: "浮かぶ灯籠",
    poolName: "Ukabu Tōrō (浮かぶ灯籠) — Lanterna Fluttuante",
    flavor:
      "L'analista scioglie l'ormeggio. La lanterna si stacca dalla mano e galleggia, obbedendo solo al pensiero.",
    meccanica:
      "Attiva · [Costrutto] · Tier 2 · CS 2 · 1/4 + mantenimento. Tōrō levita (Media), danno = tier, 3 turni, controllo 8 m, sale 2 m, comandato. Oltre 8 m cade; poi torna oggetto.",
    tier: 2,
    tags: ["Costrutto"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: [...PAPABILE_ARMA, "kongen"],
    effetti: [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        taglia: "Media",
        consistenza: "Energetica",
        danno: { tipo: "TIER" },
        gittata_controllo_m: 8,
        attacchi_per_turno: 1,
        comportamento: "COMANDATO",
        proprieta: ["TORO"],
        toro_da_arma: true,
        nota_master:
          "Il Tōrō levita fino a 2 m; oltre 8 m dalla connessione cade. Dopo 3 turni torna oggetto.",
      },
    ],
  },
  {
    slug: "fuin-no-hi-sigillo-della-fiamma",
    nomeRomaji: "Fuin no Hi",
    nomeItaliano: "Sigillo della Fiamma",
    kanji: "封印の火",
    poolName: "Fuin no Hi (封印の火) — Sigillo della Fiamma",
    flavor:
      "Una fiamma chiusa nel vetro non muore: aspetta. Il momento del rilascio sarà una sorpresa scritta nel silenzio.",
    meccanica:
      "Attiva · [Nessuna] · Tier 2 · CS 2 · 1/4. Sigilli una waza nel Tōrō per 3 turni; 3 rilasci (impatto / a comando / scadenza).",
    tier: 2,
    tags: ["Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: [...PAPABILE_ARMA, "seimitsu"],
    effetti: [
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        finestra_turni: 3,
        nota_master: "Waza sigillata scelta e lanciata dal giocatore al momento del sigillo.",
        rilasci: {
          impatto: {
            tipo: "MANUALE",
            trigger: "ALL_IMPATTO",
            testo:
              "Impatto: la waza sigillata si libera colpendo il bersaglio. Danno pari alla waza sigillata.",
            mostra_a: "MASTER",
          },
          a_comando: {
            tipo: "MANUALE",
            trigger: "A_COMANDO",
            testo:
              "Fendente nell'etere: [Proiettile][Energetico] con le proprietà della waza sigillata (grandezza e gittata originali).",
            mostra_a: "MASTER",
          },
          scadenza: {
            tipo: "MANUALE",
            trigger: "A_SCADENZA",
            testo:
              "Scadenza: il Tōrō si rompe in [Energetica][Emanazione]; danno pari alla waza sigillata.",
            mostra_a: "MASTER",
          },
        },
      },
    ],
  },
  {
    slug: "kyomei-risonanza-della-fiamma",
    nomeRomaji: "Kyōmei",
    nomeItaliano: "Risonanza della Fiamma",
    kanji: "共鳴",
    poolName: "Kyōmei (共鳴) — Risonanza della Fiamma",
    flavor:
      "L'arma e le braccia vibrano sulla stessa nota. Ogni passo diventa un fendente che non smette mai di cantare.",
    meccanica:
      "Attiva · [Contatto] · Tier 2 · CS 2 · 1/4. Per 1 turno, durante il movimento il Tōrō colpisce i nemici a gittata corpo a corpo lungo il percorso (danno = tier). Un colpo ogni 2 m percorsi.",
    tier: 2,
    tags: ["Contatto"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: [...PAPABILE_ARMA, "undo"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "SU_MOVIMENTO",
        bersaglio: "LINEA",
        durata: { tipo: "TURNI", n: 1 },
        valore: { tipo: "TIER" },
        consistenza: "Energetica",
        nota_master:
          "Durante il movimento: danno = tier ai nemici a gittata corpo a corpo lungo il percorso.",
      },
      {
        tipo: "MANUALE",
        trigger: "SU_MOVIMENTO",
        testo:
          "Un colpo ogni 2 m percorsi (scala col Movimento). Non puoi mirare a punti vitali.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "omocha-il-giocattolo",
    nomeRomaji: "Omocha",
    nomeItaliano: "Giocattolo",
    kanji: "玩具",
    poolName: "Omocha (玩具) — Giocattolo",
    flavor:
      "La fiamma non distingue più tra un'arma forgiata e un tubo di ferro raccolto da terra — tutto, in pugno all'analista, diventa Tōrō.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · Tier 3 · CS 3 · 1/4 · 3 turni · grado Sentatsu Bunsekikan [SB]. Qualsiasi oggetto impugnato diventa Tōrō. Sovraccarico: waza dal Tōrō → esplosione Energetica raggio 3 m al prossimo impatto/lancio.",
    tier: 3,
    tags: ["Nessuna", "Potenziamento"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: [...PAPABILE_ARMA, "seimitsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "grado_pg >= Sentatsu Bunsekikan",
        testo:
          "Requisito: grado Sentatsu Bunsekikan [SB] o superiore. Per 3 turni, qualsiasi oggetto fisico impugnato diventa Tōrō (Arma Psichica) — anche senza la passiva Tōrō. Mantiene proprietà fisiche; cambiando oggetto nel turno, il precedente perde lo stato di Tōrō ed è distrutto.",
        mostra_a: "MASTER",
      },
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        finestra_turni: 3,
        condizione: "toro.lanciata == true",
        nota_master:
          "Sovraccarico Omocha: quando lanci una waza attraverso il Tōrō durante i 3 turni.",
        rilasci: {
          impatto: {
            tipo: "DANNO",
            trigger: "ALL_IMPATTO",
            bersaglio: "AREA",
            durata: { tipo: "ISTANTANEA" },
            valore: { tipo: "TIER" },
            consistenza: "Energetica",
            area: { forma: "cerchio", raggio_m: 3 },
            nota_master: "[Propagazione][Energetica] raggio 3 m; oggetto-Tōrō consumato.",
          },
          a_comando: {
            tipo: "MANUALE",
            trigger: "PRE_LANCIO",
            testo:
              "Al lancio della waza successiva attraverso lo stesso Tōrō: esplosione [Propagazione][Energetica] raggio 3 m, danno = tier; oggetto consumato.",
            mostra_a: "MASTER",
          },
        },
      },
    ],
    implementazioneNote: [
      "grado_pg >= Sentatsu Bunsekikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Sovraccarico Omocha: modulo domain toka/omocha.ts per stato runtime.",
    ],
  },
  {
    slug: "gangushi-il-giocattolaio",
    nomeRomaji: "Gangushi",
    nomeItaliano: "Giocattolaio",
    kanji: "玩具師",
    poolName: "Gangushi (玩具師) — Giocattolaio",
    flavor:
      "Non serve più la mano. Ciò che l'analista porta con sé si accende all'unisono: ogni oggetto addosso diventa Tōrō insieme.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · Tier 4 · CS 3 · 1/4 · grado Kanteikan [K]. Per la durata della waza, ogni oggetto posseduto da prima del combattimento (addosso/inventario) diventa Tōrō senza impugnarlo.",
    tier: 4,
    tags: ["Nessuna", "Potenziamento"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: [...PAPABILE_ARMA, "seimitsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "grado_pg >= Kanteikan",
        testo:
          "Requisito: grado Kanteikan [K] o superiore. Per la durata della waza, ogni oggetto posseduto da prima del combattimento (addosso/in tasca/inventario) diventa Tōrō (Arma Psichica) senza impugnarlo — deve restare addosso. Evoluzione di Giocattolo: da un oggetto in pugno a tutto l'equipaggiamento a mani libere.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Kanteikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Stato runtime equipaggiamento-Tōrō: domain toka/gangushi.ts.",
    ],
  },
];

export function tokaDescrizione(entry: TokaCatalogEntry): string {
  const kind = entry.cs != null && entry.cs > 0 ? "attiva" : "passiva";
  return desc(kind, entry.flavor, entry.meccanica);
}

export function allTokaImplementazioneNotes(): string[] {
  const notes: string[] = [];
  for (const e of TOKA_CATALOG) {
    for (const n of e.implementazioneNote ?? []) {
      if (!notes.includes(n)) notes.push(n);
    }
  }
  return notes;
}
