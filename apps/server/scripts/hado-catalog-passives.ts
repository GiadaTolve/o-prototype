/**
 * Hadō-dō passive — guida codifica + testi da hado-waza-pool.
 */
import type { HadoCatalogEntry } from "./hado-catalog-types";

export const HADO_PASSIVES: HadoCatalogEntry[] = [
  {
    slug: "chikuden-batteria",
    nomeRomaji: "Chikuden",
    nomeItaliano: "Batteria",
    kanji: "蓄電",
    poolName: "Chikuden (蓄電) — Batteria",
    flavor:
      "L'analista lascia parte di sé dentro un oggetto: una carica latente che aspetta solo di essere ripresa — o di esplodere.",
    meccanica:
      "Passiva · CS 0, applica il tag Batteria. Depositi fino a 5 CS in un tuo Costrutto, che le trattiene a lungo; le riprendi, in tutto o in parte, toccandolo. È la keystone di tutte le interazioni con il tag Batteria.",
    effetti: [
      {
        tipo: "MOD_CS",
        trigger: "A_COMANDO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "DEPOSITA",
        quantita: { tipo: "FISSO", n: 5 },
        nota_master:
          "Deposita fino a 5 CS in un tuo Costrutto (tag Batteria). Le riprendi, in tutto o in parte, toccandolo.",
      },
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo: "Il Costrutto riceve il tag Batteria. Keystone Hadō per Tanraku, Maikomi, Rensa-Baku.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Tag Batteria su costrutto → Master finché manca condizione tag_batteria."],
  },
  {
    slug: "gyakuryu-riflusso",
    nomeRomaji: "Gyakuryū",
    nomeItaliano: "Riflusso",
    kanji: "逆流",
    poolName: "Gyakuryū (逆流) — Riflusso",
    flavor: "Ciò che porta la tua energia, torna a te per la via più rapida.",
    meccanica:
      "Passiva · CS 0. Richiami a te un Costrutto permeato della tua energia: torna in mano per la traiettoria più veloce. Armi piccole o medie tornano istantaneamente; oggetti più grandi a discrezione della distanza e delle circostanze.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Richiami a te un Costrutto permeato della tua energia: torna in mano per la traiettoria più veloce. Armi piccole/medie istantaneamente; oggetti più grandi a discrezione di distanza e circostanze.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "teishuha-onda-bassa",
    nomeRomaji: "Teishūha",
    nomeItaliano: "Onda Bassa",
    kanji: "低周波",
    poolName: "Teishūha (低周波) — Onda Bassa",
    flavor: "Una pulsazione invisibile esplora lo spazio e ti rivela ogni fonte d'energia.",
    meccanica:
      "Passiva · CS 0. Espandi una sfera d'energia invisibile per 8 m: rivela ogni fonte di Jigo-Ka nel raggio (chi è investito sente un lieve tepore). Usabile attraverso un tuo Costrutto entro 8 m; se ha il tag Batteria, la gittata raddoppia.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Espandi una sfera invisibile per 8 m: rivela ogni fonte di Jigo-Ka nel raggio. Usabile attraverso un tuo Costrutto entro 8 m; se ha tag Batteria, gittata ×2.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kanshi-occhio-remoto",
    nomeRomaji: "Kanshi",
    nomeItaliano: "Occhio Remoto",
    kanji: "監視",
    poolName: "Kanshi (監視) — Occhio Remoto",
    flavor: "Chiudi gli occhi, e vedi da altrove.",
    meccanica:
      "Passiva · CS 0. Depositi energia in un tuo Costrutto, che la trattiene un paio d'ore; chiudendo entrambi gli occhi ottieni vista e udito completi dal punto di vista del Costrutto.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "A_COMANDO",
        testo:
          "Depositi energia in un tuo Costrutto (la trattiene un paio d'ore); chiudendo entrambi gli occhi ottieni vista e udito completi dal suo punto di vista.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "fuantei-deflagrazione-instabile",
    nomeRomaji: "Fuantei",
    nomeItaliano: "Deflagrazione Instabile",
    kanji: "不安定",
    poolName: "Fuantei (不安定) — Deflagrazione Instabile",
    flavor: "Nessun colpo si limita a colpire: lascia dietro di sé un'eco che esplode.",
    meccanica:
      "Passiva · CS 0 (+1 CS al lancio). Al lancio paghi +1 CS per un effetto aggiuntivo secondo la categoria: Proiettile → esplosione all'impatto (stessa consistenza, 3 m); Raggio → colpo concatenato a un altro bersaglio entro 6 m; Emanazione, Propagazione Conica o Emissione a distanza → +4 m di gittata.",
    effetti: [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        delta_cs: 1,
        nota_master: "+1 CS al lancio per attivare l'effetto Fuantei (se il PG lo sceglie).",
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo:
          "Effetto secondo categoria: Proiettile → esplosione all'impatto (stessa consistenza, 3 m); Raggio → colpo concatenato entro 6 m; Emanazione / Propagazione Conica / Emanazione a Distanza → +4 m gittata.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "kaatsu-sovrapressione",
    nomeRomaji: "Kaatsu",
    nomeItaliano: "Sovrapressione",
    kanji: "加圧",
    poolName: "Kaatsu (加圧) — Sovrapressione",
    flavor: "Più trattieni, più ciò che esce fa male.",
    meccanica:
      "Passiva · CS 0. È l'innesco della meccanica Atsuryoku: quando sei in Pressione (CS ≥ 12), la prossima waza Emanazione, Propagazione o Energetica ottiene +1 tier. Cumulabile con altri bonus.",
    effetti: [
      {
        tipo: "MOD_DANNO",
        trigger: "PRE_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        condizione: "cs_correnti >= 12",
        filtro_waza: { tag: ["Emanazione", "Propagazione", "Energetica"] },
        nota_master: "In Pressione (CS ≥ 12). Cumulabile con altri bonus.",
      },
    ],
  },
  {
    slug: "kantsu-calibro-pesante",
    nomeRomaji: "Kantsū",
    nomeItaliano: "Calibro Pesante",
    kanji: "貫通",
    poolName: "Kantsū (貫通) — Calibro Pesante",
    flavor: "Il raggio non si ferma: trapassa e prosegue.",
    meccanica:
      "Passiva · CS 0. Una tua waza Raggio non si arresta al primo bersaglio: prosegue infliggendo −25% di danno a ogni bersaglio successivo.",
    effetti: [
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "MOLT", x: 0.75 },
        filtro_waza: { tag: ["Raggio"] },
        nota_master:
          "Il Raggio non si arresta al primo bersaglio: −25% danno a ogni bersaglio successivo.",
      },
    ],
  },
  {
    slug: "sorashi-deviazione",
    nomeRomaji: "Sorashi",
    nomeItaliano: "Deviazione",
    kanji: "逸らし",
    poolName: "Sorashi (逸らし) — Deviazione",
    flavor: "L'onda non para né schiva: scosta.",
    meccanica:
      "Passiva · CS 0 (costo variabile). Su una tua Propagazione Conica o Emanazione, paghi +1 CS per deviare ogni oggetto di taglia Piccola incontrato, +3 CS per allontanare uno di taglia Media. Non è parata né schivata: è deviazione, con esiti variabili.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Su una tua Propagazione Conica o Emanazione: +1 CS per deviare ogni oggetto Piccolo incontrato, +3 CS per allontanare uno Medio. Deviazione (non parata/schivata), esiti variabili.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "howa-saturazione",
    nomeRomaji: "Hōwa",
    nomeItaliano: "Saturazione",
    kanji: "飽和",
    poolName: "Hōwa (飽和) — Saturazione",
    flavor: "Il secondo colpo trova la breccia aperta dal primo.",
    meccanica:
      "Passiva · CS 0. Se colpisci lo stesso bersaglio con 2 waza nello stesso turno, la seconda ottiene +1 tier di danno.",
    effetti: [
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        nota_master:
          "Seconda waza sullo stesso bersaglio nel turno: +1 tier. Condizione «2 colpi stesso bersaglio» → Master se non modellata.",
      },
    ],
    implementazioneNote: ["Doppio colpo stesso bersaglio stesso turno → Master (🔴 parziale)."],
  },
  {
    slug: "fukitobashi-spinta-urto",
    nomeRomaji: "Fukitobashi",
    nomeItaliano: "Spinta d'Urto",
    kanji: "吹き飛ばし",
    poolName: "Fukitobashi (吹き飛ばし) — Spinta d'Urto",
    flavor: "Ogni proiettile è anche un pugno d'aria che spazza via.",
    meccanica:
      "Passiva · CS 0. Le tue waza Proiettile creano all'impatto una zona di 3 m che spinge via di 4 m chiunque sia a gittata.",
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "ALL_IMPATTO",
        testo:
          "Le tue waza Proiettile creano all'impatto una zona di 3 m che spinge via di 4 m chi è a gittata (Modifica traiettoria: Spingi).",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Zona 3 m su impatto Proiettile → Master o MOD_TRAIETTORIA SPINGI in futuro."],
  },
];
