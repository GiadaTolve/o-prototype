import { describe, expect, it } from "bun:test";
import {
  normalizeSkiruIr,
  validateSkiruIrSlugs,
  warnAttivaSenzaSkiruIr,
} from "./waza-skiru-ir";

describe("waza-skiru-ir", () => {
  it("normalizeSkiruIr deduplica e ordina", () => {
    expect(normalizeSkiruIr(["Kensei", "kensei", " jusei "])).toEqual(["jusei", "kensei"]);
  });

  it("validateSkiruIrSlugs segnala slug sconosciuti", () => {
    const allowed = new Set(["kensei", "jusei"]);
    const errori = validateSkiruIrSlugs(["kensei", "fantasma"], allowed);
    expect(errori).toHaveLength(1);
    expect(errori[0]?.codice).toBe("SKIRU_IR_NON_VALIDA");
  });

  it("warnAttivaSenzaSkiruIr avvisa solo waza attive senza selezione", () => {
    expect(warnAttivaSenzaSkiruIr("passiva", [])).toEqual([]);
    const avvisi = warnAttivaSenzaSkiruIr("attiva", []);
    expect(avvisi).toHaveLength(1);
    expect(avvisi[0]?.codice).toBe("SKIRU_IR_MANCANTE");
    expect(warnAttivaSenzaSkiruIr("attiva", ["kensei"])).toEqual([]);
  });
});
