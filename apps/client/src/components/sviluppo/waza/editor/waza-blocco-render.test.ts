import { describe, expect, test } from "bun:test";
import {
  BLOCCO_MODELLI,
  createBloccoDaModello,
  createDefaultBlocco,
} from "./effetti-schema";
import {
  ATOMO_DESCRIZIONI,
  renderBloccoMeccanico,
  renderCondizione,
  renderValore,
} from "./waza-blocco-render";

describe("waza-blocco-render — valore", () => {
  test("TIER senza contesto", () => {
    expect(renderValore({ tipo: "TIER" })).toBe("il tier della waza");
  });

  test("TIER con danno piatto", () => {
    expect(renderValore({ tipo: "TIER" }, 6)).toBe("il tier (6)");
  });

  test("FISSO / TIER_DELTA / FORMULA", () => {
    expect(renderValore({ tipo: "FISSO", n: 5 })).toBe("5");
    expect(renderValore({ tipo: "TIER_DELTA", n: 1 })).toBe("+1 tier");
    expect(renderValore({ tipo: "TIER_DELTA", n: -2 })).toBe("−2 tier");
    expect(renderValore({ tipo: "FORMULA", base: 2, skiru: "kensei", per_punto: 1 })).toBe(
      "2 +1 per ogni punto di kensei",
    );
  });
});

describe("waza-blocco-render — condizione", () => {
  test("Tōrō batteria", () => {
    expect(renderCondizione("toro.batteria == true")).toBe("se il Tōrō ha la Batteria attiva");
  });
  test("stack status", () => {
    expect(renderCondizione("stack(Incendiato) >= 3")).toBe(
      "se ci sono >= 3 stack di Incendiato",
    );
  });
});

describe("waza-blocco-render — blocchi completi", () => {
  test("DANNO a cono in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "DANNO",
      trigger: "AL_LANCIO",
      bersaglio: "CONO",
      durata: { tipo: "ISTANTANEA" },
      valore: { tipo: "TIER" },
      area: { forma: "cono", profondita_m: 6 },
    });
    expect(frase).toBe("Infligge danno pari al tier della waza in un cono di 6 m.");
  });

  test("MOD_DANNO con condizione Tōrō", () => {
    const frase = renderBloccoMeccanico({
      tipo: "MOD_DANNO",
      trigger: "AL_LANCIO",
      bersaglio: "SE_STESSO",
      durata: { tipo: "ISTANTANEA" },
      valore: { tipo: "TIER_DELTA", n: 1 },
      condizione: "toro.batteria == true",
    });
    expect(frase).toBe("Modifica il danno di +1 tier se il Tōrō ha la Batteria attiva.");
  });

  test("APPLICA_STATUS con durata a turni", () => {
    const frase = renderBloccoMeccanico({
      tipo: "APPLICA_STATUS",
      trigger: "AL_LANCIO",
      bersaglio: "BERSAGLIO_SINGOLO",
      durata: { tipo: "TURNI", n: 3 },
      status: "Incendiato",
      stack: 2,
    });
    expect(frase).toBe(
      "Applica lo status Incendiato (2 stack) a un bersaglio singolo per 3 turni.",
    );
  });

  test("MANUALE è nota per il master", () => {
    const frase = renderBloccoMeccanico({ tipo: "MANUALE", testo: "Il Tōrō si spegne." });
    expect(frase).toBe("Nota per il master (non eseguita dal motore): «Il Tōrō si spegne.».");
  });

  test("MOD_COSTO in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "MOD_COSTO",
      trigger: "PRE_COSTO",
      bersaglio: "SE_STESSO",
      durata: { tipo: "TURNI", n: 2 },
      delta_cs: -1,
      minimo_cs: 1,
      filtro_waza: { famiglia: "shoka" },
    });
    expect(frase).toBe(
      "Prima di pagare il costo: modifica il costo CS di −1 (famiglia shoka) con minimo 1 CS per 2 turni.",
    );
  });

  test("STATO_PERSONALE SCRIVI in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "STATO_PERSONALE",
      trigger: "AL_LANCIO",
      bersaglio: "SE_STESSO",
      durata: { tipo: "ISTANTANEA" },
      operazione: "SCRIVI",
      chiave: "elemento_residuo",
      valore: "fuoco",
      scadenza_turni: 2,
    });
    expect(frase).toBe(
      "Scrive nello stato personale elemento_residuo = “fuoco” per 2 turni.",
    );
  });

  test("MOD_RESISTENZA in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "MOD_RESISTENZA",
      trigger: "AL_LANCIO",
      bersaglio: "PROPRIO_COSTRUTTO",
      durata: { tipo: "TURNI", n: 3 },
      delta_resistenza: 2,
      filtro_consistenza: "metallico",
    });
    expect(frase).toBe(
      "Modifica la resistenza di +2 sul tuo costrutto (solo consistenza metallico) per 3 turni.",
    );
  });

  test("trigger non-lancio genera prefisso", () => {
    const frase = renderBloccoMeccanico({
      tipo: "DANNO",
      trigger: "ALL_IMPATTO",
      bersaglio: "BERSAGLIO_SINGOLO",
      durata: { tipo: "ISTANTANEA" },
      valore: { tipo: "FISSO", n: 3 },
    });
    expect(frase).toBe("All'impatto: infligge danno pari a 3 a un bersaglio singolo.");
  });

  test("blocco incompleto non lancia", () => {
    expect(renderBloccoMeccanico({ tipo: "DANNO" })).toContain("Infligge danno");
    expect(renderBloccoMeccanico({})).toBe("Blocco senza tipo.");
    expect(renderBloccoMeccanico(null)).toBe("Blocco vuoto.");
  });
});

