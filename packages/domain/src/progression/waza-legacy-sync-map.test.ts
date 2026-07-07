import { describe, expect, test } from "bun:test";
import {
  buildLegacySyncPayload,
  mapLegacyWazaTaxonomy,
  parseLegacyWazaName,
} from "./waza-legacy-sync-map";

describe("parseLegacyWazaName", () => {
  test("romaji, kanji e italiano", () => {
    expect(parseLegacyWazaName("Tōshi (投資) — Investimento Energetico")).toEqual({
      nomeRomaji: "Tōshi",
      nomeItaliano: "Investimento Energetico",
      kanji: "投資",
    });
  });
});

describe("mapLegacyWazaTaxonomy", () => {
  test("generica da pool", () => {
    const r = mapLegacyWazaTaxonomy({
      skillId: "1",
      poolId: "generiche-meidan-sibilo-proiettile",
      name: "Test",
      isPassive: false,
      styleId: null,
      madoshoId: null,
    });
    expect(r.mappable).toBe(true);
    if (r.mappable) {
      expect(r.categoria).toBe("generica");
      expect(r.genitore).toBeNull();
    }
  });

  test("do da styleId", () => {
    const r = mapLegacyWazaTaxonomy({
      skillId: "2",
      poolId: "komei-chi-lo-ha-deciso",
      name: "Kōmei",
      isPassive: false,
      styleId: "naikan",
      madoshoId: null,
    });
    expect(r).toMatchObject({ mappable: true, categoria: "do", genitore: "Naikan-dō" });
  });

  test("ordine non mappabile", () => {
    const r = mapLegacyWazaTaxonomy({
      skillId: "3",
      poolId: "ordine-colpo-corda",
      name: "Ordine",
      isPassive: false,
      styleId: null,
      madoshoId: null,
    });
    expect(r.mappable).toBe(false);
  });

  test("madosho da pool", () => {
    const r = mapLegacyWazaTaxonomy({
      skillId: "4",
      poolId: "yasei",
      name: "Yasei",
      isPassive: false,
      styleId: null,
      madoshoId: null,
    });
    expect(r).toMatchObject({ mappable: true, categoria: "madosho", genitore: "Gōkaon" });
  });
});

describe("buildLegacySyncPayload", () => {
  test("tier e CS da rank", () => {
    const p = buildLegacySyncPayload({
      skillId: "x",
      poolId: "toka-test",
      name: "Hōshutsu — Emanazione",
      rank: "T3",
      isPassive: false,
      styleId: "toka",
      madoshoId: null,
      description: "Desc",
    });
    expect(p?.tier).toBe(3);
    expect(p?.cs).toBe(3);
    expect(p?.statoCodifica).toBe("da_codificare");
    expect(p?.effetti).toEqual([]);
  });
});
