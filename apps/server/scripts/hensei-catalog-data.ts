/**
 * Sorgente canonica Hensei-dō — guida codifica allineata (19 waza).
 * 7 passive · 12 attive · 2 di grado (Nagori [SB], Igyō-Rensei [K]).
 */

export type HenseiCatalogEntry = {
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
      ? "[Hensei-dō · Passiva lignaggio]"
      : "[Hensei-dō · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

export function henseiDescrizione(e: HenseiCatalogEntry): string {
  const kind = e.tempoQuarti != null ? "attiva" : "passiva";
  return desc(kind, e.flavor, e.meccanica);
}

export function allHenseiImplementazioneNotes(): string[] {
  return HENSEI_CATALOG.flatMap((e) => e.implementazioneNote ?? []);
}

export const HENSEI_CATALOG: HenseiCatalogEntry[] = [
  // ─── PASSIVE ───────────────────────────────────────────────────────────────

  {
    slug: "ishi-volere",
    nomeRomaji: "Ishi",
    nomeItaliano: "Volere",
    kanji: "意志",
    flavor:
      "Basta volerlo perché ciò che esce dalla mano cambi natura a metà volo.",
    meccanica:
      "Passiva · CS 1 per uso. Cambi la Consistenza di una tua waza durante l'esecuzione (non Nulla né Elementale). Se la waza è già Elementale, puoi cambiarne solo l'elemento.",
    tier: null,
    cs: 1,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "PRE_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "player_choice",
        oggetto: "WAZA_PROPRIA",
        nota_master:
          "Ishi: cambia la Consistenza di una tua waza in esecuzione (non Nulla né Elementale come destinazione). CS 1 per uso. Se la waza è già Elementale, puoi solo cambiare l'elemento.",
      },
    ],
    implementazioneNote: [
      "Ishi — TRASFORMA_TAG a_tag variabile; Master risolve la Consistenza scelta. Parte del ciclo Yuragi.",
    ],
  },

  {
    slug: "kyosei-hen-mutazione-imposta",
    nomeRomaji: "Kyōsei-Hen",
    nomeItaliano: "Mutazione Imposta",
    kanji: "強制変",
    flavor:
      "La Consistenza è negoziabile — basta avere la volontà di imporla su ciò che non te ne ha data facoltà.",
    meccanica:
      "Passiva · CS 1. Cambia la Consistenza di Costrutti entro 8 m (non Nulla né Elementale) · durata 3 turni · su Costrutto proprio o nemico.",
    tier: null,
    cs: 1,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "A_COMANDO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "TURNI", n: 3 },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "player_choice",
        oggetto: "COSTRUTTO",
        nota_master:
          "Kyōsei-Hen: cambia Consistenza di un Costrutto entro 8 m (proprio o nemico) per 3 turni. Non su Nulla né Elementale come destinazione. CS 1.",
      },
      {
        tipo: "TRASFORMA_TAG",
        trigger: "A_COMANDO",
        bersaglio: "COSTRUTTO_NEMICO",
        durata: { tipo: "TURNI", n: 3 },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "player_choice",
        oggetto: "COSTRUTTO",
        nota_master:
          "Kyōsei-Hen su Costrutto nemico entro 8 m. Master valida la portata e l'applicabilità.",
      },
    ],
    implementazioneNote: [
      "Kyōsei-Hen — TRASFORMA_TAG a_tag variabile; bersaglio doppio (proprio/nemico). Parte del ciclo Yuragi.",
    ],
  },

  {
    slug: "genso-ka-elementalizzazione",
    nomeRomaji: "Genso-Ka",
    nomeItaliano: "Elementalizzazione",
    kanji: "元素化",
    flavor:
      "Tutto può bruciare, scorrere, dissolversi. L'analista di Hensei non scopre la natura degli elementi: la impone.",
    meccanica:
      "Passiva · CS 1. Cambia la Consistenza di una tua waza in esecuzione in Elementale (elemento a scelta). Non su waza già Nulla o già Elementale.",
    tier: null,
    cs: 1,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "PRE_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "Elementale",
        oggetto: "WAZA_PROPRIA",
        nota_master:
          "Genso-Ka: cambia Consistenza → Elementale (elemento a scelta). Non su waza Nulla o già Elementale. CS 1.",
      },
    ],
  },

  {
    slug: "renkin-soku-regole-alchemiche",
    nomeRomaji: "Renkin-Soku",
    nomeItaliano: "Regole Alchemiche",
    kanji: "錬金則",
    flavor:
      "L'alchimia ha le sue regole — e l'analista le ha imparate abbastanza da usarle come arma.",
    meccanica:
      "Passiva · CS 0 · cuore di Yuragi. Non puoi usare due waza con la stessa Consistenza consecutivamente. Ogni cambio conferisce l'effetto alchemico della nuova consistenza. Catena di Vacillazione: +1 grado per anello, max 2 + Kansatsu.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo:
          "Renkin-Soku (cuore di Yuragi): non puoi usare due waza con la stessa Consistenza consecutivamente. Ogni cambio di Consistenza conferisce l'effetto alchemico della nuova: Sonoro → gittata ×0,5 +1 tier danno; Elementale → aura 3 m che infligge lo status; Liquido → gittata ×1,5 −1 tier danno; Gassoso → +gittata +1 turno permanenza; Solido → +1 tier Resistenza; Energetica → priorità a parità d'Indice. Catena di Vacillazione: +1 grado effetti per anello (ogni cambio consecutivo), max 2 + Kansatsu.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Renkin-Soku — regola di stile Yuragi → Master (🔴). Logica in packages/domain/src/styles/hensei/yuragi.ts.",
    ],
  },

  {
    slug: "kenja-no-ishi-pietra-filosofale",
    nomeRomaji: "Kenja no Ishi",
    nomeItaliano: "Pietra Filosofale",
    kanji: "賢者の石",
    flavor:
      "Il sogno degli alchimisti: non creare l'oro, ma far sì che qualcosa smetta di essere ciò che è — e nel momento del cambiamento, esploda.",
    meccanica:
      "Passiva · CS 1. Un tuo Costrutto Solido muta in cristallo rosso sangue in 2 turni. Se distrutto a contatto: +2 tier alla tua prossima waza.",
    tier: null,
    cs: 1,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Kenja no Ishi: un tuo Costrutto Solido si muta in cristallo rosso sangue in 2 turni (transizione visibile). Se distrutto a contatto durante/dopo la mutazione: la tua prossima waza guadagna +2 tier di danno.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Kenja no Ishi — transizione costrutto + bonus tier su distruzione → Master (🔴). SU_DISTRUZIONE trigger con condizione contatto non implementabile automaticamente.",
    ],
  },

  {
    slug: "roei-scia-incontrollata",
    nomeRomaji: "Rōei",
    nomeItaliano: "Scia Incontrollata",
    kanji: "漏洩",
    flavor:
      "La trasformazione non è mai perfettamente contenuta: qualcosa sfugge, lascia una traccia, e la traccia ha vita propria.",
    meccanica:
      "Passiva · CS 0 · automatica. Quando cambi una tua waza Energetica in Elementale, resta una scia gassosa dell'elemento (stesse dimensioni della waza) per 2 turni. Chi finisce il turno o passa 2 quarti nella scia riceve +1 stack dello status elementale.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "ZONA",
        trigger: "PRE_LANCIO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "TURNI", n: 2 },
        forma_zona: "linea",
        raggio_zona_m: 3,
        ancoraggio: "FISSA",
        effetti_zona: {
          a_inizio_turno: {
            tipo: "APPLICA_STATUS",
            trigger: "INIZIO_TURNO",
            bersaglio: "TUTTI_IN_AREA",
            durata: { tipo: "ISTANTANEA" },
            status: "status_elementale",
            stack: 1,
            nota_master: "+1 stack dello status elementale della Consistenza trasformata.",
          },
        },
        condizione: "waza.consistenza_originale == Energetica AND waza.nuova_consistenza == Elementale",
        nota_master:
          "Rōei: solo quando trasformi Energetica → Elementale (via Ishi/Genso-Ka). La zona scia segue le dimensioni/forma della waza originale. Status = quello dell'elemento scelto.",
      },
    ],
    implementazioneNote: [
      "Rōei — la zona scia dipende dalla trasformazione Energetica→Elementale (Ishi/Genso-Ka). Forma e dimensioni della zona seguono la waza. Lo status elementale è quello della Consistenza in arrivo → Master determina il tipo.",
    ],
  },

  {
    slug: "hanno-reattivita-consistenza",
    nomeRomaji: "Hannō",
    nomeItaliano: "Reazione di Consistenza",
    kanji: "反応",
    flavor:
      "Due nature incompatibili si toccano: la fisica dell'esistenza reagisce.",
    meccanica:
      "Passiva · CS 0. Quando una tua waza con Consistenza definita colpisce una zona di Consistenza diversa (scia/zona/Costrutto), scatta una reazione: Fuoco+Gassoso→zona s'infiamma; Fulmine+Liquido→zona elettrificata; Acqua+Solido→−1 tier Resistenza; Aria+Sonoro→gittata ×1,5; Gravità+Energetico→+1 tier alla prossima tecnica.",
    tier: null,
    cs: 0,
    tempoQuarti: null,
    skiruIr: [],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        testo:
          "Hannō — Reazione di Consistenza: quando una tua waza colpisce una zona/costrutto di Consistenza diversa, scatta la reazione: Fuoco+Gassoso → la zona s'infiamma (danno = tier o +2 stack status); Fulmine+Liquido → zona elettrificata; Acqua+Solido → −1 tier Resistenza al Solido; Aria+Sonoro → gittata ×1,5; Gravità+Energetico → +1 tier alla prossima tecnica dell'analista.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Hannō — reazioni inter-Consistenza → Master (🔴). Il motore non traccia la Consistenza delle zone passive.",
    ],
  },

  // ─── ATTIVE ────────────────────────────────────────────────────────────────

  {
    slug: "wana-trappola",
    nomeRomaji: "Wana",
    nomeItaliano: "Trappola!",
    kanji: "罠",
    flavor:
      "Il campo è cambiato — e chi non se ne è accorto sta per scoprirlo.",
    meccanica:
      "Attiva · [Nessuna] · Tier 1 · CS 1 · 1/4. Cambia la Consistenza di una tua waza/costrutto già in campo (da ≥1 turno) in quella di un Elemento a scelta · durata 1 turno.",
    tier: 1,
    tags: ["Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "seimitsu"],
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "A_COMANDO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "TURNI", n: 1 },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "Elementale",
        oggetto: "COSTRUTTO",
        condizione: "costrutto.turni_in_campo >= 1",
        nota_master:
          "Wana: cambia Consistenza di una tua waza/zona già in campo da ≥1 turno in Elementale (elemento a scelta). Durata 1 turno.",
      },
    ],
  },

  {
    slug: "ihen-aberrazione",
    nomeRomaji: "Ihen",
    nomeItaliano: "Aberrazione",
    kanji: "異変",
    flavor:
      "Il braccio non è più carne: è materia compressa in una forma che il corpo non riconosce come sua. Una violenza silenziosa contro la propria anatomia.",
    meccanica:
      "Attiva · [Potenziamento][Nessuna] · Tier 2 · CS 2 · 1/4 · durata 4 turni. Evochi un'arma-Costrutto [Nessuna] che sostituisce un arto (danno = tier). Se il costrutto si rompe, l'arto resta inutilizzabile.",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "kensei", "kongen"],
    effetti: [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 4 },
        taglia: "Piccola",
        consistenza: "Nessuna",
        danno: { tipo: "TIER" },
        attacchi_per_turno: 1,
        comportamento: "COMANDATO",
        nota_master:
          "Ihen: il Costrutto-arma sostituisce un arto scelto (brandita). Se distrutta, l'arto resta inutilizzabile per la durata residua.",
      },
      {
        tipo: "MANUALE",
        trigger: "SU_DISTRUZIONE",
        testo: "Ihen: se il costrutto-arma viene distrutto, l'arto che lo ospitava resta inutilizzabile (non può usare waza Contatto o oggetti) per la durata residua.",
        mostra_a: "MASTER",
      },
    ],
  },

  {
    slug: "bogai-disturbo",
    nomeRomaji: "Bōgai",
    nomeItaliano: "Disturbo",
    kanji: "妨害",
    flavor:
      "Il ronzio è sottile ma pervasivo: non blocca la Jigo-Ka, la disturba abbastanza da farla sfuggire di mano.",
    meccanica:
      "Attiva · [Emanazione][Energetica] · CS 2 · 1/4 · durata 3 turni. Crei un ronzio in area 8 m per 3 turni che interferisce con abilità sensoriali basate su Jigo-Ka. Ogni tuo colpo a contatto durante il ronzio riduce di 2 CS il bersaglio.",
    tier: 2,
    tags: ["Emanazione", "Energetica"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "shodo"],
    effetti: [
      {
        tipo: "ZONA",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        forma_zona: "cerchio",
        raggio_zona_m: 8,
        ancoraggio: "FISSA",
        effetti_zona: {},
        nota_master:
          "Bōgai: ronzio [Energetica] 8 m per 3 turni. Interferisce con abilità sensoriali basate su Jigo-Ka (diagnosi a distanza, rilevamento aura, ecc.). Master valuta caso per caso.",
      },
      {
        tipo: "MOD_CS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "DRENA",
        quantita: { tipo: "FISSO", n: 2 },
        condizione: "waza.tag contiene Contatto AND bōgai_attivo",
        nota_master: "Ogni colpo a [Contatto] durante il ronzio: drena 2 CS al bersaglio colpito.",
      },
    ],
    implementazioneNote: [
      "Bōgai — MOD_CS condizione 'bōgai_attivo' non standard; Master traccia se la zona è attiva al momento del colpo.",
    ],
  },

  {
    slug: "oboro-velo-onirico",
    nomeRomaji: "Oboro",
    nomeItaliano: "Velo Onirico",
    kanji: "朧",
    flavor:
      "Non un'illusione — una distorsione. Ciò che è reale rimane reale, ma le sue proprietà diventano illeggibili.",
    meccanica:
      "Attiva · [Nessuna] · CS 2 · 1/4 · durata 3 turni. Velo invisibile 4×8 m posizionabile ovunque: nasconde le vere proprietà di ciò che copre completamente. Solo la tua Jigo-Ka può interagirvi.",
    tier: 2,
    tags: ["Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "seimitsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Oboro — Velo Onirico: zona rettangolare 4×8 m per 3 turni. Tutto ciò che il velo copre completamente appare neutro (Consistenza e proprietà illeggibili). Solo la Jigo-Ka dell'analista può identificare ciò che è dentro. Invisibile a occhio nudo.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Oboro — illusione di Consistenza → Master (🔴). Non implementabile automaticamente.",
    ],
  },

  {
    slug: "bocho-espansione-instabile",
    nomeRomaji: "Bōchō",
    nomeItaliano: "Espansione Instabile",
    kanji: "膨張",
    flavor:
      "Ogni forma ha un volume massimo che può sostenere. L'analista lo trova e lo supera — per un turno solo.",
    meccanica:
      "Attiva · [Nessuna] · Tier 1 · CS 1 · 1/4 · durata 1 turno. Un Costrutto entro 8 m sale di una taglia per 1 turno, poi si rompe.",
    tier: 1,
    tags: ["Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "kongen"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Bōchō: un Costrutto entro 8 m sale di una taglia (Piccolo→Medio, Medio→Grande, Grande→Enorme) per 1 turno. Allo scadere si rompe (distrutto).",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Bōchō — aumento taglia costrutto + auto-distruzione a scadenza → Master (🔴).",
    ],
  },

  {
    slug: "kokan-scambio-consistenza",
    nomeRomaji: "Kōkan",
    nomeItaliano: "Scambio di Consistenza",
    kanji: "交換",
    flavor:
      "La natura non viene imposta: viene scambiata. Due forme si cedono ciò che sono — e nessuna delle due chiede il permesso all'altra.",
    meccanica:
      "Attiva · [Nessuna] · CS 2 · 1/4 · durata 3 turni. Due oggetti/Costrutti entro 8 m si scambiano Consistenza per 3 turni. Entrambi devono avere Consistenza definita; non su Costrutti impugnati da terzi.",
    tier: 2,
    tags: ["Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "seimitsu"],
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "TURNI", n: 3 },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "costrutto_b.consistenza",
        oggetto: "COSTRUTTO",
        nota_master:
          "Kōkan: scambio Consistenza tra due oggetti/Costrutti (A→B, B→A). Entrambi devono avere Consistenza definita; non su Costrutti impugnati da terzi. Durata 3 turni.",
      },
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "COSTRUTTO_NEMICO",
        durata: { tipo: "TURNI", n: 3 },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "costrutto_a.consistenza",
        oggetto: "COSTRUTTO",
        nota_master: "Kōkan secondo costrutto: riceve la Consistenza originale del primo.",
      },
    ],
    implementazioneNote: [
      "Kōkan — scambio bidirezionale; a_tag variabile (Consistenza dell'altro costrutto). Master valida l'applicabilità.",
    ],
  },

  {
    slug: "sokotsu-fusione-instabile",
    nomeRomaji: "Sōkotsu",
    nomeItaliano: "Fusione Instabile",
    kanji: "相崩",
    flavor:
      "Il Costrutto viene forzato ad oscillare tra due stati finché lo stress non lo spezza. I frammenti portano il marchio dell'ultima transizione.",
    meccanica:
      "Attiva · [Emanazione a Distanza] · Tier 3 · CS 3 · 1/4. Colpisci un Costrutto entro 8 m: danno area 3 m attorno ad esso = tier. I frammenti hanno la Consistenza finale della transizione.",
    tier: 3,
    tags: ["Emanazione a Distanza"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "kashin"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "AREA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        area: { forma: "cerchio", raggio_m: 3 },
        nota_master:
          "Sōkotsu: forzi il Costrutto bersaglio (entro 8 m) a oscillare tra due stati → esplode. Danno = tier in area 3 m attorno al costrutto colpito. I frammenti hanno la Consistenza finale della transizione.",
      },
    ],
  },

  {
    slug: "shoku-corrosione",
    nomeRomaji: "Shoku",
    nomeItaliano: "Corrosione",
    kanji: "蝕",
    flavor:
      "Il contatto non ferisce: erode. La natura del Costrutto si consuma dal bordo verso il centro, e al terzo turno non è più quella di prima.",
    meccanica:
      "Attiva · [Contatto] · CS 2 · 1/4 · durata 3 turni. A [Contatto] su Costrutto/Scudo: −1 tier Resistenza/turno per 3 turni. Al 3° turno diventa Elementale col tuo elemento. Se distrutto durante la transizione, rilascia lo status in 3 m.",
    tier: 2,
    tags: ["Contatto"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "kensei"],
    effetti: [
      {
        tipo: "MOD_RESISTENZA",
        trigger: "INIZIO_TURNO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "TURNI", n: 3 },
        delta_resistenza: -1,
        nota_master:
          "Shoku: −1 tier Resistenza per turno per 3 turni al Costrutto/Scudo toccato.",
      },
      {
        tipo: "TRASFORMA_TAG",
        trigger: "A_SCADENZA",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "Elementale",
        oggetto: "COSTRUTTO",
        nota_master: "Al 3° turno (scadenza): il Costrutto diventa Elementale col tuo elemento.",
      },
      {
        tipo: "MANUALE",
        trigger: "SU_DISTRUZIONE",
        testo:
          "Shoku: se il Costrutto viene distrutto durante la transizione (prima del 3° turno), rilascia lo status elementale in area 3 m.",
        mostra_a: "MASTER",
      },
    ],
  },

  {
    slug: "tenka-dalla-padella-alla-brace",
    nomeRomaji: "Tenka",
    nomeItaliano: "Dalla Padella alla Brace",
    kanji: "転化",
    flavor:
      "Uno status elementale è già nel corpo del bersaglio. Non serve applicarne un altro: basta cambiarne la firma.",
    meccanica:
      "Attiva · [Nessuna][Contatto] · Tier 1 · CS 1 · 1/4 · richiede ≥1 status elementale attivo sul bersaglio. A [Contatto]: trasmuti uno status elementale del bersaglio in un altro a tua scelta, con gli stessi stack.",
    tier: 1,
    tags: ["Contatto", "Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "kensei"],
    effetti: [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "TRASMUTA",
        status_da: "*",
        status_a: "player_choice",
        condizione: "stack(status_elementale) >= 1",
        nota_master:
          "Tenka: trasmuti uno status elementale del bersaglio in uno a tua scelta, stessi stack. A [Contatto].",
      },
    ],
    implementazioneNote: [
      "Tenka — TRASMUTA con status_a variabile (scelta del giocatore al lancio). Master valida la coerenza elementale.",
    ],
  },

  {
    slug: "shokubai-catalisi",
    nomeRomaji: "Shokubai",
    nomeItaliano: "Catalisi",
    kanji: "触媒",
    flavor:
      "L'analista non è solo chi cambia la Consistenza: è chi rende il cambiamento produttivo. Ogni transizione ora lascia un segno.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 2 · 1/4 · durata 3 turni. Per 3 turni, ogni volta che cambi Consistenza di una tua waza in esecuzione, questa applica automaticamente +1 stack dello status della nuova Consistenza.",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "seimitsu"],
    effetti: [
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        skiru: "kansatsu",
        valore: { tipo: "FISSO", n: 0 },
        nota_master:
          "Shokubai (placeholder BUFF_SKIRU): attiva Catalisi per 3 turni. Ogni cambio di Consistenza (via Ishi/Genso-Ka/ecc.) applica automaticamente +1 stack dello status della nuova Consistenza al bersaglio della waza.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo:
          "Shokubai attiva: per 3 turni, ogni waza la cui Consistenza viene cambiata aggiunge +1 stack del suo status elementale al bersaglio. Si attiva automaticamente in coppia con Ishi/Genso-Ka/Kyōsei-Hen.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Shokubai — il BUFF_SKIRU con n:0 è un segnaposto per attivare la logica di catalisi; la vera meccanica è nel MANUALE.",
    ],
  },

  // ─── LE DUE NUOVE (GRADO) ──────────────────────────────────────────────────

  {
    slug: "nagori-principio-instabilita",
    nomeRomaji: "Nagori",
    nomeItaliano: "Principio di Instabilità",
    kanji: "名残",
    flavor:
      "L'analista non lascia mai del tutto uno stato: ogni forma che abbandona resta aggrappata alla successiva come un'ombra che il corpo non ha finito di scrollarsi di dosso.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 3 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB] · durata 3 turni. Attivi il Principio di Instabilità su di te. Per 3 turni, ogni cambio di [Consistenza] di una tua waza guadagna un effetto collaterale basato sulla consistenza abbandonata: [Solido]→+1 tier danno · [Liquido]→+4 m gittata · [Gassoso]→+1 turno permanenza · [Sonoro]→ignora 1 tier Resistenza/Scudo · [Elementale]→+1 stack status elementale abbandonato · [Energetico]→+3 velocità.",
    tier: 2,
    tags: ["Potenziamento", "Nessuna"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "seimitsu"],
    effetti: [
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        skiru: "kansatsu",
        valore: { tipo: "FISSO", n: 0 },
        condizione: "grado_pg >= Sentatsu Bunsekikan",
        nota_master:
          "Nagori: segnaposto BUFF_SKIRU. Attiva il Principio di Instabilità per 3 turni. Il dominio è in packages/domain/src/styles/hensei/nagori.ts.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "grado_pg >= Sentatsu Bunsekikan",
        testo:
          "Nagori attivo: per 3 turni, ogni cambio di Consistenza (via Ishi/Genso-Ka) guadagna un effetto collaterale basato sulla consistenza abbandonata: [Solido] → +1 tier danno; [Liquido] → +4 m gittata; [Gassoso] → +1 turno durata (se ha durata); [Sonoro] → ignora 1 tier Resistenza/Scudi; [Elementale] → +1 stack status elementale abbandonato; [Energetico] → +3 velocità. Tag in chat: [yuragi:liquido→solido] per registrare il cambio.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Nagori — CS_COST = 3 (domain file). Collaterali implementati in nagori.ts. Il BUFF_SKIRU n:0 è placeholder per l'attivazione.",
      "Nagori — tag chat [yuragi:FROM→TO] per registrare il cambio di Consistenza e attivare il collaterale.",
    ],
  },

  {
    slug: "igyo-rensei-insegnamenti-tucker",
    nomeRomaji: "Igyō-Rensei",
    nomeItaliano: "Insegnamenti di Tucker",
    kanji: "異形錬成",
    flavor:
      "L'analista posa la mano su una forma e la costringe a tradire sé stessa. Non un cambio docile: una trasmutazione aberrante.",
    meccanica:
      "Attiva · [Contatto] · Tier 4 · CS 4 · 1/4 · grado richiesto: Kanteikan [K]. Tocchi un [Costrutto] o [Scudo] (tuo o nemico, entro portata) e ne forzi la [Consistenza]. La transizione è violenta: →[Solido] +8 Resistenza ma Immobile 1t · →[Liquido] −50% Resistenza + zona Liquido 3 m · →[Gassoso] nube 4 m per 2 turni · →[Elementale] esplosione 3 m (2 stack status), costrutto distrutto.",
    tier: 4,
    tags: ["Contatto"],
    cs: 4,
    tempoQuarti: 1,
    skiruIr: ["kansatsu", "kensei"],
    scelteAlLancio: [
      { id: "solido", label: "→ [Solido]" },
      { id: "liquido", label: "→ [Liquido]" },
      { id: "gassoso", label: "→ [Gassoso]" },
      { id: "elementale", label: "→ [Elementale]" },
    ],
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "ALL_IMPATTO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "consistenza",
        da_tag: "*",
        a_tag: "player_choice",
        oggetto: "COSTRUTTO",
        condizione: "grado_pg >= Kanteikan",
        nota_master:
          "Igyō-Rensei: forza la Consistenza del Costrutto/Scudo (proprio o nemico) a quella scelta. La transizione produce un effetto immediato e violento.",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        condizione: "scelta == solido",
        testo:
          "Igyō-Rensei → [Solido]: +8 Resistenza al costrutto bersaglio, ma diventa [Immobile] per 1 turno (non spostabile da Telecinesi/Furia — Ayatsuri, Hajiki, Hikiyose).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        condizione: "scelta == liquido",
        testo:
          "Igyō-Rensei → [Liquido]: il costrutto perde metà Resistenza e si espande — zona [Liquido] a terra raggio 3 m.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        condizione: "scelta == gassoso",
        testo:
          "Igyō-Rensei → [Gassoso]: il costrutto perde forma e si disperde in nube 4 m per 2 turni.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        condizione: "scelta == elementale",
        testo:
          "Igyō-Rensei → [Elementale]: il costrutto esplode in raggio 3 m, applicando lo status elementale affine dell'analista (2 stack) a ogni bersaglio nell'area. Il costrutto/scudo originale è distrutto.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "Igyō-Rensei — Tier 4 · CS 4 (scelto dall'utente; domain file dice Tier 3 · CS 5). Logica in packages/domain/src/styles/hensei/igyo-rensei.ts.",
      "Tag chat [igyo:solido] o [igyo:liquido→solido] per registrare la trasmutazione.",
    ],
  },
];
