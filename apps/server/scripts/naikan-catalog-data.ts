/**
 * Sorgente canonica Naikan-dō — guida codifica allineata (17 waza).
 * 6 passive · 11 attive · 3 di grado (Shokushin [SB], Kōmei [K], Hōgō [S]).
 */

export type NaikanCatalogEntry = {
  slug: string;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string;
  flavor: string;
  meccanica: string;
  tier?: number | null;
  tags?: string[];
  cs?: number;
  tempoQuarti?: number | null;
  skiruIr?: string[];
  scelteAlLancio?: Array<{ id: string; label: string }>;
  effetti: unknown[];
  implementazioneNote?: string[];
};

function desc(kind: "passiva" | "attiva", flavor: string, meccanica: string): string {
  const header =
    kind === "passiva"
      ? "[Naikan-dō · Passiva lignaggio]"
      : "[Naikan-dō · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

export function naikanDescrizione(e: NaikanCatalogEntry): string {
  const kind = e.tempoQuarti != null ? "attiva" : "passiva";
  return desc(kind, e.flavor, e.meccanica);
}

export function allNaikanImplementazioneNotes(): string[] {
  return NAIKAN_CATALOG.flatMap((e) => e.implementazioneNote ?? []);
}

export const NAIKAN_CATALOG: NaikanCatalogEntry[] = [
  // ─── PASSIVE ───────────────────────────────────────────────────────────────

  {
    slug: "junno-pelle-apprende",
    nomeRomaji: "Junnō",
    nomeItaliano: "Pelle che Apprende",
    kanji: "順応",
    flavor:
      "La Jigo-Ka non oppone resistenza al colpo che la attraversa: lo assorbe, lo cataloga e rimodella il confine in anticipo rispetto al prossimo.",
    meccanica:
      "Passiva · CS 0. Ogni volta che subisci un colpo, la tua Resistenza guadagna un bonus pari al tier di quel colpo contro la Consistenza dell'attacco appena ricevuto. La nuova Consistenza sovrascrive la precedente.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MOD_RESISTENZA",
        trigger: "QUANDO_SUBISCI_DANNO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "FINO_A_CONDIZIONE", condizione_fine: "prossimo colpo ricevuto di consistenza diversa" },
        delta_resistenza: 1,
        filtro_consistenza: "ultima_subita",
        nota_master:
          "Valore reale = tier del colpo subìto (non +1 fisso). La nuova Consistenza sovrascrive la precedente; usa il tier come valore di Resistenza verso quella Consistenza.",
      },
      {
        tipo: "MANUALE",
        trigger: "QUANDO_SUBISCI_DANNO",
        testo:
          "Junnō: al colpo ricevuto, guadagni Resistenza = tier di quel colpo contro la sua Consistenza. La Consistenza protetta sovrascrive quella precedente.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Junnō — valore MOD_RESISTENZA dipende dal tier del colpo subìto (TIER_COLPO_SUBITO); il campo delta_resistenza è un placeholder → Master gestisce il valore reale.",
    ],
  },

  {
    slug: "hibiki-gaeshi-eco-risposta",
    nomeRomaji: "Hibiki-Gaeshi",
    nomeItaliano: "Eco di Risposta",
    kanji: "響き返し",
    flavor:
      "Il corpo impara la frequenza del colpo nemico e la rimanda indietro: l'analista non imita il bersaglio, lo supera con la sua stessa lingua.",
    meccanica:
      "Passiva · CS 0. Le tue waza con la stessa Consistenza dell'ultimo colpo che hai subìto guadagnano un bonus al danno pari al tier di quel colpo. Cambia automaticamente quando cambia la Consistenza subita.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "QUANDO_SUBISCI_DANNO",
        testo:
          "Hibiki-Gaeshi: le tue waza con la stessa Consistenza dell'ultimo colpo ricevuto guadagnano danno extra pari al tier di quel colpo. L'effetto cambia automaticamente al prossimo colpo di Consistenza diversa.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Hibiki-Gaeshi — filtro per Consistenza dell'ultimo colpo non esprimibile in schema; Master applica il bonus manualmente.",
    ],
  },

  {
    slug: "jiga-hoki-ego-traboccante",
    nomeRomaji: "Jiga-Hōki",
    nomeItaliano: "Ego Traboccante",
    kanji: "自我放棄",
    flavor:
      "La Jigo-Ka non rimane nel corpo: tracima, cerca superficie di contatto, si apre verso l'esterno. L'analista smette di essere un sistema chiuso.",
    meccanica:
      "Passiva · CS 0 · richiede almeno 1 stack di qualsiasi status. I tuoi Potenziamento durano +1 turno. Puoi trasferire un Potenziamento a un Costrutto che tocchi (max 1); il trasferimento persiste fino al distacco, poi decade a fine turno.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(status_qualsiasi) >= 1",
        testo:
          "Jiga-Hōki (condizione: ≥1 stack di qualsiasi status): i tuoi Potenziamento durano +1 turno rispetto alla durata normale.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        condizione: "stack(status_qualsiasi) >= 1",
        testo:
          "L'arma impugnata conta come Costrutto. Puoi trasferire un Potenziamento a un Costrutto (max 1) finché lo tocchi; al distacco permane fino a fine turno.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Jiga-Hōki — condizione status_qualsiasi >= 1 e +1 turno durata Potenziamento → Master (🔴 logica su durata buff).",
    ],
  },

  {
    slug: "ittai-un-solo-corpo",
    nomeRomaji: "Ittai",
    nomeItaliano: "Un Solo Corpo",
    kanji: "一体",
    flavor:
      "Il sistema non è separato dall'ambiente: il Depotenziamento che tenta di isolare un nodo trova invece un'intera rete disposta ad assorbirlo.",
    meccanica:
      "Passiva · CS 0. Ogni Depotenziamento su di te dura −1 turno (min 1). Mentre sei depotenziato, puoi estendere il malus a un Costrutto avversario che tocchi (max 1); il malus permane fino a fine tuo turno, tu mantieni il tuo.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "QUANDO_SUBISCI_STATUS",
        testo:
          "Ittai: ogni Depotenziamento ricevuto dura −1 turno (minimo 1 turno).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Mentre sei depotenziato, puoi estendere il malus a un Costrutto avversario che tocchi (max 1 costrutto). Il Costrutto mantiene il malus fino a fine tuo turno; tu mantieni il tuo.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Ittai — riduzione durata Depotenziamento e trasferimento malus a Costrutto → Master (🔴 logica su durata debuff).",
    ],
  },

  {
    slug: "naka-kae-scambio-nucleo",
    nomeRomaji: "Naka-Kae",
    nomeItaliano: "Scambio del Nucleo",
    kanji: "中替え",
    flavor:
      "Il nucleo non è fisso: l'analista lo estrae e lo sostituisce mentre il sistema gira ancora, come cambiare l'anima di un congegno in moto.",
    meccanica:
      "Passiva · CS 0. Durante una tua waza Potenziamento, puoi sostituire la Skiru potenziata con un'altra. La durata del Potenziamento si riduce di 2 turni.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo:
          "Naka-Kae: durante una tua waza Potenziamento, puoi sostituire la Skiru potenziata con un'altra. La durata del Potenziamento si riduce di 2 turni.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Naka-Kae — sostituzione Skiru attiva durante Potenziamento → Master (🔴).",
    ],
  },

  {
    slug: "tobi-kake-slancio-carica",
    nomeRomaji: "Tobi-Kake",
    nomeItaliano: "Slancio in Carica",
    kanji: "飛び駆け",
    flavor:
      "Il movimento non precede il colpo: è già il colpo. Il corpo diventa proiettile e tutto ciò che la Jigo-Ka porta con sé scarica nell'impatto.",
    meccanica:
      "Passiva · CS 0. Se nel turno hai percorso ≥ doppio del tuo Movimento, la tua prossima waza a [Contatto] guadagna +1 tier di danno. 1/turno; l'effetto decade a fine turno se non usato.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MOD_DANNO",
        trigger: "SU_MOVIMENTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "FINO_A_CONDIZIONE", condizione_fine: "usata una waza Contatto o fine turno" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        filtro_waza: { tag: ["Contatto"] },
        condizione: "metri_percorsi >= movimento*2",
        nota_master:
          "Tobi-Kake: +1 tier alla prossima waza a [Contatto] se hai percorso ≥ doppio del Movimento nel turno. 1/turno; decade a fine turno.",
      },
    ],
  },

  // ─── ATTIVE ────────────────────────────────────────────────────────────────

  {
    slug: "datsui-tate-scudo-spogliato",
    nomeRomaji: "Datsui-Tate",
    nomeItaliano: "Lo Scudo Spogliato",
    kanji: "脱衣盾",
    flavor:
      "L'analista spoglia i propri nodi di tutto ciò che li gonfiava e trasforma quella resa in muro: ogni Potenziamento sacrificato diventa uno strato di barriera.",
    meccanica:
      "Attiva · [Scudo][Energetica] · CS 2 · 1 turno. Rimuovi tutti i tuoi Potenziamento attivi: la somma dei Bun diventa Resistenza dello Scudo. Il turno seguente non puoi ricevere Potenziamento.",
    tier: 2,
    tags: ["Scudo", "Energetica"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["itami", "konjou"],
    effetti: [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "RIMUOVI",
        status_da: "Potenziamento",
        nota_master: "Rimuovi tutti i Potenziamento attivi (tutti gli stack, tutte le Skiru).",
      },
      {
        tipo: "SCUDO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 1 },
        resistenza_scudo: { tipo: "SOMMA_BOOST" },
        nota_master:
          "Resistenza Scudo = somma dei Bun sacrificati dai Potenziamento rimossi.",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo: "Il turno seguente non puoi ricevere Potenziamento.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Datsui-Tate — 'tutti i Potenziamento' come singolo MANIPOLA_STATUS; il motore applica RIMUOVI su tutti gli slot attivi.",
    ],
  },

  {
    slug: "datsui-yumi-arco-spogliato",
    nomeRomaji: "Datsui-Yumi",
    nomeItaliano: "L'Arco Spogliato",
    kanji: "脱衣弓",
    flavor:
      "I Potenziamento non muoiono: si comprimono, si concentrano e vengono lanciati fuori dal corpo come frecce di Jigo-Ka pura.",
    meccanica:
      "Attiva · [Proiettile][Energetica] · CS 2 · istantanea. Richiede ≥1 Potenziamento attivo. Rimuovi tutti i tuoi Potenziamento e lancia un Proiettile (15 m) il cui danno = somma dei Bun sacrificati. Il turno seguente non puoi ricevere Potenziamento.",
    tier: 2,
    tags: ["Proiettile", "Energetica"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["itami", "goju", "seimitsu"],
    effetti: [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "RIMUOVI",
        status_da: "Potenziamento",
        condizione: "stack(Potenziamento) >= 1",
        nota_master: "Rimuovi tutti i Potenziamento attivi (tutti gli stack, tutte le Skiru). Richiede ≥1 Potenziamento.",
      },
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "SOMMA_BOOST" },
        consistenza: "Energetica",
        nota_master: "Danno = somma dei Bun sacrificati dai Potenziamento rimossi. Gittata 15 m.",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo: "Il turno seguente non puoi ricevere Potenziamento.",
        mostra_a: "MASTER",
      },
    ],
  },

  {
    slug: "hari-tsume-carico-trattenuto",
    nomeRomaji: "Hari-Tsume",
    nomeItaliano: "Carico Trattenuto",
    kanji: "張り詰め",
    flavor:
      "La Jigo-Ka si comprime in un arto e aspetta. L'analista la conosce abbastanza da trattenerla ai limiti senza che esploda, sfruttandola tutta al momento scelto.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 turni. Scegli un arto. Il prossimo colpo a [Contatto] con quell'arto ottiene Potenziamento +3, ripartito su Binshō e Kairyoku (Indice e danno del colpo). Finché attiva, l'arto non può fare altro. Decade allo scarico o a fine durata.",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["itami", "binsho", "kairyoku"],
    scelteAlLancio: [
      { id: "arto_dx", label: "Arto destro" },
      { id: "arto_sx", label: "Arto sinistro" },
      { id: "gamba_dx", label: "Gamba destra" },
      { id: "gamba_sx", label: "Gamba sinistra" },
    ],
    effetti: [
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 3 },
        nota_master: "Potenziamento +3 Kairyoku sull'arto scelto. Decade allo scarico (uso del colpo) o a fine durata.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 3 },
        nota_master: "Potenziamento +3 Binshō sull'arto scelto. Decade allo scarico o a fine durata. L'arto non può fare altro finché attiva.",
      },
    ],
    implementazioneNote: [
      "Hari-Tsume — +3 su entrambi Binshō e Kairyoku (arto singolo); l'arto è il selettore narrativo, non un blocco separato.",
    ],
  },

  {
    slug: "seni-gake-avvolgimento-fibre",
    nomeRomaji: "Sen'i-Gake",
    nomeItaliano: "Avvolgimento delle Fibre",
    kanji: "繊維掛け",
    flavor:
      "La Jigo-Ka scende lungo le fibre e le rinforza, avvolgendole come filo intorno a un'anima di legno; il resto del corpo perde lucentezza.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 turni. Scegli un settore (Gambe, Braccia o Torace) e un tipo di fibra. Per 2 turni, il Potenziamento si applica solo alle azioni di quel settore: Fibre Bianche → +2 Kairyoku · Fibre Neuromuscolari → +2 Binshō · Fibre Rosse → +2 Nintai.",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["itami", "kairyoku", "binsho", "nintai"],
    scelteAlLancio: [
      { id: "fibre_bianche", label: "Fibre Bianche (+2 Kairyoku)" },
      { id: "fibre_neuromuscolari", label: "Fibre Neuromuscolari (+2 Binshō)" },
      { id: "fibre_rosse", label: "Fibre Rosse (+2 Nintai)" },
    ],
    effetti: [
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "scelta == fibre_bianche",
        nota_master: "Fibre Bianche: +2 Kairyoku per 2 turni. Solo azioni del settore scelto.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "scelta == fibre_neuromuscolari",
        nota_master: "Fibre Neuromuscolari: +2 Binshō per 2 turni. Solo azioni del settore scelto.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        skiru: "nintai",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "scelta == fibre_rosse",
        nota_master: "Fibre Rosse: +2 Nintai per 2 turni. Solo azioni del settore scelto.",
      },
    ],
    implementazioneNote: [
      "Sen'i-Gake — condizione 'scelta ==' dipende dalla scelta al lancio; solo il blocco corrispondente alla fibra scelta è attivo (🟡 Ibrida).",
    ],
  },

  {
    slug: "geki-ryu-corrente-violenta",
    nomeRomaji: "Geki-Ryū",
    nomeItaliano: "Corrente Violenta",
    kanji: "激流",
    flavor:
      "L'analista apre tutti i nodi e lascia che la Jigo-Ka li attraversi a una velocità non concepita per essere sostenuta. Poi le camere svuotate restano vuote.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 + 2 turni. Per 2 turni, +3 Binshō. Allo scadere, contraccolpo di −3 Binshō per altri 2 turni.",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["itami", "binsho"],
    effetti: [
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 3 },
        nota_master: "Geki-Ryū: +3 Binshō per 2 turni.",
      },
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        finestra_turni: 2,
        rilasci: {
          scadenza: {
            tipo: "BUFF_SKIRU",
            trigger: "A_SCADENZA",
            bersaglio: "SE_STESSO",
            durata: { tipo: "TURNI", n: 2 },
            skiru: "binsho",
            valore: { tipo: "FISSO", n: -3 },
            nota_master: "Contraccolpo automatico: −3 Binshō per 2 turni allo scadere del buff.",
          },
        },
        nota_master: "Contraccolpo: 2 turni dopo il lancio, −3 Binshō per 2 turni.",
      },
    ],
  },

  {
    slug: "hada-yuzuri-cessione-pelle",
    nomeRomaji: "Hada-Yuzuri",
    nomeItaliano: "Cessione attraverso la Pelle",
    kanji: "肌譲り",
    flavor:
      "Il corpo non è un contenitore ermetico: ciò che lo abita può essere ceduto al tocco, come calore che passa da una mano all'altra.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 2 · istantanea. A [Contatto] su un vivente: trasferisci uno tuo status attivo al bersaglio (stessi stack, durata residua).",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["itami", "kensei"],
    effetti: [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "TRASFERISCI",
        status_da: "*",
        nota_master:
          "Hada-Yuzuri: a [Contatto] su un vivente, trasferisci uno tuo status attivo (a scelta). Il bersaglio lo riceve con gli stessi stack e la durata residua.",
      },
    ],
  },

  {
    slug: "tsubo-uchi-colpo-punto",
    nomeRomaji: "Tsubo-Uchi",
    nomeItaliano: "Colpo al Punto",
    kanji: "壺打ち",
    flavor:
      "Ogni punto del corpo è una camera; l'analista sa quale premere. Il colpo non fa più male degli altri — ma marca il tessuto in modo che ogni colpo successivo nello stesso posto faccia male di più.",
    meccanica:
      "Attiva · [Nessuna][Contatto] · CS 1 · persistente 2 turni. Marchi una zona bersaglio (Punto di Pressione). Ogni tuo colpo successivo sulla stessa zona aumenta il danno extra: +2, poi +4, poi +6 (cap +6). Decade se la zona non viene colpita per 2 turni consecutivi. Max 1 punto/bersaglio; cambiare zona resetta il contatore.",
    tier: 1,
    tags: ["Contatto", "Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["itami", "kensei", "seimitsu"],
    scelteAlLancio: [
      { id: "testa", label: "Testa" },
      { id: "braccia", label: "Braccia" },
      { id: "busto", label: "Busto" },
      { id: "gambe", label: "Gambe" },
    ],
    effetti: [
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "PERSISTENTE", condizione_fine: "zona non colpita per 2 turni" },
        operazione: "SCRIVI",
        chiave: "tsubo_uchi_zona",
        valore: "zona_scelta",
        nota_master: "Scrivi la zona marcata (Testa/Braccia/Busto/Gambe). Max 1 punto/bersaglio.",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "ALL_IMPATTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "PERSISTENTE", condizione_fine: "zona non colpita per 2 turni" },
        valore: { tipo: "SCALA", passi: [2, 4, 6], cap: 6 },
        filtro_waza: { tag: ["Contatto"] },
        nota_master:
          "Danno extra crescente: +2 al 1° colpo sulla zona, +4 al 2°, +6 al 3° e oltre (cap). Decay se la zona non viene colpita per 2 turni. Cambiare zona resetta.",
      },
    ],
  },

  {
    slug: "shoka-sublimazione",
    nomeRomaji: "Shōka",
    nomeItaliano: "Sublimazione",
    kanji: "昇華",
    flavor:
      "L'analista riconosce lo status che lo affligge non come ferita ma come materiale grezzo, e lo lavora dentro di sé: il dolore diviene forza, la sofferenza testardaggine.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 2 · persistente finché resta ≥1 stack. Richiede ≥2 stack di uno status negativo. Consumi 1 stack; le tue waza Potenziamento ricevono un boost extra (supera la Capacità Junkan): Incendiato→+2 Kairyoku · Sovraccarico→+2 Binshō · Torpore→+2 Nintai · Appesantimento→+2 Seishin Tanren · Vertigini→+2 Shakai Kaikyū. Quando un Potenziamento così alimentato decade, consuma 1 stack residua.",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["itami", "konjou"],
    effetti: [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "CONSUMA",
        status_da: "*",
        quantita: { tipo: "FISSO", n: 1 },
        condizione: "stack(status_negativo) >= 2",
        nota_master: "Consuma 1 stack di uno status negativo (a scelta tra quelli attivi). Richiede ≥2 stack.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "PERSISTENTE", condizione_fine: "stack(status_negativo) == 0" },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "status_consumato == incendiato",
        nota_master: "Incendiato → +2 Kairyoku. Supera la Capacità Junkan. Decade quando il Potenziamento scade (consuma 1 stack residuo).",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "PERSISTENTE", condizione_fine: "stack(status_negativo) == 0" },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "status_consumato == sovraccarico",
        nota_master: "Sovraccarico → +2 Binshō. Supera la Capacità Junkan.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "PERSISTENTE", condizione_fine: "stack(status_negativo) == 0" },
        skiru: "nintai",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "status_consumato == torpore",
        nota_master: "Torpore → +2 Nintai. Supera la Capacità Junkan.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "PERSISTENTE", condizione_fine: "stack(status_negativo) == 0" },
        skiru: "seishin-tanren",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "status_consumato == appesantimento",
        nota_master: "Appesantimento → +2 Seishin Tanren. Supera la Capacità Junkan.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "status_consumato == vertigini",
        testo: "Vertigini → +2 Shakai Kaikyū (Skiru scelta nella disciplina Shakai). Supera la Capacità Junkan.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Quando un Potenziamento alimentato da Shōka decade, consuma automaticamente 1 stack di status negativo residuo.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Shōka — condizione 'status_consumato ==' non standard (il motore non traccia quale status è stato consumato); Master valuta la voce BUFF_SKIRU corretta in base allo status scelto.",
      "Shōka — 'Shakai Kaikyū' non è un singolo nodo Skiru; Master sceglie la Skiru Shakai appropriata per il personaggio.",
    ],
  },

  // ─── LE TRE NUOVE (GRADO) ──────────────────────────────────────────────────

  {
    slug: "shokushin-lettura-corpo",
    nomeRomaji: "Shokushin",
    nomeItaliano: "Lettura del Corpo",
    kanji: "触診",
    flavor:
      "L'analista non colpisce per ferire: colpisce per leggere. Nel punto di contatto la sua Jigo-Ka risale sotto la pelle del bersaglio come una mano che tasta un meccanismo al buio.",
    meccanica:
      "Attiva · [Nessuna][Contatto] · Tier 3 · CS 3 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Colpisci a [Contatto]: leggi il corpo del bersaglio (Skiru più alta/bassa, Potenziamenti attivi, Status, stima Jigo-Ka, Stili/passive parziali). Un solo bersaglio letto alla volta; lettura persiste 3 turni. Il tuo prossimo colpo contro di lui: +3 danni. Il prossimo colpo che subisci da lui approfondisce la Lettura (rivela 1 passiva in più).",
    tier: 3,
    tags: ["Contatto", "Nessuna"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: ["itami", "kansatsu", "kensei"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Nessuna",
        nota_master: "Tier 3 · CS 3. Colpo a [Contatto].",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        condizione: "grado_pg >= Sentatsu Bunsekikan",
        testo:
          "Shokushin — Lettura del Corpo: a [Contatto], leggi il bersaglio. Ottieni: Skiru più alta e più bassa; Potenziamenti attivi e su quale Skiru; Status posseduti; stima sommaria Jigo-Ka (CS) residua; Stili di appartenenza + alcune passive (quante lo decide il fato/master). Un solo bersaglio letto alla volta: leggerne un altro sovrascrive. Lettura persiste 3 turni. Il tuo prossimo colpo verso il bersaglio letto: +3 danni. Il prossimo colpo che subisci da lui: approfondisce la Lettura (rivela 1 passiva in più).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "ALL_IMPATTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        valore: { tipo: "FISSO", n: 3 },
        filtro_waza: { tag: ["Contatto"] },
        nota_master: "+3 danni al prossimo colpo verso il bersaglio letto. La lettura persiste 3 turni; il bonus decade al primo uso.",
      },
    ],
    implementazioneNote: [
      "Shokushin — dominio naikanReadTarget implementato in packages/domain/src/styles/naikan/shokushin.ts.",
    ],
  },

  {
    slug: "komei-chi-lo-ha-deciso",
    nomeRomaji: "Kōmei",
    nomeItaliano: "Chi lo ha Deciso?",
    kanji: "抗命",
    flavor:
      "L'analista guarda ciò che lo affligge e si rifiuta di subirlo. La Jigo-Ka inverte la corrente nei nodi: il fuoco che lo bruciava ora gli riveste i pugni.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 4 · 1/4 · grado richiesto: Kanteikan [K]. Lanciabile solo con ≥1 status negativo attivo. Rimuovi immediatamente tutti i tuoi status negativi: ognuno si converte nel suo opposto per 3 turni (atto singolo, non mantenimento): Incendiato/Emorragia→colpi [Contatto] applicano [Incendiato] (1 stack) · Sovraccarico→+2 CS/turno · Torpore→+10% mitigazione · Appesantimento→colpi [Contatto] +1 tier · Vertigini→2 stack [Ira].",
    tier: 4,
    tags: ["Potenziamento", "Nessuna"],
    cs: 4,
    tempoQuarti: 1,
    skiruIr: ["itami", "konjou"],
    effetti: [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "RIMUOVI",
        status_da: "*",
        condizione: "stack(status_negativo) >= 1",
        nota_master:
          "Kōmei: rimuovi TUTTI gli status negativi attivi (Incendiato, Emorragia, Sovraccarico, Torpore, Appesantimento, Vertigini). Richiede ≥1 status negativo.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "grado_pg >= Kanteikan",
        testo:
          "Kōmei — Inversioni (durata 3 turni, atto singolo): Incendiato/Emorragia → [Rovente] ogni colpo [Contatto] applica [Incendiato] (1 stack); Sovraccarico → [Carburante] +2 CS/turno; Torpore → [Armatura] +10% mitigazione; Appesantimento → [Potenza] colpi [Contatto] +1 tier; Vertigini → [Ferocia] +2 stack [Ira] (immediato). L'Inversione è un singolo atto, non mantenimento.",
        mostra_a: "MASTER",
      },
      {
        tipo: "APPLICA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        status: "ira",
        stack: 2,
        condizione: "status_rimosso_include_vertigini",
        nota_master: "Vertigini rimosso → applica immediatamente 2 stack [Ira].",
      },
    ],
    implementazioneNote: [
      "Kōmei — logica inversione implementata in packages/domain/src/styles/naikan/komei.ts.",
      "Kōmei — CS_COST = 6 (domain file). Le inversioni Rovente/Carburante/Armatura/Potenza → Master applica i modificatori.",
    ],
  },

  {
    slug: "hogo-sutura-ego",
    nomeRomaji: "Hōgō",
    nomeItaliano: "Sutura dell'Ego",
    kanji: "縫合",
    flavor:
      "L'analista non riscrive più — sutura. Al contatto, cuce un frammento della propria disciplina nel corpo altrui, e ciò che era libero si chiude.",
    meccanica:
      "Attiva · [Nessuna][Contatto] · Tier 4 · CS 5 · 1/4 · grado richiesto: Shin'enkan [S]. Colpisci a [Contatto] e applichi una Sutura a scelta (max 1/bersaglio) per 4 turni: Offensiva (−30% alla Skiru più alta), di Stile (sigilla 1 passiva), Elementale (congela tutti gli status). Il bersaglio può spezzarla spendendo 4 CS + 1 Quarto intero.",
    tier: 4,
    tags: ["Contatto", "Nessuna"],
    cs: 5,
    tempoQuarti: 1,
    skiruIr: ["itami", "kansatsu", "kensei"],
    scelteAlLancio: [
      { id: "offensiva", label: "Sutura Offensiva (−30% Skiru più alta)" },
      { id: "stile", label: "Sutura di Stile (sigilla 1 passiva)" },
      { id: "elementale", label: "Sutura Elementale (congela status)" },
    ],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Nessuna",
        nota_master: "Tier 4 · CS 7. Colpo a [Contatto].",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        condizione: "grado_pg >= Shin'enkan",
        testo:
          "Hōgō — Sutura scelta (max 1/bersaglio, durata 4 turni): Sutura Offensiva: −30% alla Skiru più alta del bersaglio per 4 turni; non può essere potenziata; se lo era, perde il Potenziamento e non ne acquisisce per la durata. Sutura di Stile: sigilla 1 passiva del bersaglio (scelta tra quelle note da Shokushin); non può usarla per 4 turni. Sutura Elementale: congela tutti gli status attivi del bersaglio per 4 turni; non decadono, non si rimuovono, restano bloccati al livello attuale. Rottura: il bersaglio spende 4 CS + 1 Quarto intero alla purificazione.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Sutura Offensiva: il malus −3 Skiru è persistente per 4 turni. Implementato in packages/domain/src/styles/naikan/hogo.ts.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Hōgō — CS_COST = 5 (scelto dall'utente; domain file dice 7). HOGO_BREAK_CS_COST = 4. Logica Sutura in packages/domain/src/styles/naikan/hogo.ts.",
    ],
  },
];
