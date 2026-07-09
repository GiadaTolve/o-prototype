import { describe, expect, it } from "bun:test";
import { isSkillVisibleInPlayerCatalog } from "./waza-published-filter";

describe("waza-published-filter", () => {
  it("skill WAZA senza authoring nel catalogo è nascosta", () => {
    const map = new Map<string, boolean>();
    expect(isSkillVisibleInPlayerCatalog("skill-legacy", "WAZA", map)).toBe(false);
  });

  it("skill WAZA con authoring solo in bozza è nascosta", () => {
    const map = new Map<string, boolean>([["skill-1", false]]);
    expect(isSkillVisibleInPlayerCatalog("skill-1", "WAZA", map)).toBe(false);
  });

  it("skill WAZA con versione_pubblicata_id su bozza (nessuna pubblicata) è nascosta", () => {
    // loadAuthoringPublishByLegacyId imposta false se esiste solo bozza/validata.
    const map = new Map<string, boolean>([["skill-bad-pointer", false]]);
    expect(isSkillVisibleInPlayerCatalog("skill-bad-pointer", "WAZA", map)).toBe(false);
  });

  it("skill WAZA con versione effettivamente pubblicata è visibile", () => {
    const map = new Map<string, boolean>([["skill-1", true]]);
    expect(isSkillVisibleInPlayerCatalog("skill-1", "WAZA", map)).toBe(true);
  });

  it("skill non-WAZA ignora il filtro", () => {
    const map = new Map<string, boolean>([["skill-1", false]]);
    expect(isSkillVisibleInPlayerCatalog("skill-1", "SKIRU", map)).toBe(true);
  });
});
