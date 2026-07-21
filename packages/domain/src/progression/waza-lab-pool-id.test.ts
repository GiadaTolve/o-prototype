import { describe, expect, it } from "vitest";
import { resolveWazaLabPoolId } from "./waza-lab-pool-id";

describe("resolveWazaLabPoolId", () => {
  it("genera poolId Dō da stile + nome", () => {
    expect(
      resolveWazaLabPoolId({
        name: "Hōshutsu — Rilascio della Fiamma",
        family: "do",
        styleId: "toka",
      }),
    ).toBe("toka-hoshutsu-rilascio-della-fiamma");
  });

  it("genera poolId Madoshō", () => {
    expect(
      resolveWazaLabPoolId({
        name: "Oni no Ago",
        family: "madosho",
        madoshoId: "gokaon",
      }),
    ).toBe("gokaon-oni-no-ago");
  });

  it("genera poolId Ordine con sotto-gruppo", () => {
    expect(
      resolveWazaLabPoolId({
        name: "Colpo di Corda",
        family: "ordine",
        ordineSubgroup: "mugen-tai",
      }),
    ).toBe("ordine-mugen-tai-colpo-di-corda");
  });
});
