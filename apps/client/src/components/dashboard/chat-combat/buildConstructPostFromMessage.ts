import { deriveConstructProfile, type ConstructProprietaId } from "@domain/combat/construct-profile";
import { CONSTRUCT_SIZES, type ConstructSizeId } from "@domain/combat/constructs";
import { extractLaunchTierFromText } from "@domain/combat/waza-launch";
import { wazaEffectDeclaresConstruct } from "@domain/combat/waza-skiru-riders";
import type { SkiruSheet } from "@domain/skiru/types";
import type { ConstructResolutionPostData, ConstructSticker } from "./ChatConstructResolutionPost";

const SIZE_LABELS: Record<ConstructSizeId, ConstructResolutionPostData["taglia"]> = {
  piccola: "Piccola",
  media: "Media",
  grande: "Grande",
  enorme: "Enorme",
};

/** Estrae `[res:N]` dal testo (resistenza pre-calcolata lato mittente). */
function extractResTagFromText(text: string): number | null {
  const m = /\[res:(\d+)\]/i.exec(text);
  const v = m?.[1] != null ? parseInt(m[1], 10) : NaN;
  return Number.isFinite(v) && v > 0 ? v : null;
}

/** Estrae il nome costrutto da `[costrutto:standalone:Nome]`. */
export function extractStandaloneConstructName(text: string): string | null {
  const m = /\[costrutto:standalone:([^\]]+)\]/i.exec(text);
  return m?.[1]?.trim() ?? null;
}

/**
 * Card costrutto per evoca diretta da Z5 (senza waza).
 * Attivata dal tag `[costrutto:standalone:Nome]` nel messaggio.
 */
export function buildStandaloneConstructPostFromMessage(input: {
  messageContent: string;
  actorSkiruSheet?: SkiruSheet | null;
  actorHpMax?: number | null;
}): ConstructResolutionPostData | null {
  const nome = extractStandaloneConstructName(input.messageContent);
  if (!nome) return null;

  const taglia = extractTagliaFromText(input.messageContent) ?? "media";
  const stickers = extractStickersFromText(input.messageContent);
  const tier = extractLaunchTierFromText(input.messageContent);

  let resistenza: number | null = null;
  let movimento: number | null = null;
  let danno: number | null = null;

  if (tier != null && input.actorSkiruSheet) {
    const profile = deriveConstructProfile({
      wazaTier: tier,
      taglia,
      proprieta: stickers,
      creator: { sheet: input.actorSkiruSheet, hpMax: input.actorHpMax ?? undefined },
      resistenza: "DERIVATA",
      movimento_m: "DERIVATA",
    });
    resistenza = profile.resistenza ?? null;
    movimento = profile.movimento_m ?? null;
    danno = profile.danno ?? null;
  } else {
    // Fallback: legge [res:N] dal testo (pre-calcolato lato mittente)
    resistenza = extractResTagFromText(input.messageContent);
  }

  const sizeDef = CONSTRUCT_SIZES[taglia];

  const hpBase = input.actorHpMax != null ? Math.floor(input.actorHpMax / 2) : null;
  const hpMax = resistenza ?? 0;

  return {
    nome,
    taglia: SIZE_LABELS[taglia],
    movimentoM: movimento ?? 0,
    ...(danno != null ? { dannoMedio: danno } : {}),
    hpCurrent: hpMax,
    hpMax,
    stickers: stickers.map((s) => STICKER_LABELS[s]),
    expanded: {
      bonusMalus: [
        ...(resistenza != null ? [{ label: "Resistenza", value: `${resistenza}${hpBase != null ? ` (HP/2=${hpBase} × ${sizeDef.resistanceMult})` : ""}` }] : []),
        ...(danno != null ? [{ label: "Danno", value: `${danno}` }] : []),
        ...(movimento != null ? [{ label: "Movimento", value: `${movimento} m/quarto` }] : []),
        ...(tier != null ? [{ label: "Tier waza", value: `T${tier}` }] : []),
      ],
      note: "Costrutto evocato direttamente.",
    },
  };
}

/** Estrae `[taglia:X]` dal testo del messaggio. */
function extractTagliaFromText(text: string): ConstructSizeId | null {
  const m = /\[taglia:([a-z]+)\]/i.exec(text);
  const v = m?.[1]?.toLowerCase();
  if (v === "piccola" || v === "media" || v === "grande" || v === "enorme") return v;
  return null;
}

/** Estrae sticker da `[sticker:A+B+C]` nel messaggio. */
function extractStickersFromText(text: string): ConstructProprietaId[] {
  const m = /\[sticker:([^\]]+)\]/i.exec(text);
  if (!m) return [];
  return m[1]!.split("+").filter((s): s is ConstructProprietaId =>
    s === "BATTERIA" || s === "PERSONALE" || s === "TORO"
  );
}

const STICKER_LABELS: Record<ConstructProprietaId, ConstructSticker> = {
  BATTERIA: "Batteria",
  PERSONALE: "Personale",
  TORO: "Tōrō",
};

/**
 * Costruisce ConstructResolutionPostData da un messaggio chat che contiene `[taglia:X]`.
 * Ritorna null se il messaggio non evoca un costrutto.
 */
export function buildConstructPostFromMessage(input: {
  messageContent: string;
  wazaName: string;
  wazaEffect?: string | null;
  actorSkiruSheet?: SkiruSheet | null;
  actorHpMax?: number | null;
}): ConstructResolutionPostData | null {
  const { messageContent, wazaName, wazaEffect, actorSkiruSheet, actorHpMax } = input;

  // Verifica che la waza evochi davvero un costrutto
  if (!wazaEffectDeclaresConstruct(wazaEffect)) return null;

  const taglia = extractTagliaFromText(messageContent) ?? "media";
  const stickers = extractStickersFromText(messageContent);
  const tier = extractLaunchTierFromText(messageContent);

  let resistenza: number | null = null;
  let movimento: number | null = null;
  let danno: number | null = null;

  if (tier != null && actorSkiruSheet) {
    const profile = deriveConstructProfile({
      wazaTier: tier,
      taglia,
      proprieta: stickers,
      creator: { sheet: actorSkiruSheet, hpMax: actorHpMax ?? undefined },
      resistenza: "DERIVATA",
      movimento_m: "DERIVATA",
    });
    resistenza = profile.resistenza ?? null;
    movimento = profile.movimento_m ?? null;
    danno = profile.danno ?? null;
  }

  const sizeDef = CONSTRUCT_SIZES[taglia];

  const hpBase = input.actorHpMax != null ? Math.floor(input.actorHpMax / 2) : null;

  return {
    nome: wazaName,
    taglia: SIZE_LABELS[taglia],
    movimentoM: movimento ?? 0,
    ...(danno != null ? { dannoMedio: danno } : {}),
    hpCurrent: resistenza ?? 0,
    hpMax: resistenza ?? 0,
    stickers: stickers.map((s) => STICKER_LABELS[s]),
    expanded: {
      bonusMalus: [
        ...(resistenza != null ? [{ label: "Resistenza", value: `${resistenza}${hpBase != null ? ` (HP/2=${hpBase} × ${sizeDef.resistanceMult})` : ""}` }] : []),
        ...(danno != null ? [{ label: "Danno", value: `${danno}` }] : []),
        ...(movimento != null ? [{ label: "Movimento", value: `${movimento} m/quarto` }] : []),
        ...(tier != null ? [{ label: "Tier waza", value: `T${tier}` }] : []),
      ],
      note: "Resistenza: HP/2 × taglia. Danneggiabile con waza o attacco fisico.",
    },
  };
}
