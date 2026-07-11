import { describe, expect, it } from "bun:test";
import { validateEffettiSchema } from "./effetti-validator";

describe("effetti.schema.json", () => {
  it("accetta un blocco DANNO valido", () => {
    const payload = [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta DANNO senza bersaglio", () => {
    const payload = [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "TIER" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("rifiuta un blocco con tipo sconosciuto", () => {
    const payload = [
      {
        tipo: "ATOMO_SCONOSCIUTO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("rifiuta DANNO con parametro estraneo", () => {
    const payload = [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "FISSO", n: 4 },
        campo_non_previsto: true,
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("rifiuta valore FISSO senza n", () => {
    const payload = [
      {
        tipo: "DANNO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        valore: { tipo: "FISSO" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta MANUALE con solo testo", () => {
    const payload = [
      {
        tipo: "MANUALE",
        testo: "Effetto narrativo deciso dal Master.",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("accetta MOD_COSTO valido", () => {
    const payload = [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_COSTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        delta_cs: -1,
        minimo_cs: 1,
        filtro_waza: { famiglia: "shoka" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("accetta MOD_COSTO con sconto e condizione Tōrō", () => {
    const payload = [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_COSTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        delta_cs: -1,
        minimo_cs: 1,
        condizione: "toro.lanciata == true",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta MOD_COSTO senza delta_cs", () => {
    const payload = [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_COSTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("rifiuta MOD_COSTO con delta_cs fuori range", () => {
    const payload = [
      {
        tipo: "MOD_COSTO",
        trigger: "PRE_COSTO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        delta_cs: -11,
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta STATO_PERSONALE valido", () => {
    const payload = [
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        operazione: "SCRIVI",
        chiave: "elemento_residuo",
        valore: "fuoco",
        scadenza_turni: 2,
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta STATO_PERSONALE senza chiave", () => {
    const payload = [
      {
        tipo: "STATO_PERSONALE",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "LEGGI",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta MOD_RESISTENZA valido", () => {
    const payload = [
      {
        tipo: "MOD_RESISTENZA",
        trigger: "AL_LANCIO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "TURNI", n: 3 },
        delta_resistenza: 2,
        filtro_consistenza: "metallico",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta MOD_RESISTENZA senza delta_resistenza", () => {
    const payload = [
      {
        tipo: "MOD_RESISTENZA",
        trigger: "AL_LANCIO",
        bersaglio: "PROPRIO_COSTRUTTO",
        durata: { tipo: "ISTANTANEA" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta TRASFORMA_TAG valido", () => {
    const payload = [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "categoria",
        da_tag: "contatto",
        a_tag: "proiettile",
        oggetto: "WAZA_PROPRIA",
        effetti_collaterali: [
          { tipo: "MOD_GITTATA", valore: { tipo: "FORMULA", base: 8, skiru: "Seimitsu", per_punto: 1 } },
        ],
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta TRASFORMA_TAG senza campo obbligatorio", () => {
    const payload = [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "categoria",
        da_tag: "contatto",
        oggetto: "WAZA_PROPRIA",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("rifiuta TRASFORMA_TAG con effetti_collaterali non strutturati", () => {
    const payload = [
      {
        tipo: "TRASFORMA_TAG",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "ISTANTANEA" },
        dimensione: "categoria",
        da_tag: "contatto",
        a_tag: "proiettile",
        oggetto: "WAZA_PROPRIA",
        effetti_collaterali: "aumenta gittata",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta SCUDO valido", () => {
    const payload = [
      {
        tipo: "SCUDO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
        resistenza_scudo: { tipo: "TIER" },
        mitigazione_extra: 1,
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta SCUDO senza resistenza", () => {
    const payload = [
      {
        tipo: "SCUDO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 2 },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta ZONA valida con annidamento a un livello", () => {
    const payload = [
      {
        tipo: "ZONA",
        trigger: "AL_LANCIO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "TURNI", n: 3 },
        forma_zona: "cerchio",
        raggio_zona_m: 4,
        ancoraggio: "FISSA",
        effetti_zona: {
          quando_entra: {
            tipo: "APPLICA_STATUS",
            trigger: "ENTRA_IN_ZONA",
            bersaglio: "BERSAGLIO_SINGOLO",
            durata: { tipo: "TURNI", n: 1 },
            status: "Bruciatura",
          },
        },
        immunita: ["analista"],
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("ignora hook zona incompleti (senza tipo) in validazione", () => {
    const payload = [
      {
        tipo: "ZONA",
        trigger: "AL_LANCIO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "TURNI", n: 3 },
        forma_zona: "cerchio",
        raggio_zona_m: 4,
        ancoraggio: "FISSA",
        effetti_zona: {
          quando_entra: { trigger: "ENTRA_IN_ZONA", bersaglio: "BERSAGLIO_SINGOLO" },
        },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta ZONA senza effetti_zona", () => {
    const payload = [
      {
        tipo: "ZONA",
        trigger: "AL_LANCIO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "TURNI", n: 3 },
        forma_zona: "cerchio",
        raggio_zona_m: 4,
        ancoraggio: "FISSA",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta MOD_CS valido", () => {
    const payload = [
      {
        tipo: "MOD_CS",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "DRENA",
        quantita: { tipo: "FISSO", n: 2 },
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta MOD_CS senza quantita", () => {
    const payload = [
      {
        tipo: "MOD_CS",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "DRENA",
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta MOD_TRAIETTORIA valido", () => {
    const payload = [
      {
        tipo: "MOD_TRAIETTORIA",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "DEVIA",
        valore: { tipo: "TIER_DELTA", n: 1 },
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta MOD_TRAIETTORIA senza operazione", () => {
    const payload = [
      {
        tipo: "MOD_TRAIETTORIA",
        trigger: "ALL_IMPATTO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta MANIPOLA_STATUS valido", () => {
    const payload = [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "TRASMUTA",
        status_da: "Incendiato",
        status_a: "Fulminato",
        quantita: { tipo: "FISSO", n: 1 },
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta MANIPOLA_STATUS senza status_da", () => {
    const payload = [
      {
        tipo: "MANIPOLA_STATUS",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "ISTANTANEA" },
        operazione: "RIMUOVI",
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("accetta DIFFERITO valido con riferimento", () => {
    const payload = [
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "TURNI", n: 2 },
        finestra_turni: 2,
        rilasci: {
          a_comando: {
            tipo: "DANNO",
            trigger: "A_COMANDO",
            bersaglio: "BERSAGLIO_SINGOLO",
            durata: { tipo: "ISTANTANEA" },
            valore: { tipo: "RIFERIMENTO", waza_slug: "fuin-no-hi" },
          },
        },
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("accetta EVOCA_COSTRUTTO valido senza resistenza/danno espliciti", () => {
    const payload = [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        taglia: "Media",
        consistenza: "Solido",
        comportamento: "COMANDATO",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("accetta EVOCA_COSTRUTTO con resistenza tier esplicita", () => {
    const payload = [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "ALL_IMPATTO",
        bersaglio: "ZONA_TERRENO",
        durata: { tipo: "PERSISTENTE" },
        taglia: "Piccola",
        consistenza: "Solido",
        comportamento: "STATICO",
        resistenza: { tipo: "TIER" },
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("normalizza EVOCA_COSTRUTTO con placeholder DERIVATA (legacy editor)", () => {
    const payload = [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        taglia: "Media",
        consistenza: "Solido",
        comportamento: "COMANDATO",
        resistenza: "DERIVATA",
        danno: "DERIVATA",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(true);
  });

  it("rifiuta EVOCA_COSTRUTTO con resistenza stringa non valida", () => {
    const payload = [
      {
        tipo: "EVOCA_COSTRUTTO",
        trigger: "AL_LANCIO",
        bersaglio: "SE_STESSO",
        durata: { tipo: "TURNI", n: 3 },
        taglia: "Media",
        consistenza: "Solido",
        comportamento: "COMANDATO",
        resistenza: "invalido",
      },
    ];

    expect(validateEffettiSchema(payload).valid).toBe(false);
  });

  it("rifiuta DIFFERITO senza rilasci", () => {
    const payload = [
      {
        tipo: "DIFFERITO",
        trigger: "AL_LANCIO",
        bersaglio: "BERSAGLIO_SINGOLO",
        durata: { tipo: "TURNI", n: 2 },
        finestra_turni: 2,
        rilasci: {},
      },
    ];
    expect(validateEffettiSchema(payload).valid).toBe(false);
  });
});
