/**
 * Genzai-dō waza di grado — testi verbatim da genzai-waza-pool + automazione domain.
 */
import type { GenzaiCatalogEntry } from "./genzai-catalog-types";

export const GENZAI_AVANZATE: GenzaiCatalogEntry[] = [
  {
    slug: "meisaku-opera-prima",
    nomeRomaji: "Meisaku",
    nomeItaliano: "Opera Prima",
    kanji: "銘作",
    poolName: "Meisaku (銘作) — Opera Prima",
    flavor:
      "L'analista non scrive una frase: scrive la frase. Le linee si tracciano fitte e lente, geometria precisa e caotica insieme, finché il sigillo si chiude su sé stesso e non sbiadisce più. È il gesto di Tenkan, la Corona che nomina, portato fino in fondo: una cosa dichiarata esistente che il mondo non riesce più a dimenticare. Finché la regge, Shiju non ha presa su di lei.",
    meccanica:
      "Attiva · [Costrutto][Solido] · CS 6 · 2/4 (scrittura precisa) · grado richiesto: Sentatsu Bunsekikan [SB]. Materializzi la tua Opera Prima, un [Costrutto][Solido] permanente e unico (una sola attiva alla volta). Resistenza tier 5 (23); forma a tua scelta, fissata alla creazione; taglia fino a [Grande]. Il suo Mei è inviolabile: non conta nel limite Gosa e non è mai il sigillo che si incrina. Non si dissolve col tempo. Se distrutta, puoi ri-dichiararla — stessa Opera Prima — dedicando un turno intero e pagandone di nuovo il costo.",
    tier: 3,
    tags: ["Costrutto", "Solido"],
    cs: 6,
    tempoQuarti: 2,
    skiruIr: ["fudoshin", "kansatsu", "kongen"],
    effetti: [
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "PERSISTENTE" },
        operazione: "SCRIVI",
        chiave: "genzaiMeisakuActive",
        valore: true,
        nota_master: "Una sola Opera Prima attiva alla volta. Tag [meisaku:Nome] opzionale.",
      },
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "PERSISTENTE" },
        taglia: "Grande",
        consistenza: "Solido",
        resistenza: { tipo: "FISSO", n: 23 },
        comportamento: "STATICO",
        mei: { inviolabile: true },
        nota_master:
          "Opera Prima permanente. Resistenza tier 5 (23), superiore ai costrutti normali. Forma fissata alla creazione.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "grado_pg >= Sentatsu Bunsekikan",
        testo: "Requisito: grado Sentatsu Bunsekikan [SB] o superiore.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Mei inviolabile: non conta nel limite Gosa e non è mai il sigillo che si incrina. Non si dissolve col tempo.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Se distrutta: ri-dichiarazione (turno intero + stesso costo CS 6). Tag fine: [meisaku:fine]. Automazione: meisaku.ts.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Sentatsu Bunsekikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Stato runtime Opera Prima: packages/domain/src/styles/genzai/meisaku.ts + waza-chat-automation.ts.",
    ],
  },
  {
    slug: "shinryaku-invasione",
    nomeRomaji: "Shinryaku",
    nomeItaliano: "Invasione",
    kanji: "侵略",
    poolName: "Shinryaku (侵略) — Invasione",
    flavor:
      "Non un disegno paziente, ma uno strappo. L'analista punta un dito e la realtà, in quel punto, è costretta a far spazio: una massa solida si scrive tutta in una volta, con un suono secco, scaraventando via ciò che occupava il posto. È creazione oltre l'umano — non si chiede permesso al mondo, lo si occupa.",
    meccanica:
      "Attiva · [Costrutto][Solido] · Tier base 5 · CS 7 · 1/4 · grado richiesto: Kanteikan [K]. Materializzi istantaneamente un [Costrutto][Solido] di taglia [Grande] in un punto visibile entro 12 m. Tutto ciò che occupa il punto è investito dall'apparizione: i bersagli a contatto subiscono danno = tier (23) e sono sbalzati di 4 m; ogni [Costrutto] di taglia inferiore alla [Grande] nel punto viene distrutto. Il costrutto generato dura 3 turni, ha Resistenza tier 4 (17), forma a tua scelta.",
    tier: 5,
    tags: ["Costrutto", "Solido"],
    cs: 7,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu", "kongen"],
    effetti: [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "TURNI", n: 3 },
        taglia: "Grande",
        consistenza: "Solido",
        resistenza: { tipo: "FISSO", n: 17 },
        comportamento: "STATICO",
        nota_master:
          "Apparizione istantanea entro 12 m (punto visibile). Forma a scelta. Tag [shinryaku:Nome] opzionale.",
      },
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Solido",
        nota_master:
          "Bersagli a contatto col punto d'apparizione: danno = tier (23). Tag [shinryaku:contatto:Nome] o [shinryaku:contatto:id:uuid].",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "grado_pg >= Kanteikan",
        testo: "Requisito: grado Kanteikan [K] o superiore.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Investiti dall'apparizione: sbalzo 4 m. Ogni Costrutto di taglia inferiore a Grande nel punto viene distrutto.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Kanteikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Contatto Invasione: shinryaku.ts + waza-chat-automation.ts (danno tier 5).",
    ],
  },
  {
    slug: "rakuen-eden",
    nomeRomaji: "Rakuen",
    nomeItaliano: "Eden",
    kanji: "楽園",
    poolName: "Rakuen (楽園) — Eden",
    flavor:
      "L'analista smette di scrivere sul mondo e comincia a scrivere il mondo. Imprime il proprio Ego sulla realtà attorno a sé: il suolo si riveste della sua geometria, ogni superficie si incide del suo Mei, la luce prende il colore della sua Jigo-Ka. Dentro questo cerchio non esiste più il margine d'errore — ciò che traccia non scivola verso Shiju, perché qui Shiju non è mai stato invitato.",
    meccanica:
      "Attiva · [Emanazione][Nessuna] · CS 8 + mantenimento · 1/4 · grado richiesto: Shin'enkan [S]. Per 4 turni, l'area in raggio 10 m attorno a te (ti segue) diventa il tuo mondo interiore reso tangibile. Entro l'Eden:\n\n— i tuoi [Costrutti] non si dissolvono (permangono oltre la scadenza normale finché l'Eden regge) e il limite Gosa è sospeso — nessun Mei si incrina;\n\n— ogni tuo [Costrutto] distrutto viene rigenerato all'inizio del tuo turno successivo al costo di 2 CS ciascuno;\n\n— hai percezione continua della posizione di ogni essere vivente nell'Eden.",
    tier: 5,
    tags: ["Emanazione", "Nessuna"],
    cs: 8,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu", "shodo"],
    effetti: [
      {
        tipo: "ZONA",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 4 },
        forma_zona: "cerchio",
        raggio_zona_m: 10,
        ancoraggio: "SEGUE_ANALISTA",
        effetti_zona: {},
        nota_master: "Eden: mondo interiore reso tangibile per 4 turni (ti segue).",
      },
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 4 },
        operazione: "SCRIVI",
        chiave: "genzaiEdenTurnsLeft",
        valore: 4,
        nota_master: "Attivazione Eden (CS 8). Mantenimento Jigo-Ka secondo costo waza.",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        condizione: "grado_pg >= Shin'enkan",
        testo: "Requisito: grado Shin'enkan [S] o superiore.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Entro l'Eden: i tuoi Costrutti non si dissolvono (oltre scadenza normale); limite Gosa sospeso — nessun Mei si incrina.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "INIZIO_TURNO",
        testo:
          "Rigenerazione: ogni tuo Costrutto distrutto in Eden può tornare all'inizio del tuo turno successivo — 2 CS ciascuno. Tag [eden:rigenera] o [eden:rigenera:N].",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo: "Percezione continua della posizione di ogni essere vivente nell'Eden (raggio 10 m).",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Shin'enkan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Stato runtime Eden: packages/domain/src/styles/genzai/rakuen.ts + waza-chat-automation.ts.",
    ],
  },
];
