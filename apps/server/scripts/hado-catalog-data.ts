/**
 * Sorgente canonica Hadō-dō — testi e meccaniche da hado-waza-pool (manuale Oyasumi).
 */
import { HADO_ACTIVES } from "./hado-catalog-actives";
import { HADO_PASSIVES } from "./hado-catalog-passives";
import type { HadoCatalogEntry } from "./hado-catalog-types";

export type { HadoCatalogEntry } from "./hado-catalog-types";

function desc(kind: "passiva" | "attiva", flavor: string, meccanica: string): string {
  const header =
    kind === "passiva" ? "[Hadō-dō · Passiva lignaggio]" : "[Hadō-dō · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

/** Meccanica verbatim dal manuale (effect in hado-waza-pool). */
const TOSHI_MECCANICA =
  "Attiva · [Nessuna][Potenziamento] · CS 2 (apertura) · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Apri un [Investimento] su di te. Per 3 turni, ogni quarto e a ogni lancio di waza puoi spostare CS dal tuo serbatoio nell'Investimento (riserva separata: non conta verso l'Overheat). In qualsiasi momento entro la durata puoi riscuotere rilasciando tutto l'Investimento insieme a una singola waza: questa ottiene +2 danno (piatto) e +1 m di gittata per ogni CS investito.\n\n↳ Se vieni reso incosciente, o passi un intero turno senza versare nell'Investimento, lo perdi.";

const SHAKKIN_MECCANICA =
  "Attiva · [Contatto] → [Emanazione a Distanza][Energetica] · CS 5 · 1/4 · grado richiesto: Kanteikan [K]. Colpisci un bersaglio a [Contatto] e gli imponi un [Debito] (status): inietti 2 stack iniziali. Per 3 turni:\n\n— Interessi: all'inizio di ogni tuo turno, il Debito cresce di +1 stack (max 6);\n\n— Restituzione: ogni volta che il bersaglio ti colpisce con una waza a [Contatto], il Debito cala di 1 stack.\n\nRiscossione (a comando, 1/4, oppure automatica alla scadenza): tutte le stack si convertono in un'esplosione [Energetico][Emanazione a Distanza] centrata sul bersaglio, raggio 3 m, danno = 5 per stack. Massimo un Debito per bersaglio. Se l'analista è reso incosciente, il Debito si dissolve.";

const HADO_AVANZATE: HadoCatalogEntry[] = [
  {
    slug: "toshi-investimento-energetico",
    nomeRomaji: "Tōshi",
    nomeItaliano: "Investimento Energetico",
    kanji: "投資",
    poolName: "Tōshi (投資) — Investimento Energetico",
    flavor:
      "L'analista smette di spendere e comincia a versare. Ogni gesto, ogni colpo, lascia una parte di sé in un serbatoio che porta sotto la pelle: le venature di luce si moltiplicano, il respiro si fa corto, il corpo si gonfia di una pressione che non scarica — la trattiene, la conserva, la fa fruttare. Poi, in un solo istante scelto, riscuote tutto in un'unica onda nera.",
    meccanica: TOSHI_MECCANICA,
    tier: 3,
    tags: ["Nessuna", "Potenziamento"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu"],
    effetti: [
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        operazione: "SCRIVI",
        chiave: "hadoInvestimentoActive",
        valore: true,
        nota_master:
          "Apre [Investimento] per 3 turni. CS apertura 2 (costo waza). Riserva CS separata (non Overheat).",
      },
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        operazione: "SCRIVI",
        chiave: "hadoInvestimentoTurnsLeft",
        valore: 3,
      },
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        finestra_turni: 3,
        nota_master: "Finestra Investimento: versamenti e riscossione entro 3 turni.",
        rilasci: {
          a_comando: {
            tipo: "MANUALE",
            trigger: "A_COMANDO",
            testo:
              "Riscossione: tag [investimento:riscuoti] insieme a una singola waza — rilascia tutto il pool. Bonus: +2 danno piatto e +1 m gittata per ogni CS investito.",
            mostra_a: "MASTER",
          },
          scadenza: {
            tipo: "MANUALE",
            trigger: "A_SCADENZA",
            testo:
              "Scadenza durata o turno senza versamento CS: Investimento perso. Incoscienza: perso (Master).",
            mostra_a: "MASTER",
          },
        },
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
        trigger: "A_COMANDO",
        testo:
          "Versamento: tag [investimento:+N] — trasferisce N CS dal serbatoio Chrono alla riserva Investimento (ogni quarto e ad ogni lancio di waza).",
        mostra_a: "MASTER",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "FISSO", n: 2 },
        nota_master:
          "Per ogni CS riscosso (flatDamage = poolCs × 2; rangeBonusM = poolCs × 1). Automazione: investimento.ts.",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Fine turno: se Investimento attivo e non hai versato almeno 1 CS nel turno, lo perdi. Altrimenti decrementa durata.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Sentatsu Bunsekikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Stato runtime Investimento: packages/domain/src/styles/hado/investimento.ts + waza-chat-automation.ts.",
    ],
  },
  {
    slug: "shakkin-indebitamento",
    nomeRomaji: "Shakkin",
    nomeItaliano: "Indebitamento",
    kanji: "借金",
    poolName: "Shakkin (借金) — Indebitamento",
    flavor:
      "L'analista posa il palmo sul bersaglio e gli inietta ciò che nessuno ha chiesto: un prestito forzato di Jigo-Ka nera che si annidia nella carne e marchia la pelle del suo simbolo. Il debito non sta fermo — cresce a ogni alba, come ogni debito fa. L'unico modo per estinguerlo è restituirlo all'usuraio, colpo su colpo. Ma se l'analista decide di riscuotere, ciò che era stato prestato torna indietro tutto insieme, e l'interesse si paga in fuoco.",
    meccanica: SHAKKIN_MECCANICA,
    tier: 4,
    tags: ["Contatto", "Energetico"],
    cs: 5,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu"],
    effetti: [
      {
        tipo: "APPLICA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "TURNI", n: 3 },
        status: "debito",
        stack: 2,
        nota_master:
          "Richiede colpo a [Contatto]. 2 stack iniziali. Massimo un [Debito] attivo per bersaglio.",
      },
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "TURNI", n: 3 },
        finestra_turni: 3,
        nota_master: "Durata Debito: 3 turni dal contatto.",
        rilasci: {
          a_comando: {
            tipo: "DANNO",
            trigger: "A_COMANDO",
            bersaglio: "AREA",
            durata: { tipo: "ISTANTANEA" },
            valore: { tipo: "FISSO", n: 5 },
            consistenza: "Energetica",
            area: { forma: "cerchio", raggio_m: 3 },
            nota_master:
              "Riscossione tag [debito:riscuoti] o [shakkin:riscossione]: [Emanazione a Distanza] centrata sul bersaglio. Danno = 5 × stack.",
          },
          scadenza: {
            tipo: "DANNO",
            trigger: "A_SCADENZA",
            bersaglio: "AREA",
            durata: { tipo: "ISTANTANEA" },
            valore: { tipo: "FISSO", n: 5 },
            consistenza: "Energetica",
            area: { forma: "cerchio", raggio_m: 3 },
            nota_master: "Scadenza automatica: stessa conversione (5 danno per stack).",
          },
        },
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
        trigger: "INIZIO_TURNO",
        testo:
          "Interessi: all'inizio di ogni tuo turno, ogni Debito attivo +1 stack (max 6). Tag bersaglio: [debito:Nome] o [debito:id:uuid].",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "QUANDO_SUBISCI_DANNO",
        testo:
          "Restituzione: se il bersaglio ti colpisce con una waza a [Contatto], il suo Debito −1 stack. Tag opzionale: [debito:restituisci].",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo:
          "Se l'analista viene reso incosciente, tutti i Debiti attivi si dissolvono senza riscossione.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Kanteikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Stato runtime Debito: debito-shakkin.ts + status debito (stack). Automazione: waza-chat-automation.ts.",
    ],
  },
];

export const HADO_CATALOG: HadoCatalogEntry[] = [
  ...HADO_PASSIVES,
  ...HADO_ACTIVES,
  ...HADO_AVANZATE,
];

export function hadoDescrizione(entry: HadoCatalogEntry): string {
  const kind = entry.cs != null && entry.cs > 0 ? "attiva" : "passiva";
  return desc(kind, entry.flavor, entry.meccanica);
}

export function allHadoImplementazioneNotes(): string[] {
  const notes: string[] = [];
  for (const e of HADO_CATALOG) {
    for (const n of e.implementazioneNote ?? []) {
      if (!notes.includes(n)) notes.push(n);
    }
  }
  return notes;
}
