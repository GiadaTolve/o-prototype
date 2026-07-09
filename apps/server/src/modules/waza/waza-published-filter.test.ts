import { describe, expect, it } from "bun:test";
import { isSkillVisibleInPlayerCatalog } from "./waza-published-filter";

describe("waza-published-filter", () => {
  it("skill WAZA senza authoring resta visibile", () => {
    const map = new Map<string, boolean>();
    expect(isSkillVisibleInPlayerCatalog("skill-1", "WAZA", map)).toBe(true);
  });

  it("skill WAZA con authoring non pubblicato è nascosta", () => {
    const map = new Map<string, boolean>([["skill-1", false]]);
    expect(isSkillVisibleInPlayerCatalog("skill-1", "WAZA", map)).toBe(false);
  });

  it("skill WAZA con authoring pubblicato è visibile", () => {
    const map = new Map<string, boolean>([["skill-1", true]]);
    expect(isSkillVisibleInPlayerCatalog("skill-1", "WAZA", map)).toBe(true);
  });

  it("skill non-WAZA ignora il filtro", () => {
    const map = new Map<string, boolean>([["skill-1", false]]);
    expect(isSkillVisibleInPlayerCatalog("skill-1", "SKIRU", map)).toBe(true);
  });
});
