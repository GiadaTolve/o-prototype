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
}): ConstructResolutionPostData | null {
  const { messageContent, wazaName, wazaEffect, actorSkiruSheet } = input;

  // Verifica che la waza evochi davvero un costrutto
  if (!wazaEffectDeclaresConstruct(wazaEffect)) return null;

  const taglia = extractTagliaFromText(messageContent) ?? "media";
  const stickers = extractStickersFromText(messageContent);
  const tier = extractLaunchTierFromText(messageContent);

  let resistenza: number | null = null;
  let movimento: number | null = null;

  if (tier != null && actorSkiruSheet) {
    const profile = deriveConstructProfile({
      wazaTier: tier,
      taglia,
      proprieta: stickers,
      creator: { sheet: actorSkiruSheet },
      resistenza: "DERIVATA",
      movimento_m: "DERIVATA",
    });
    resistenza = profile.resistenza ?? null;
    movimento = profile.movimento_m ?? null;
  }

  const sizeDef = CONSTRUCT_SIZES[taglia];
  const hasDanno = sizeDef.resistanceMult >= 1.5; // Grande/Enorme hanno danno

  return {
    nome: wazaName,
    taglia: SIZE_LABELS[taglia],
    movimentoM: movimento ?? 0,
    ...(hasDanno && tier != null ? { dannoMedio: tier } : {}),
    hpCurrent: resistenza ?? 0,
    hpMax: resistenza ?? 0,
    stickers: stickers.map((s) => STICKER_LABELS[s]),
    expanded: {
      bonusMalus: [
        ...(tier != null ? [{ label: "Tier waza", value: `T${tier}` }] : []),
        { label: "Taglia × resist.", value: `×${sizeDef.resistanceMult}` },
        ...(movimento != null ? [{ label: "Movimento", value: `${movimento} m/quarto` }] : []),
      ],
      note: "Resistenza derivata da tier × taglia. Danneggiabile con waza o attacco fisico.",
    },
  };
}
