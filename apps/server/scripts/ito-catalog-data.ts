/**
 * Sorgente canonica Itō-dō — guida codifica allineata (19 waza, Giurisdizione/Decreto/Dominazione inclusi).
 */

export type ItoCatalogEntry = {
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
  scelteAlLancio?: Array<{ id: string; label: string }>;
  effetti: unknown[];
  implementazioneNote?: string[];
};

const TENSIONE_NOTA =
  "Tensione (緊張): ogni Costrutto/waza mantenuto filato +1 stack (status tensione, max 8). Soglia Cedimento = 2 + Fudōshin: oltre soglia un filo si spezza (−2 CS). Guadagno/perdita eventi → Master finché non c'è modulo styles/ito/tensione.ts completo.";

function desc(kind: "passiva" | "attiva", flavor: string, meccanica: string): string {
  const header =
    kind === "passiva" ? "[Itō-dō · Passiva lignaggio]" : "[Itō-dō · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

export const ITO_CATALOG: ItoCatalogEntry[] = [
  {
    slug: "ayatsuri-filo-burattinaio",
    nomeRomaji: "Ayatsuri",
    nomeItaliano: "Filo del Burattinaio",
    kanji: "操り",
    poolName: "Ayatsuri (操り) — Filo del Burattinaio",
    flavor:
      "L'analista tende un filo invisibile e ciò che tocca smette di appartenere alla terra: diventa Kugutsu, marionetta sospesa al suo volere.",
    meccanica:
      "Passiva · CS 0 · genera 1 Tensione finché attiva. Sollevi un Costrutto fino a taglia Media, controllandolo vagamente (muovi/scagli). Movimento = tuo Movimento (Undō) per Piccola, ×0,75 per Media.",
    tier: null,
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Sollevi un Costrutto fino a taglia Media (Kugutsu): controllo vago — muovi o scagli. Movimento = Undō per taglia Piccola, ×0,75 per Media. Genera 1 Tensione (status tensione) finché il filo resta attivo.",
        mostra_a: "MASTER",
      },
      {
        tipo: "MANUALE",
        trigger: "FINE_TURNO",
        testo: TENSIONE_NOTA,
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Manipolazione costrutto + Tensione → Master (🔴)."],
  },
  {
    slug: "someito-filo-tinto",
    nomeRomaji: "Someito",
    nomeItaliano: "Filo Tinto",
    kanji: "染め糸",
    poolName: "Someito (染め糸) — Filo Tinto",
    flavor:
      "Il filo si intinge della natura che l'analista sceglie, e la marionetta cambia sostanza lungo la corda.",
    meccanica: "Passiva · CS 0. Cambi liberamente la Consistenza dei Costrutti che hai generato.",
    tier: null,
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "consistenza",
        da_tag: "Solido",
        a_tag: "Liquido",
        oggetto: "COSTRUTTO",
        nota_master:
          "Master sceglie la consistenza destinazione tra i tipi ammessi; solo Costrutti generati da te.",
      },
    ],
  },
  {
    slug: "yugami-filo-deforme",
    nomeRomaji: "Yugami",
    nomeItaliano: "Filo Deforme",
    kanji: "歪み",
    poolName: "Yugami (歪み) — Filo Deforme",
    flavor:
      "Un gesto delle dita e la forma cede: la waza si comprime o si dilata in silenzio, mentre per un battito la Jigo-Ka dell'analista resta immobile.",
    meccanica:
      "Passiva · CS 0. Cambi la Categoria di una tua waza: Emanazione/Propagazione ↔ Propagazione Conica. Gittata ×1,5 (verso Conica) o ×0,5 (verso Emanazione/Propagazione). Origine → analista.",
    tier: null,
    effetti: [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "categoria",
        da_tag: "Emanazione",
        a_tag: "Propagazione Conica",
        oggetto: "WAZA_PROPRIA",
        nota_master: "Oppure Propagazione → Propagazione Conica. Origine waza → analista.",
        effetti_collaterali: [
          { tipo: "MOD_GITTATA", valore: { tipo: "MOLT", x: 1.5 } },
        ],
      },
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "categoria",
        da_tag: "Propagazione Conica",
        a_tag: "Emanazione",
        oggetto: "WAZA_PROPRIA",
        nota_master: "Inversa: Conica → Emanazione o Propagazione (Master sceglie). Origine → analista.",
        effetti_collaterali: [
          { tipo: "MOD_GITTATA", valore: { tipo: "MOLT", x: 0.5 } },
        ],
      },
    ],
  },
  {
    slug: "tazuna-redini",
    nomeRomaji: "Tazuna",
    nomeItaliano: "Redini",
    kanji: "手綱",
    poolName: "Tazuna (手綱) — Redini",
    flavor:
      "Il colpo non è mai libero: corre lungo redini che solo l'analista impugna. Può piegarlo a metà volo, o richiamarlo all'impatto perché prosegua altrove.",
    meccanica:
      "Passiva · CS 0 (Rimbalzo: +1 CS opzionale). Guida: cambi direzione di una tua waza Raggio/Proiettile fino a 180°. Rimbalzo: impatto prima di fine gittata → proseguimento nella direzione scelta (anche Sonore ad area, max 6 m; +1 CS per +4 m).",
    tier: null,
    effetti: [
      {
        tipo: "MOD_TRAIETTORIA",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "DEVIA",
        valore: { tipo: "FISSO", n: 180 },
        nota_master: "Solo waza proprie [Raggio] o [Proiettile]; deviazione fino a 180° durante l'esecuzione.",
      },
      {
        tipo: "MOD_TRAIETTORIA",
        trigger: "ALL_IMPATTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "RIMBALZA",
        costo_extra: { cs: 1 },
        nota_master:
          "Rimbalzo opzionale (+1 CS): se impatta prima di consumare la gittata, rimbalza nella direzione scelta per i metri rimasti. Vale anche waza Sonore ad area (rimbalzo fino a 6 m; +1 CS per allungare di 4 m).",
      },
    ],
  },
  {
    slug: "wakeito-filo-sdoppiato",
    nomeRomaji: "Wakeito",
    nomeItaliano: "Filo Sdoppiato",
    kanji: "分け糸",
    poolName: "Wakeito (分け糸) — Filo Sdoppiato",
    flavor: "Un filo che si biforca: la stessa volontà, due capi, due destini.",
    meccanica:
      "Passiva · CS 0. Waza Raggio → 2 diramazioni verso bersagli diversi (danno ×0,75 ciascuna); waza Proiettile → raddoppia di numero (danno ×0,75, stessa direzione).",
    tier: null,
    effetti: [
      {
        tipo: "MOD_TRAIETTORIA",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "SDOPPIA",
        nota_master: "Waza Raggio: due diramazioni verso bersagli diversi.",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "MOLT", x: 0.75 },
        filtro_waza: { tag: ["Raggio"] },
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Waza Proiettile: raddoppia di numero (stessa direzione); danno ×0,75 per ciascun proiettile.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "hikitome-trattenuta",
    nomeRomaji: "Hikitome",
    nomeItaliano: "Trattenuta",
    kanji: "引き止め",
    poolName: "Hikitome (引き止め) — Trattenuta",
    flavor: '"Un colpo non viene fermato: viene trattenuto." Il proiettile resta sospeso al filo, in attesa.',
    meccanica:
      'Passiva · CS 1 · genera 1 Tensione mentre sospesa. "Congeli" una tua waza Proiettile in un punto entro la gittata: sospesa 1 turno, poi riparte stessa direzione senza costo. Il turno di sospensione conta come rilancio.',
    tier: null,
    cs: 1,
    effetti: [
      {
        tipo: "MOD_TRAIETTORIA",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 1 },
        operazione: "SOSPENDI",
        nota_master:
          "Solo waza proprie [Proiettile]: congela in un punto entro la gittata per 1 turno; poi riparte stessa direzione senza ulteriore costo.",
      },
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Il turno di sospensione conta come un rilancio. Genera 1 Tensione (status tensione) finché la waza resta sospesa.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "hajiki-fionda-filo",
    nomeRomaji: "Hajiki",
    nomeItaliano: "Fionda del Filo",
    kanji: "弾き",
    poolName: "Hajiki (弾き) — Fionda del Filo",
    flavor: "Il filo si tende fino al limite, poi lascia: la marionetta vola via come una pietra dalla fionda.",
    meccanica:
      "Attiva · [Proiettile][Solido] · Tier 2 · CS 2 · 1/4. Scagli in linea un Costrutto Solido sollevato (Ayatsuri) per 12 m; danno = tier.",
    tier: 2,
    tags: ["Proiettile", "Solido"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "goju", "seimitsu"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "LINEA",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Solido",
        area: { forma: "linea", profondita_m: 12 },
      },
      {
        tipo: "MANUALE",
        trigger: "PRE_LANCIO",
        testo: "Richiede un Costrutto Solido sollevato con Ayatsuri.",
        mostra_a: "MASTER",
      },
    ],
  },
  {
    slug: "irekae-scambio-fili",
    nomeRomaji: "Irekae",
    nomeItaliano: "Scambio dei Fili",
    kanji: "入れ替え",
    poolName: "Irekae (入れ替え) — Scambio dei Fili",
    flavor: "Due marionette, due fili incrociati: ciò che era qui è là, e viceversa.",
    meccanica:
      "Attiva · [Nessuna] · CS 1 · 1/4. Due tuoi Costrutti Solidi entro 8 m invertono posizione mantenendo le proprietà; un costrutto in volo prosegue la traiettoria dalla nuova posizione.",
    tier: null,
    tags: ["Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Due tuoi Costrutti Solidi entro 8 m invertono posizione mantenendo le proprietà. Un costrutto in volo prosegue la traiettoria dalla nuova posizione.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Scambio istantaneo due costrutti → Master (🔴)."],
  },
  {
    slug: "mayu-wari-bozzolo-squarciato",
    nomeRomaji: "Mayu-Wari",
    nomeItaliano: "Bozzolo Squarciato",
    kanji: "繭割り",
    poolName: "Mayu-Wari (繭割り) — Bozzolo Squarciato",
    flavor: "Il bozzolo di filo si lacera dall'interno e sputa schegge guidate.",
    meccanica:
      "Attiva · [Proiettile][Solido] · Tier 2 · CS 2 · 1/4. Un tuo Costrutto Solido entro 8 m implode in 4 Proiettili Solidi verso un bersaglio; danno = tier ripartito tra le schegge che colpiscono.",
    tier: 2,
    tags: ["Proiettile", "Solido"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "goju", "seimitsu"],
    effetti: [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
        consistenza: "Solido",
        ripetizioni: 4,
        nota_master:
          "Un tuo Costrutto Solido entro 8 m implode in 4 Proiettili Solidi verso un bersaglio; danno = tier ripartito tra le schegge che colpiscono.",
      },
    ],
  },
  {
    slug: "hikiyose-richiamo-fili",
    nomeRomaji: "Hikiyose",
    nomeItaliano: "Richiamo dei Fili",
    kanji: "引き寄せ",
    poolName: "Hikiyose (引き寄せ) — Richiamo dei Fili",
    flavor: "Fili di carica opposta: ciò che respinge e ciò che attrae, intrecciati.",
    meccanica:
      "Attiva · [Nessuna] · CS 2 · 1/4 · genera 1 Tensione. Rendi un tuo Costrutto Solido entro 8 m Positivo per 2 turni; fino a 2 altri entro 8 m diventano Negativi (+1 CS per crearne già Negativi). Ogni Negativo è attratto verso il Positivo.",
    tier: null,
    tags: ["Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Un tuo Costrutto Solido entro 8 m diventa Positivo per 2 turni. Fino a 2 altri entro 8 m diventano Negativi (+1 CS per ciascuno già Negativo). Ogni Negativo è attratto verso il Positivo. Genera 1 Tensione (status tensione).",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Sistema polarità costrutti → Master (🔴)."],
  },
  {
    slug: "musubi-nodo-gemello",
    nomeRomaji: "Musubi",
    nomeItaliano: "Nodo Gemello",
    kanji: "結び",
    poolName: "Musubi (結び) — Nodo Gemello",
    flavor: "Due marionette annodate allo stesso filo: feriscine una, sanguina l'altra.",
    meccanica:
      "Attiva · [Nessuna] · CS 2 · 1/4 · genera 1 Tensione. Leghi due Costrutti Solidi entro 8 m: per 4 turni, ciò che accade a uno si ripete sull'altro.",
    tier: null,
    tags: ["Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Leghi due Costrutti Solidi entro 8 m: per 4 turni, ciò che accade a uno si ripete sull'altro. Genera 1 Tensione (status tensione) finché il nodo resta attivo.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Eco eventi tra costrutti legati → Master (🔴)."],
  },
  {
    slug: "mayakashi-inganno-filo",
    nomeRomaji: "Mayakashi",
    nomeItaliano: "Inganno del Filo",
    kanji: "まやかし",
    poolName: "Mayakashi (まやかし) — Inganno del Filo",
    flavor: "Il filo veste la marionetta di un'altra pelle.",
    meccanica:
      "Attiva · [Nessuna] · CS 1 · 1/4. Fai apparire un tuo Costrutto come un altro Costrutto che vedi o un oggetto del tuo inventario, per 4 turni. Sotto i 4 m la vera forma è visibile.",
    tier: null,
    tags: ["Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "seimitsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Un tuo Costrutto appare come un altro Costrutto visibile o un oggetto del tuo inventario, per 4 turni. Sotto i 4 m la vera forma è visibile.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Illusione costrutto → Master (🔴)."],
  },
  {
    slug: "ubaiito-filo-rubato",
    nomeRomaji: "Ubaiito",
    nomeItaliano: "Filo Rubato",
    kanji: "奪い糸",
    poolName: "Ubaiito (奪い糸) — Filo Rubato",
    flavor: "L'analista afferra il filo altrui e lo strappa di mano al suo padrone.",
    meccanica:
      "Attiva · [Nessuna] · CS 2 · 1/4. Tenti di strappare il controllo di un Costrutto nemico entro 8 m: confronto d'Indice (Skiru mentali) contro il creatore. Se prevali, controllo per 2 turni; il creatore può ritentare. Solo su costrutti taglia Media o inferiore.",
    tier: null,
    tags: ["Nessuna"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        testo:
          "Tenti di strappare il controllo di un Costrutto nemico entro 8 m: confronto d'Indice (Skiru mentali, es. Fudōshin o Kansatsu) contro l'Indice del creatore. Se prevali, controllo per 2 turni; il creatore può ritentare. Solo costrutti taglia Media o inferiore.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: ["Confronto di controllo → Master (🔴)."],
  },
  {
    slug: "unari-ronzio-filo",
    nomeRomaji: "Unari",
    nomeItaliano: "Ronzio del Filo",
    kanji: "唸り",
    poolName: "Unari (唸り) — Ronzio del Filo",
    flavor: "Il filo teso non tace: vibra di una nota bassa che fa girare la testa a chi gli sta vicino.",
    meccanica:
      "Attiva · [Emanazione][Sonoro] · CS 2 · 1/4 · genera 1 Tensione. Permei un tuo Costrutto entro 8 m; per 3 turni emette un ronzio in area 4 m. Chi inizia il turno nell'area → Vertigini.",
    tier: null,
    tags: ["Emanazione", "Sonoro"],
    cs: 2,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "shodo"],
    effetti: [
      {
        tipo: "ZONA",
        trigger: "AL_LANCIO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "TURNI", n: 3 },
        forma_zona: "cerchio",
        raggio_zona_m: 4,
        ancoraggio: "SEGUE_COSTRUTTO",
        nota_master: "Permea un tuo Costrutto entro 8 m. Genera 1 Tensione (status tensione) finché attiva.",
        effetti_zona: {
          a_inizio_turno: {
            tipo: "APPLICA_STATUS",
            trigger: "INIZIO_TURNO",
            bersaglio: "TUTTI_IN_AREA",
            durata: { tipo: "ISTANTANEA" },
            status: "vertigini",
            stack: 1,
            nota_master: "Chi inizia il turno nell'area.",
          },
        },
        immunita: ["SE_STESSO"],
      },
    ],
  },
  {
    slug: "shime-stretta-filo",
    nomeRomaji: "Shime",
    nomeItaliano: "Stretta del Filo",
    kanji: "締め",
    poolName: "Shime (締め) — Stretta del Filo",
    flavor: "Il filo si avvolge e cinge, finché la marionetta si fa più piccola, più dura, più letale.",
    meccanica:
      "Attiva · [Nessuna] · CS 1 · 1/4. Comprimi un tuo Costrutto Solido entro 8 m: taglia −1 livello, +1 tier Resistenza (permanente), +1 tier danno se usato come Proiettile.",
    tier: null,
    tags: ["Nessuna"],
    cs: 1,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "seimitsu"],
    effetti: [
      {
        tipo: "MOD_RESISTENZA",
        trigger: "AL_LANCIO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "PERSISTENTE" },
        delta_resistenza: 1,
        filtro_consistenza: "Solido",
        nota_master: "Comprimi un tuo Costrutto Solido entro 8 m: taglia −1 livello (Grande→Media, Media→Piccola). +1 tier Resistenza permanente.",
      },
      {
        tipo: "MOD_DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "PERSISTENTE" },
        valore: { tipo: "TIER_DELTA", n: 1 },
        filtro_waza: { tag: ["Proiettile"] },
        nota_master: "+1 tier di danno se il costrutto compresso è usato come Proiettile.",
      },
    ],
  },
  {
    slug: "rensa-catena-fili",
    nomeRomaji: "Rensa",
    nomeItaliano: "Catena di Fili",
    kanji: "連鎖",
    poolName: "Rensa (連鎖) — Catena di Fili",
    flavor: "Due gesti, un'unica catena: quando il primo filo si spegne, il secondo è già teso.",
    meccanica:
      "Attiva · [Nessuna] · CS = somma delle due waza · 1/4. Carichi due waza (paghi entrambe, scegli ordine); quando la prima finisce, la seconda parte automaticamente dal punto in cui era la prima. Stesso turno.",
    tier: null,
    tags: ["Nessuna"],
    cs: 0,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "seishin-tanren"],
    effetti: [
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        finestra_turni: 1,
        nota_master:
          "Carichi due waza e ne paghi entrambi i costi (CS = somma), scegliendo l'ordine. Quando la prima finisce nello stesso turno, la seconda parte dal punto finale della prima.",
        rilasci: {
          a_comando: {
            tipo: "MANUALE",
            trigger: "A_COMANDO",
            testo: "Rilascio automatico al termine della prima waza nel turno.",
            mostra_a: "MASTER",
          },
        },
      },
    ],
  },
  {
    slug: "kankatsu-giurisdizione",
    nomeRomaji: "Kankatsu",
    nomeItaliano: "Giurisdizione",
    kanji: "管轄",
    poolName: "Kankatsu (管轄) — Giurisdizione",
    flavor:
      "L'analista tende un filo e lo pianta nell'aria attorno a sé, tracciando un cerchio invisibile di cui si dichiara padrone.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · Tier 3 · CS 3 · 1/4 · grado Sentatsu Bunsekikan [SB]. Dichiari Giurisdizione su [Proiettile] o [Raggio] (scelta al lancio). Per 3 turni, una volta per turno, quando una waza nemica di quella categoria entra entro 8 m, spendi +2 CS per considerarla come tua (passive Itō applicabili; bersaglio e gittata originali).",
    tier: 3,
    tags: ["Nessuna", "Potenziamento"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "kansatsu"],
    scelteAlLancio: [
      { id: "proiettile", label: "Proiettile" },
      { id: "raggio", label: "Raggio" },
    ],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "grado_pg >= Sentatsu Bunsekikan",
        testo:
          "Requisito: grado Sentatsu Bunsekikan [SB] o superiore. Per 3 turni dichiari Giurisdizione su una Categoria scelta ([Proiettile] o [Raggio]). Una volta per turno: quando una waza nemica di quella categoria entra entro 8 m, spendi +2 CS per considerarla come appena lanciata da te — bersaglio e gittata originali non cambiano; le tue passive Itō possono agire. Ogni waza reclamata genera 1 Tensione finché manipolata.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Sentatsu Bunsekikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Reazione waza nemica in tempo reale → motore + Master (🔴).",
    ],
  },
  {
    slug: "chokurei-decreto",
    nomeRomaji: "Chokurei",
    nomeItaliano: "Decreto",
    kanji: "勅令",
    poolName: "Chokurei (勅令) — Decreto",
    flavor:
      "L'analista non muove più la marionetta: muove la legge che la regge. Un filo di luce scrive nell'aria un'unica sentenza breve come un nodo.",
    meccanica:
      "Attiva · [Nessuna] · CS 3 · 1/4 · grado Kanteikan [K]. Un solo Decreto per turno su un evento in corso o entro 2 turni, gittata 12 m. Può agire su movimento, direzione, posizione, categoria — non su Consistenze, materia, potenziamento corpo, esplosioni energetiche.",
    tier: null,
    tags: ["Nessuna"],
    cs: 3,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "seishin-tanren"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "grado_pg >= Kanteikan",
        testo:
          "Requisito: grado Kanteikan [K] o superiore. Imponi un singolo Decreto per turno: comando su UN evento in corso o che avverrà entro 2 turni, gittata 12 m. Il Decreto NON può: cambiare Consistenze, creare materia, potenziare il corpo, far esplodere energia. Può solo riguardare movimento, direzione, posizione, categoria. Esempi: «Quella [Proiettile] torna al mittente» (inverte direzione); «Quei due [Costrutti] si scambiano di posto» (come Irekae forzato); «Quella waza si ferma» (congela; riparte al tuo prossimo turno, come Hikitome su waza nemica); «Quel bersaglio non può muoversi in quella direzione» (blocco direzione per il turno).",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Kanteikan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Comando su eventi altrui → motore + arbitrato Master (🔴).",
    ],
  },
  {
    slug: "mugen-shihai-dominazione-onirica",
    nomeRomaji: "Musō Shihai",
    nomeItaliano: "Dominazione Onirica",
    kanji: "夢想支配",
    poolName: "Musō Shihai (夢想支配) — Dominazione Onirica",
    flavor:
      "L'analista pianta i piedi e apre tutti i fili insieme: una cupola sottile di corde si stende sopra il campo, e ogni cosa che vive là sotto sente un peso impercettibile sulle spalle.",
    meccanica:
      "Attiva · [Nessuna][Potenziamento] · CS 4 + mantenimento · 1/4 · grado Shin'enkan [S]. Dominio 10 m per 4 turni (o fino a rottura): co-proprietà sui Costrutti, coscienza piena delle waza, reclamo al costo di 1/4. Vincolo: movimento max metà Undō; rottura se si supera o si subisce >12 danno (tier 3) da un colpo.",
    tier: null,
    tags: ["Nessuna", "Potenziamento"],
    cs: 4,
    tempoQuarti: 1,
    skiruIr: ["fudoshin", "seishin-tanren", "kansatsu"],
    effetti: [
      {
        tipo: "MANUALE",
        trigger: "AL_LANCIO",
        condizione: "grado_pg >= Shin'enkan",
        testo:
          "Requisito: grado Shin'enkan [S] o superiore. Estendi il dominio in cerchio 10 m centrato su di te, per 4 turni (o fino a rottura). Entro la zona: (1) ogni [Costrutto] presente conta te come co-proprietario; (2) piena coscienza di ogni waza generata o che attraversa la zona; (3) al costo di 1/4, tratti 1 waza (tua o altrui) come appena generata da te — gittata e direzione originali restano. Vincolo mantenimento: movimento max metà Undō a turno; se percorri più metri (volontariamente o no) o subisci >12 danno (tier 3) da un singolo colpo, la Dominazione decade. Ogni waza reclamata genera 1 Tensione.",
        mostra_a: "MASTER",
      },
    ],
    implementazioneNote: [
      "grado_pg >= Shin'enkan: stringa salvata; sandbox confronta solo == su grado_pg oggi.",
      "Dominio d'area su waza altrui → motore + Master (🔴).",
      "Slug DB mugen-shihai-dominazione-onirica; nome/kanji allineati a guida (Musō Shihai 夢想支配).",
    ],
  },
];

export function itoDescrizione(entry: ItoCatalogEntry): string {
  const kind = entry.cs != null && entry.cs > 0 ? "attiva" : "passiva";
  return desc(kind, entry.flavor, entry.meccanica);
}

export function allItoImplementazioneNotes(): string[] {
  const notes: string[] = [];
  for (const e of ITO_CATALOG) {
    for (const n of e.implementazioneNote ?? []) {
      if (!notes.includes(n)) notes.push(n);
    }
  }
  return notes;
}
