import { describe, expect, test } from "bun:test";
import {
  buildCondizioneCanonica,
  parseCondizioneCanonica,
} from "./condizione-constants";
import { createDefaultBlocco, getBloccoSchemaByTipo } from "./effetti-schema";
import { bloccoIndexFromPath, translateAjvError } from "./waza-editor-utils";

describe("effetti-schema", () => {
  test("createDefaultBlocco DANNO include campi obbligatori", () => {
    const blocco = createDefaultBlocco("DANNO");
    expect(blocco.tipo).toBe("DANNO");
    expect(blocco.trigger).toBeTruthy();
    expect(blocco.bersaglio).toBeTruthy();
    expect(blocco.durata).toBeTruthy();
    expect(blocco.valore).toBeTruthy();
  });

  test("createDefaultBlocco MANUALE richiede solo testo", () => {
    const blocco = createDefaultBlocco("MANUALE");
    expect(blocco.tipo).toBe("MANUALE");
    expect(blocco.testo).toBeTruthy();
    const schema = getBloccoSchemaByTipo("MANUALE");
    expect(schema?.required).toEqual(["tipo", "testo"]);
  });
});

describe("condizione", () => {
  test("build e parse toro.batteria", () => {
    const raw = buildCondizioneCanonica("toro.batteria", "==", "true");
    expect(raw).toBe("toro.batteria == true");
    expect(parseCondizioneCanonica(raw)).toMatchObject({
      soggettoId: "toro.batteria",
      operatore: "==",
      valore: "true",
    });
  });

  test("build e parse stack(status)", () => {
    const raw = buildCondizioneCanonica("stack(status)", ">=", "3", "Incendiato");
    expect(raw).toBe("stack(Incendiato) >= 3");
    expect(parseCondizioneCanonica(raw)).toMatchObject({
      soggettoId: "stack(status)",
      operatore: ">=",
      valore: "3",
      statusNome: "Incendiato",
    });
  });

  test("build e parse toro.lanciata", () => {
    const raw = buildCondizioneCanonica("toro.lanciata", "==", "true");
    expect(raw).toBe("toro.lanciata == true");
    expect(parseCondizioneCanonica(raw)).toMatchObject({
      soggettoId: "toro.lanciata",
      operatore: "==",
      valore: "true",
    });
  });
});

describe("waza-editor-utils", () => {
  test("bloccoIndexFromPath", () => {
    expect(bloccoIndexFromPath("effetti[2].valore")).toBe(2);
    expect(bloccoIndexFromPath("/1/trigger")).toBe(1);
  });

  test("translateAjvError in italiano con blocco", () => {
    const issue = translateAjvError({
      instancePath: "/0/valore",
      schemaPath: "",
      keyword: "required",
      message: "must have required property 'n'",
      params: { missingProperty: "n" },
    });
    expect(issue.messaggio).toContain("Blocco 1");
    expect(issue.messaggio).toContain("manca il campo");
  });
});
