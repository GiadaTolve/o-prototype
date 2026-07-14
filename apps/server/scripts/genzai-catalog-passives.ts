/**
 * Genzai-dō passive — testi da genzai-waza-pool.
 */
import type { GenzaiCatalogEntry } from "./genzai-catalog-types";

export const GENZAI_PASSIVES: GenzaiCatalogEntry[] = [
  {
    slug: "nikutai-mei-carne-iscritta",
    nomeRomaji: "Nikutai-Mei",
    nomeItaliano: "Carne Iscritta",
    kanji: "肉体銘",
    poolName: "Nikutai-Mei (肉体銘) — Carne Iscritta",
    flavor:
      "Dove c'era carne, l'analista incide struttura: l'arto perduto torna come sigillo, fedele alla memoria di ciò che era.",
    meccanica:
      "Passiva · CS 0. Rimpiazzi parti del corpo con un Costrutto Solido dalla forma esatta della parte mancante. Quando quella parte viene colpita, il dolore fantasma drena CS invece di HP.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Rimpiazzi parti del corpo con Costrutto Solido (forma esatta della parte mancante). Se colpita: dolore fantasma drena CS invece di HP.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "honshitsu-essenza-affine",
    nomeRomaji: "Honshitsu",
    nomeItaliano: "Essenza Affine",
    kanji: "本質",
    poolName: "Honshitsu (本質) — Essenza Affine",
    flavor: "Un solo elemento è inscritto nell'analista, per sempre, e da lui sgorga in ogni cosa che scrive.",
    meccanica:
      "Passiva · CS 0, keystone elementale. Scegli un elemento, immutabile. Puoi infonderlo nei tuoi Costrutti Solidi (ne assumono le proprietà) e nelle tue waza Energetiche (diventano Elementali col relativo status). È il presupposto delle waza elementali dello Stile.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Keystone elementale: scegli un elemento (immutabile). Infondi nei Costrutti Solidi (proprietà elementali) e nelle waza Energetiche (→ Elementali + status). Presupposto waza elementali Genzai-dō.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Elemento affine scelto a creazione PG → Master / scheda."],
  },
  {
    slug: "kochiku-struttura-salda",
    nomeRomaji: "Kōchiku",
    nomeItaliano: "Struttura Salda",
    kanji: "構築",
    poolName: "Kōchiku (構築) — Struttura Salda",
    flavor: "Le linee del sigillo, tracciate fitte, reggono più peso.",
    meccanica: "Passiva · CS 0. I tuoi Costrutti e Scudi Solidi ottengono +1 tier di Resistenza.",
    effetti: [
      {
        tipo: "MOD_RESISTENZA",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        delta_resistenza: 1,
        filtro_consistenza: "Solido",
        nota_master: "+1 tier Resistenza ai tuoi Costrutti e Scudi Solidi.",
      },
    ],
  },
  {
    slug: "bugusho-arsenale-scritto",
    nomeRomaji: "Bugusho",
    nomeItaliano: "Arsenale Scritto",
    kanji: "武具書",
    poolName: "Bugusho (武具書) — Arsenale Scritto",
    flavor: "Tre frasi affilate, tracciate tra le dita, pronte a infrangersi su ciò che colpiscono.",
    meccanica:
      "Passiva · CS 0. Crei tra le mani 3 armi piccole, Costrutti Energetici (aghi, coltelli...), che si infrangono al primo ostacolo fisico. Una sola può restare nascosta 6 ore; lanciando una waza, tutte spariscono.",
    effetti: [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "A_COMANDO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        taglia: "Piccola",
        consistenza: "Energetica",
        comportamento: "STATICO",
        n_copie: 3,
        nota_master: "3 armi piccole Energetiche; si infrangono al primo ostacolo fisico.",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo: "Una sola arma può restare nascosta 6 ore. Lanciando una waza, tutte spariscono.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kaihen-forgia-ibrida",
    nomeRomaji: "Kaihen",
    nomeItaliano: "Forgia Ibrida",
    kanji: "改編",
    poolName: "Kaihen (改編) — Forgia Ibrida",
    flavor: "Due armi, una sola sentenza: corpo dell'una, morso dell'altra.",
    meccanica:
      "Passiva · CS 0. Crei un oggetto di media taglia, Costrutto Solido, fusione di due armi (corpo di una, estremità dell'altra). Una per quest; usando entrambe le estremità, si rompe a fine secondo turno.",
    effetti: [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "A_COMANDO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        taglia: "Media",
        consistenza: "Solido",
        comportamento: "STATICO",
        nota_master: "Fusione di due armi (corpo di una, estremità dell'altra). Una per quest.",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo: "Usando entrambe le estremità, l'arma ibrida si rompe a fine secondo turno.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kioku-mei-sigillo-mnemonico",
    nomeRomaji: "Kioku-Mei",
    nomeItaliano: "Sigillo Mnemonico",
    kanji: "記憶銘",
    poolName: "Kioku-Mei (記憶銘) — Sigillo Mnemonico",
    flavor: "Ciò che si è scritto bene una volta, si riscrive senza fatica.",
    meccanica:
      "Passiva · CS 0. Ricreare un Costrutto già creato (stessa forma e dimensione) costa −1 CS. Memorizzi fino a 3 forme; memorizzarne una richiede di averla creata almeno 3 volte.",
    effetti: [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_COSTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        delta_cs: -1,
        minimo_cs: 0,
        nota_master: "Ricreare un Costrutto già creato (stessa forma e dimensione): −1 CS.",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo: "Memorizzi fino a 3 forme; per memorizzarne una devi averla creata almeno 3 volte.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "eizoku-sigillo-persistente",
    nomeRomaji: "Eizoku",
    nomeItaliano: "Sigillo Persistente",
    kanji: "永続",
    poolName: "Eizoku (永続) — Sigillo Persistente",
    flavor: "Un sigillo ben tracciato non sbiadisce in fretta.",
    meccanica:
      "Passiva · CS 0. I tuoi Costrutti durano +1 turno. Quando uno sta per dissolversi, puoi spendere metà del suo costo in CS per estenderne la durata invece di ricrearlo.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "I tuoi Costrutti durano +1 turno. Prima della dissoluzione: spendi metà del costo CS originale per estendere la durata invece di ricrearlo.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kaju-sovraccarico-geometrico",
    nomeRomaji: "Kajū",
    nomeItaliano: "Sovraccarico Geometrico",
    kanji: "過重",
    poolName: "Kajū (過重) — Sovraccarico Geometrico",
    flavor: "L'analista calca la scrittura finché trafigge ciò che dovrebbe fermarla.",
    meccanica:
      "Passiva · CS 0 (+1 CS opzionale). Lanciando una waza Solida, paghi +1 CS per ignorare il 25% della Resistenza del primo ostacolo (dimezzato, 12,5%, sui viventi). Cumulabile per ogni CS speso.",
    effetti: [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        delta_cs: 1,
        filtro_waza: { tag: ["Solido"] },
        nota_master: "+1 CS opzionale per ignorare 25% Resistenza primo ostacolo (12,5% su viventi). Cumulabile.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo: "Effetto attivo solo su waza Solide; ogni +1 CS ripete il bonus penetrazione.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "hakai-mei-marchio-del-disfacimento",
    nomeRomaji: "Hakai-Mei",
    nomeItaliano: "Marchio del Disfacimento",
    kanji: "破壊銘",
    poolName: "Hakai-Mei (破壊銘) — Marchio del Disfacimento",
    flavor: "Chi scrive il reale sa anche cancellarlo: contro l'opera altrui, la sua mano è più dura.",
    meccanica: "Passiva · CS 0. +1 tier di danno contro i Costrutti.",
    effetti: [
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        nota_master: "+1 tier di danno contro i Costrutti.",
      },
    ],
  },
  {
    slug: "irekogo-sigillo-annidato",
    nomeRomaji: "Irekogo",
    nomeItaliano: "Sigillo Annidato",
    kanji: "入れ子",
    poolName: "Irekogo (入れ子) — Sigillo Annidato",
    flavor: "Un guscio scritto attorno a un altro: il primo cade, e sotto attende ciò che era nascosto.",
    meccanica:
      'Passiva · CS 0. "Rivesti" un tuo Costrutto Solido con un altro tuo Costrutto: il guscio esterno fa da scudo finché regge, poi si dissolve rivelando l\'interno già pronto.',
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Rivesti un tuo Costrutto Solido con un altro tuo Costrutto: il guscio esterno fa da scudo finché regge, poi si dissolve rivelando l'interno.",
        mostra_a: "MASTER",
      },
    ],
  },
];
