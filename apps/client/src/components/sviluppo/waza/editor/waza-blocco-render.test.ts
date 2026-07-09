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

  test("RIFERIMENTO", () => {
    expect(renderValore({ tipo: "RIFERIMENTO", waza_slug: "fuin-no-hi" })).toBe(
      "riferimento a fuin-no-hi",
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
  test("lanciata dal Tōrō", () => {
    expect(renderCondizione("toro.lanciata == true")).toBe("se lanciata dal Tōrō");
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
      "Prima di pagare il costo: modifica il costo di −1 CS (famiglia shoka), minimo 1 per 2 turni.",
    );
  });

  test("MOD_COSTO con condizione lanciata dal Tōrō", () => {
    const frase = renderBloccoMeccanico({
      tipo: "MOD_COSTO",
      trigger: "AL_LANCIO",
      bersaglio: "SE_STESSO",
      durata: { tipo: "ISTANTANEA" },
      delta_cs: -1,
      minimo_cs: 1,
      condizione: "toro.lanciata == true",
    });
    expect(frase).toBe(
      "Modifica il costo di −1 CS, minimo 1 se lanciata dal Tōrō.",
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

  test("TRASFORMA_TAG in italiano piano", () => {
    const frase = renderBloccoMeccanico({
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
    });
    expect(frase).toBe(
      "Trasforma la categoria della tua waza da contatto a proiettile (effetti collaterali: gittata pari a 8 +1 per ogni punto di Seimitsu).",
    );
  });

  test("SCUDO in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "SCUDO",
      trigger: "AL_LANCIO",
      bersaglio: "SE_STESSO",
      durata: { tipo: "TURNI", n: 2 },
      resistenza_scudo: { tipo: "TIER" },
      mitigazione_extra: 1,
    });
    expect(frase).toBe(
      "Crea uno scudo con resistenza il tier della waza, mitigazione extra +1 per 2 turni.",
    );
  });

  test("ZONA in italiano piano", () => {
    const frase = renderBloccoMeccanico({
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
    });
    expect(frase).toBe(
      "Crea una zona cerchio (raggio 4 m), ancoraggio fissa, effetti quando entra, immuni: analista per 3 turni.",
    );
  });

  test("MOD_CS in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "MOD_CS",
      trigger: "AL_LANCIO",
      bersaglio: "BERSAGLIO_SINGOLO",
      durata: { tipo: "ISTANTANEA" },
      operazione: "DRENA",
      quantita: { tipo: "FISSO", n: 2 },
    });
    expect(frase).toBe("Drena 2 CS a un bersaglio singolo.");
  });

  test("MOD_TRAIETTORIA in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "MOD_TRAIETTORIA",
      trigger: "ALL_IMPATTO",
      bersaglio: "BERSAGLIO_SINGOLO",
      durata: { tipo: "ISTANTANEA" },
      operazione: "DEVIA",
      valore: { tipo: "TIER_DELTA", n: 1 },
      direzione: "verso sinistra",
    });
    expect(frase).toBe("All'impatto: cambia traiettoria: devia di +1 tier (verso sinistra).");
  });

  test("MANIPOLA_STATUS in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "MANIPOLA_STATUS",
      trigger: "AL_LANCIO",
      bersaglio: "BERSAGLIO_SINGOLO",
      durata: { tipo: "ISTANTANEA" },
      operazione: "TRASMUTA",
      status_da: "Incendiato",
      status_a: "Fulminato",
      quantita: { tipo: "FISSO", n: 1 },
    });
    expect(frase).toBe("Trasmuta Incendiato in Fulminato di 1 a un bersaglio singolo.");
  });

  test("DIFFERITO in italiano piano", () => {
    const frase = renderBloccoMeccanico({
      tipo: "DIFFERITO",
      trigger: "AL_LANCIO",
      bersaglio: "BERSAGLIO_SINGOLO",
      durata: { tipo: "TURNI", n: 2 },
      finestra_turni: 2,
      rilasci: { a_comando: { tipo: "MANUALE", testo: "rilascio" } },
    });
    expect(frase).toBe("Prepara un effetto differito (finestra 2 turni), rilasci: a comando per 2 turni.");
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
    expect(ATOMO_DESCRIZIONI.TRASFORMA_TAG).toContain("categoria");
    expect(ATOMO_DESCRIZIONI.SCUDO).toContain("assorbe");
    expect(ATOMO_DESCRIZIONI.ZONA).toContain("area");
    expect(ATOMO_DESCRIZIONI.MOD_CS).toContain("CS");
    expect(ATOMO_DESCRIZIONI.MOD_TRAIETTORIA).toContain("percorso");
    expect(ATOMO_DESCRIZIONI.MANIPOLA_STATUS).toContain("status");
    expect(ATOMO_DESCRIZIONI.DIFFERITO).toContain("rilascia");
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
