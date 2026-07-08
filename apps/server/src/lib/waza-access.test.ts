import { describe, expect, it } from "bun:test";
import { resolveCanManageWaza, resolveCanPublishWaza } from "./waza-access";

/**
 * Matrice §8 verificata sui check sincroni (roleIcon già noto).
 *
 * | Ruolo                | roleIcon        | Manage | Publish |
 * |----------------------|-----------------|:------:|:-------:|
 * | Proprietario         | admin           |  SÌ    |   SÌ    |
 * | Moderatore           | moderatore      |  SÌ    |   SÌ    |
 * | Fixer                | fixer           |  SÌ    |   NO    |
 * | Shinigami            | shinigami       |  NO    |   NO    |
 * | Capo Shinigami       | capo-shinigami  |  NO    |   NO    |
 * | account ADMIN        | (nessuna)       |  SÌ    |   SÌ    |
 * | account MASTER       | (nessuna)       |  NO    |   NO    |
 * | Player               | (nessuna)       |  NO    |   NO    |
 */
describe("waza-access — resolveCanManageWaza (gestione catalogo)", () => {
  it("consente Proprietario, Moderatore, Fixer", () => {
    expect(resolveCanManageWaza("PLAYER", "admin")).toBe(true);
    expect(resolveCanManageWaza("PLAYER", "moderatore")).toBe(true);
    expect(resolveCanManageWaza("PLAYER", "fixer")).toBe(true);
  });

  it("consente account ADMIN anche senza pixel-icon", () => {
    expect(resolveCanManageWaza("ADMIN", undefined)).toBe(true);
  });

  it("nega Shinigami, Capo Shinigami, MASTER e Player", () => {
    expect(resolveCanManageWaza("PLAYER", "shinigami")).toBe(false);
    expect(resolveCanManageWaza("PLAYER", "capo-shinigami")).toBe(false);
    expect(resolveCanManageWaza("MASTER", undefined)).toBe(false);
    expect(resolveCanManageWaza("PLAYER", undefined)).toBe(false);
  });
});

describe("waza-access — resolveCanPublishWaza (Sprint 4)", () => {
  it("consente solo Proprietario e Moderatore (+ ADMIN)", () => {
    expect(resolveCanPublishWaza("PLAYER", "admin")).toBe(true);
    expect(resolveCanPublishWaza("PLAYER", "moderatore")).toBe(true);
    expect(resolveCanPublishWaza("ADMIN", undefined)).toBe(true);
  });

  it("nega il Fixer (può gestire ma non pubblicare)", () => {
    expect(resolveCanManageWaza("PLAYER", "fixer")).toBe(true);
    expect(resolveCanPublishWaza("PLAYER", "fixer")).toBe(false);
  });

  it("nega Shinigami, Capo Shinigami, MASTER e Player", () => {
    expect(resolveCanPublishWaza("PLAYER", "shinigami")).toBe(false);
    expect(resolveCanPublishWaza("PLAYER", "capo-shinigami")).toBe(false);
    expect(resolveCanPublishWaza("MASTER", undefined)).toBe(false);
    expect(resolveCanPublishWaza("PLAYER", undefined)).toBe(false);
  });
});