describe("waza-blocco-render — descrizioni atomi", () => {
  test("ogni atomo ha una descrizione in italiano piano", () => {
    expect(ATOMO_DESCRIZIONI.DANNO).toBe("la waza infligge danno");
    expect(ATOMO_DESCRIZIONI.MANUALE).toContain("non eseguito dal motore");
    expect(ATOMO_DESCRIZIONI.MOD_COSTO).toContain("costo");
    expect(ATOMO_DESCRIZIONI.STATO_PERSONALE).toContain("stato personale");
    expect(ATOMO_DESCRIZIONI.MOD_RESISTENZA).toContain("resistenza");
    for (const desc of Object.values(ATOMO_DESCRIZIONI)) {
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});

describe("default sensati e modelli", () => {
  test("DANNO precompila bersaglio singolo, trigger al lancio, durata istantanea", () => {
    const b = createDefaultBlocco("DANNO");
    expect(b.trigger).toBe("AL_LANCIO");
    expect(b.bersaglio).toBe("BERSAGLIO_SINGOLO");
    expect((b.durata as { tipo: string }).tipo).toBe("ISTANTANEA");
  });

  test("BUFF_SKIRU precompila su sé stesso", () => {
    const b = createDefaultBlocco("BUFF_SKIRU");
    expect(b.bersaglio).toBe("SE_STESSO");
  });

  test("modello Danno semplice usa TIER", () => {
    const b = createBloccoDaModello("danno-semplice");
    expect(b.tipo).toBe("DANNO");
    expect((b.valore as { tipo: string }).tipo).toBe("TIER");
    expect(b.bersaglio).toBe("BERSAGLIO_SINGOLO");
  });

  test("modello Potenziamento con durata: FISSO +2, 2 turni, su sé stesso", () => {
    const b = createBloccoDaModello("potenziamento-durata");
    expect(b.tipo).toBe("BUFF_SKIRU");
    expect((b.durata as { tipo: string; n: number }).n).toBe(2);
    expect(b.valore).toEqual({ tipo: "FISSO", n: 2 });
    expect(b.bersaglio).toBe("SE_STESSO");
  });

  test("modello Effetto per il master è MANUALE", () => {
    const b = createBloccoDaModello("effetto-master");
    expect(b.tipo).toBe("MANUALE");
    expect(b.testo).toBeTruthy();
  });

  test("i tre modelli sono esposti nel menu", () => {
    expect(BLOCCO_MODELLI.map((m) => m.id)).toEqual([
      "danno-semplice",
      "potenziamento-durata",
      "effetto-master",
    ]);
  });
});
