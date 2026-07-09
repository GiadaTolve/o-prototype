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
});
