/**
 * Sorgente canonica Gōkaon — nomi, kanji, descrizioni, effetti catalogo.
 * Allineata a Oyasumi 2.0 (CS, tier, Skiru) + testo lignaggio originale.
 */

export type GokaonCatalogEntry = {
  slug: string;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string;
  poolName: string;
  flavor: string;
  meccanica: string;
  tags?: string[];
  cs?: number;
  tempoQuarti?: number;
  scelteAlLancio?: Array<{ id: string; label: string }>;
  /** Slug Skiru ammissibili per l'IR al lancio (solo attive). */
  skiruIr?: string[];
  effetti: unknown[];
};

function desc(kind: "passiva" | "attiva", flavor: string, meccanica: string): string {
  const header =
    kind === "passiva" ? "[Gōkaon · Passiva lignaggio]" : "[Gōkaon · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

export const GOKAON_CATALOG: GokaonCatalogEntry[] = [
  {
    slug: "yasei",
    nomeRomaji: "Yasei",
    nomeItaliano: "Natura Ferina",
    kanji: "野性",
    poolName: "Yasei (野性) — Natura Ferina",
    flavor:
      "La Jigo-Ka del Gōkaon, quando lasciata libera di scorrere d'istinto, si fa scura e calda: il segno di una bestia che osserva prima di colpire.",
    meccanica:
      "Passiva · CS 0 · scelta reciprocamente esclusiva con Cuore Affamato. Pressione (圧): non decade in combattimento; persa a fine combattimento. Con ≥1 stack: Jigo-Ka scura e calore percepibile a distanza ravvicinata. Guadagni Pressione: +1 se subisci danno (1/turno, non autoinflitto); +1 se spendi CS (1/turno); +1 se un nemico entro 8 m usa una waza (1/turno); +1 per movimento (max 2/turno); +2 una volta per quest sotto 50% HP.",
    effetti: [
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        operazione: "SCRIVI",
        chiave: "gokaon_sentiero",
        valore: "natura_ferina",
        nota_master: "Mutualmente esclusiva con Cuore Affamato (Gashin).",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Natura Ferina — guadagno Pressione (status pressione, max 12): +1 danno subito (1/turno, no autoinflitto); +1 CS spesi (1/turno); +1 waza nemica entro 8 m (1/turno); +1 per movimento (max 2/turno); +2 sotto 50% HP (1/quest). Non decade in combattimento; azzerata a fine combattimento.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 1",
        testo:
          "Con ≥1 stack Pressione: Jigo-Ka visivamente alterata (tonalità scura, calore a distanza ravvicinata).",
        mostra_a: "TUTTI",
      },
    ],
  },
  {
    slug: "gashin",
    nomeRomaji: "Gashin",
    nomeItaliano: "Cuore Affamato",
    kanji: "餓心",
    poolName: "Gashin (餓心) — Cuore Affamato",
    flavor:
      "In altri, la stessa pressione non resta latente: preme contro la pelle dall'interno, finché qualcosa non cede.",
    meccanica:
      "Passiva · CS 0 · scelta reciprocamente esclusiva con Natura Ferina. Pressione (圧): non decade in combattimento; persa a fine combattimento. Con ≥1 stack: vene in rilievo, screpolature sulla pelle, calore corporeo elevato. Guadagni Pressione: +1 se infliggi danno (max 2/turno); +1 se recuperi CS (1/turno); +1 se ricevi status negativo (1/turno); +1 se chiudi il turno con attacco o waza a Contatto (1/turno).",
    effetti: [
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        operazione: "SCRIVI",
        chiave: "gokaon_sentiero",
        valore: "cuore_affamato",
        nota_master: "Mutualmente esclusiva con Natura Ferina (Yasei).",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Cuore Affamato — guadagno Pressione (status pressione, max 12): +1 danno inflitto (max 2/turno); +1 CS recuperati (1/turno); +1 status negativo ricevuto (1/turno); +1 chiusura turno con attacco/waza a Contatto (1/turno). Non decade in combattimento; azzerata a fine combattimento.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 1",
        testo:
          "Con ≥1 stack Pressione: segni visivi di tensione (vene, screpolature, calore corporeo).",
        mostra_a: "TUTTI",
      },
    ],
  },
  {
    slug: "oni-no-kyukaku",
    nomeRomaji: "Oni no Kyūkaku",
    nomeItaliano: "Fiuto dell'Ogre",
    kanji: "鬼の嗅覚",
    poolName: "Oni no Kyūkaku (鬼の嗅覚) — Fiuto dell'Ogre",
    flavor:
      "La Jigo-Ka del Gōkaon permea i recettori olfattivi dell'analista: non sente più odori convenzionali, ma traduce stimoli chimici in informazioni istintive su chi lo circonda.",
    meccanica:
      "Passiva · CS 0 · costante. Raggio 15 m (20 m con ≥1 stack Pressione). Percepisci viventi biologici non visibili; ferite sotto 50% HP (binario); profili olfattivi permanenti (contatto ravvicinato 2 m, ≥1 turno). Con 1/4 su bersaglio visibile: fascia istintiva Preda / Rivale / Minaccia. Non sostituisce la vista né rivela status.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Fiuto costante entro 15 m. Viventi biologici non visibili: direzione generale + distanza approssimativa (vicino/medio/lontano). Barriere sigillate ermetiche bloccano. No bersagli senza corpo biologico.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 1",
        testo: "Con ≥1 stack Pressione: raggio fiuto esteso a 20 m.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Ferita: percepisci se un vivente entro raggio è sotto 50% HP (sì/no). Sotto soglia: direzione più precisa. Non rivela tipo o fonte del danno né status specifici.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Profilo olfattivo permanente: contatto ravvicinato ≤2 m per almeno 1 turno. Riconoscimento immediato al rientro in raggio.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Minaccia (1/4): su vivente visibile entro raggio, sensazione viscerale Preda / Rivale / Minaccia (potenza complessiva: Skiru + CS). Non sostituisce la vista per risolvere attacchi.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "oni-no-mezame",
    nomeRomaji: "Oni no Mezame",
    nomeItaliano: "Risveglio dell'Oni",
    kanji: "鬼の目覚め",
    poolName: "Oni no Mezame (鬼の目覚め) — Risveglio dell'Oni",
    flavor:
      "La Pressione (圧) accumulata forza il corpo a mutare. Le trasformazioni si attivano alle soglie corrispondenti e conferiscono lo status Metamorfosi — non si possono rifiutare.",
    meccanica:
      "Passiva · CS 0 · automatica. Soglia 1 Comunione (2+): +2 Nintai, Metamorfosi; Natura Ferina +1 Binshō e occhio verticale; Cuore Affamato +1 Kairyoku e corno. Soglia 2 Simbiosi (5+): +3 Nintai, Contatto 3 m, stack Metamorfosi aggiuntivi; bonus sentiero. Soglia 3 Rovina (9+): trasformazione completa, taglia Grande (Cuore Affamato), 3 occhi (Natura Ferina), bonus danno al prossimo Contatto per metro percorso; malus: Metamorfosi −2 stack/turno a fine turno.",
    effetti: [
      {
        tipo: "APPLICA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        status: "metamorfosi",
        stack: 1,
        condizione: "stack(pressione) >= 2",
        nota_master: "Soglia 1 Comunione (2+ Pressione): +1 Metamorfosi.",
      },
      {
        tipo: "APPLICA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        status: "metamorfosi",
        stack: 1,
        condizione: "stack(pressione) >= 5",
        nota_master: "Soglia 2 Simbiosi (5+ Pressione): +1 Metamorfosi aggiuntivo (cumulativo).",
      },
      {
        tipo: "APPLICA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        status: "metamorfosi",
        stack: 1,
        condizione: "stack(pressione) >= 9",
        nota_master: "Soglia 3 Rovina (9+ Pressione): +1 Metamorfosi aggiuntivo (cumulativo).",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "nintai",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "stack(pressione) >= 2",
        nota_master: "Soglia 1 Comunione (2+ Pressione): tutti i sentieri.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 1 },
        condizione: "stack(pressione) >= 2",
        nota_master: "Soglia 1 Comunione (2+ Pressione): solo Cuore Affamato.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 1 },
        condizione: "stack(pressione) >= 2",
        nota_master: "Soglia 1 Comunione (2+ Pressione): solo Natura Ferina.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "nintai",
        valore: { tipo: "FISSO", n: 3 },
        condizione: "stack(pressione) >= 5",
        nota_master: "Soglia 2 Simbiosi (5+ Pressione): cumulativo con Soglia 1.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "stack(pressione) >= 5",
        nota_master: "Soglia 2 Simbiosi (5+ Pressione): solo Cuore Affamato.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 1 },
        condizione: "stack(pressione) >= 5",
        nota_master: "Soglia 2 Simbiosi (5+ Pressione): solo Cuore Affamato.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "stack(pressione) >= 5",
        nota_master: "Soglia 2 Simbiosi (5+ Pressione): solo Natura Ferina.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 1 },
        condizione: "stack(pressione) >= 5",
        nota_master: "Soglia 2 Simbiosi (5+ Pressione): solo Natura Ferina.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 3 },
        condizione: "stack(pressione) >= 9",
        nota_master: "Soglia 3 Rovina (9+ Pressione): solo Cuore Affamato.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "stack(pressione) >= 9",
        nota_master: "Soglia 3 Rovina (9+ Pressione): solo Cuore Affamato.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "binsho",
        valore: { tipo: "FISSO", n: 3 },
        condizione: "stack(pressione) >= 9",
        nota_master: "Soglia 3 Rovina (9+ Pressione): solo Natura Ferina.",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "COMBATTIMENTO" },
        skiru: "kairyoku",
        valore: { tipo: "FISSO", n: 2 },
        condizione: "stack(pressione) >= 9",
        nota_master: "Soglia 3 Rovina (9+ Pressione): solo Natura Ferina.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 2",
        testo:
          "Soglia 1 Comunione: segni visivi (pelle ispessita, iridi iniettate; corno o occhio verticale in fronte per sentiero).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 5",
        testo:
          "Soglia 2 Simbiosi: volto deforme, zanne; gittata waza a Contatto 3 m.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 9",
        testo:
          "Soglia 3 Rovina: statura e corna complete, arti disumani — non riconoscibile; Cuore Affamato taglia Grande (anche armi); Natura Ferina 3 occhi (cosmetico). Per metro di movimento: bonus danno al prossimo Contatto (decade dopo il colpo o a fine turno).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        condizione: "stack(pressione) >= 9",
        testo:
          "Malus Soglia 3 Rovina: a fine turno, Metamorfosi perde 1 stack aggiuntivo (2 stack totali persi per turno invece di 1).",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "oni-no-ago",
    nomeRomaji: "Oni no Ago",
    nomeItaliano: "Mascella dell'Ogre",
    kanji: "鬼の顎",
    poolName: "Oni no Ago (鬼の顎) — Mascella dell'Ogre",
    flavor:
      "L'analista convoglia la Pressione nella mandibola: i denti si ispessiscono in zanne irregolari indurite dalla Jigo-Ka.",
    meccanica:
      "Attiva · [Contatto][Solido] · Tier base 2 · CS 2 + 2 stack Pressione (consumati) · 1/4. Morso singolo, danno = tier; se colpisce recuperi 2 CS. A 3+ Pressione: ignora 25% solidità costrutto (Kongen). A 5+ Pressione: cono 4 m — [Propagazione Conica][Solido].",
    tags: ["Contatto", "Solido"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kairyoku", "bakuryoku", "shintai-kokan"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Solido",
      },
      {
        tipo: "MOD_CS",
        trigger: "ALL_IMPATTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "RECUPERA",
        quantita: { tipo: "FISSO", n: 2 },
        nota_master: "Solo se il morso colpisce.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_COSTO",
        testo: "Costo: CS 2 + 2 stack Pressione (consumati al lancio).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 3",
        testo:
          "A 3+ Pressione al lancio: ignora 25% della solidità del costrutto (Kongen).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 5",
        testo:
          "A 5+ Pressione al lancio: bersaglio CONO 4 m — categoria Propagazione Conica Solida.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "jushi",
    nomeRomaji: "Jūshi",
    nomeItaliano: "Simbiosi",
    kanji: "獣肢",
    poolName: "Jūshi (獣肢) — Simbiosi",
    flavor:
      "L'analista concentra la Metamorfosi in un solo arto e lo spinge oltre ogni proporzione naturale.",
    meccanica:
      "Attiva · [Potenziamento][Nessuna] · Tier base 2 · CS 2 · 1/4 · un solo Arto Bestiale attivo. Braccio / Gamba / Testa / Coda / Ali / Dorso.",
    tags: ["Potenziamento"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kairyoku", "binsho", "nintai"],
    scelteAlLancio: [
      { id: "braccio", label: "Braccio" },
      { id: "gamba", label: "Gamba" },
      { id: "testa", label: "Testa" },
      { id: "coda", label: "Coda" },
      { id: "ali", label: "Ali" },
      { id: "dorso", label: "Dorso" },
    ],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "stack(metamorfosi) >= 1",
        testo: "Richiede almeno 1 stack di Metamorfosi attivo.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Braccio: raddoppia taglia; colpi con quell'arto +1 tier danno e Contatto +1 m; afferra Costrutti Solidi Grandi con una mano.",
        mostra_a: "MASTER",
        condizione: "@braccio",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Gamba: ispessimento; salto 4 m verticale/orizzontale; atterraggio danno = tier in area 2 m [Contatto][Solido].",
        mostra_a: "MASTER",
        condizione: "@gamba",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Testa: cranio deformato, corna ramificate; waza con testa +1 tier; testate valide (danno = tier base).",
        mostra_a: "MASTER",
        condizione: "@testa",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Coda: erompe dalla schiena; 1 attacco extra Contatto Solido (danno = tier) nello stesso quarto di un altro attacco con un arto, senza quarto aggiuntivo.",
        mostra_a: "MASTER",
        condizione: "@coda",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Ali: ali ossee/membranose — no volo libero; sollevi fino a 4 m e plani (4 m orizzontali per metro di dislivello); atterri a fine turno.",
        mostra_a: "MASTER",
        condizione: "@ali",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Dorso: spine ossee; chi colpisce da dietro o a Contatto subisce danno = tier automatico; abilita proiettili ossei aggiuntivi (Proiettile osseo) finché l'arto resta attivo.",
        mostra_a: "MASTER",
        condizione: "@dorso",
      },
    ],
  },
  {
    slug: "oni-no-hoko",
    nomeRomaji: "Oni no Hōkō",
    nomeItaliano: "Ruggito dell'Oni",
    kanji: "鬼の咆哮",
    poolName: "Oni no Hōkō (鬼の咆哮) — Ruggito dell'Oni",
    flavor: "L'analista apre la bocca e l'aria si piega sotto il peso del suono.",
    meccanica:
      "Attiva · [Propagazione Conica][Sonoro] · Tier base 2 · CS 2 · 1/4. Cono 6 m: danno = tier; Vertigini se perde IR. Costrutti: +1 tier danno. A 3+ Pressione: spinta indietro 3 m.",
    tags: ["Propagazione Conica", "Sonoro"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["bakuryoku", "kensei", "goatsu"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "CONO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Sonoro",
        area: { forma: "cono", profondita_m: 6 },
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "TUTTI_IN_AREA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        nota_master: "Solo Costrutti nell'area.",
      },
      {
        tipo: "APPLICA_STATUS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        status: "vertigini",
        stack: 1,
        nota_master: "Solo se il bersaglio perde il confronto d'IR.",
      },
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        condizione: "stack(pressione) >= 3",
        testo: "A 3+ stack Pressione al lancio: spinge indietro di 3 m ogni bersaglio colpito.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "moshin",
    nomeRomaji: "Mōshin",
    nomeItaliano: "Impeto feroce",
    kanji: "猛進",
    poolName: "Mōshin (猛進) — Impeto feroce",
    flavor:
      "L'analista si lancia in avanti senza più calcolare la distanza che lo separa dall'ostacolo.",
    meccanica:
      "Attiva · [Contatto][Solido] · Tier base 2 · CS 2 · 1/4. Carica 10 m in linea retta: danno = tier sul percorso, sbalzo laterale 2 m; ostacolo inamovibile — danno = tier a te, doppio all'ostacolo. Danno durante la carica: +1 Ira. A 5+ Pressione: [Energetica], gittata 15 m.",
    tags: ["Contatto", "Solido"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kairyoku", "undo", "bakuryoku"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "LINEA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Solido",
        area: { forma: "linea", profondita_m: 10 },
      },
      {
        tipo: "APPLICA_STATUS",
        trigger: "QUANDO_SUBISCI_DANNO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        status: "ira",
        stack: 1,
        nota_master: "Solo se subisci danno durante la carica.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Non ti fermi fino a 10 m o ostacolo inamovibile. Ogni bersaglio sul percorso: sbalzo laterale 2 m.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 5",
        testo: "A 5+ Pressione: consistenza Energetica, gittata 15 m.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kotsudan",
    nomeRomaji: "Kotsudan",
    nomeItaliano: "Proiettile osseo",
    kanji: "骨弾",
    poolName: "Kotsudan (骨弾) — Proiettile osseo",
    flavor:
      "L'analista spezza un corno o uno spuntone generato dalla Metamorfosi e lo scaglia, ancora caldo di Jigo-Ka.",
    meccanica:
      "Attiva · [Proiettile][Solido] · Tier base 1 · CS 1 · 1/4. Richiede ≥1 stack Metamorfosi. Gittata 12 m, danno = tier; corno resta come Costrutto Solido (solidità da Kongen = tier). Vivente colpito: Emorragia. A 3+ Pressione: espulsione da qualunque parte del corpo (non furtiva).",
    tags: ["Proiettile", "Solido"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["seimitsu", "kensei", "bakuryoku"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Solido",
        condizione: "stack(metamorfosi) >= 1",
        nota_master: "Gittata 12 m. Inutilizzabile senza Metamorfosi.",
      },
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "ALL_IMPATTO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "PERSISTENTE" },
        taglia: "Piccola",
        consistenza: "Solido",
        resistenza: { tipo: "TIER" },
        comportamento: "STATICO",
        condizione: "stack(metamorfosi) >= 1",
        nota_master: "Corno conficcato al punto d'impatto; solidità = tier (da Kongen).",
      },
      {
        tipo: "APPLICA_STATUS",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        status: "emorragia",
        stack: 1,
        condizione: "stack(metamorfosi) >= 1",
        nota_master: "Solo bersaglio vivente colpito.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "stack(pressione) >= 3",
        testo:
          "A 3+ Pressione: proiettile espulso da qualunque parte del corpo (visibile, non furtivo).",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "jiware",
    nomeRomaji: "Jiware",
    nomeItaliano: "Spezza-terra",
    kanji: "地割れ",
    poolName: "Jiware (地割れ) — Spezza-terra",
    flavor:
      "Il colpo non cerca un bersaglio: cerca il terreno, e lascia che sia il terreno a portare il colpo agli altri.",
    meccanica:
      "Attiva · [Propagazione][Solido] · Tier base 2 · CS 2 · 1/4. Onda sismica sul suolo, raggio 6 m: danno = tier ai bersagli a contatto col terreno. Costrutti a terra: +1 tier. A 5+ Pressione: onda anche in altezza, copre l'area.",
    tags: ["Propagazione", "Solido"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["kairyoku", "bakuryoku", "goatsu"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "AREA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Solido",
        area: { forma: "cerchio", raggio_m: 6 },
        nota_master: "Solo bersagli a contatto col terreno.",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "TUTTI_IN_AREA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        nota_master: "Solo Costrutti a contatto col terreno nell'area.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "stack(pressione) >= 5",
        testo:
          "A 5+ Pressione: l'onda si sviluppa in altezza mimando un'onda d'urto, coprendo l'intera area (6 m).",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "doka",
    nomeRomaji: "Dōka",
    nomeItaliano: "Assimilazione",
    kanji: "同化",
    poolName: "Dōka (同化) — Assimilazione",
    flavor:
      "L'analista afferra un Costrutto e lo assorbe nel proprio corpo, scomponendolo in qualcosa che può usare.",
    meccanica:
      "Attiva · [Nessuna] · CS 1 · 1/4 (+1/4 se Costrutto nemico, per afferrarlo). Assorbe Costrutto Piccolo o Media. Per 3 turni: Solido +2 Itami (mitigazione); Liquido rigenera 2 CS; Energetico +1 tier danno Contatto; Elementale — 1 stack status elementale su Contatto.",
    tags: ["Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["nintai", "kairyoku", "itami"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "PRE_COSTO",
        testo: "Costo: CS 1 · +1/4 se il Costrutto bersaglio è nemico (afferrarlo prima).",
        mostra_a: "MASTER",
      },
      {
        tipo: "BUFF_SKIRU",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        skiru: "itami",
        valore: { tipo: "FISSO", n: 2 },
        nota_master:
          "Effetto se Consistenza assorbita: Solido (+1 tier mitigazione tramite Itami).",
      },
      {
        tipo: "MOD_CS",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        operazione: "RECUPERA",
        quantita: { tipo: "FISSO", n: 2 },
        nota_master: "Effetto se Consistenza assorbita: Liquido (all'assimilazione).",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        valore: { tipo: "TIER_DELTA", n: 1 },
        filtro_waza: { tag: ["Contatto"] },
        nota_master: "Effetto se Consistenza assorbita: Energetico.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Elementale assorbito: i colpi a Contatto applicano 1 stack dello status elementale del Costrutto. Un solo effetto attivo per assimilazione, in base alla Consistenza distrutta.",
        mostra_a: "MASTER",
      },
    ],
  },
];

export function gokaonDescrizione(entry: GokaonCatalogEntry): string {
  const kind = entry.cs != null && entry.cs > 0 ? "attiva" : "passiva";
  return desc(kind, entry.flavor, entry.meccanica);
}
