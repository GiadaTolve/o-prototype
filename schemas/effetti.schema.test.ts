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
});
