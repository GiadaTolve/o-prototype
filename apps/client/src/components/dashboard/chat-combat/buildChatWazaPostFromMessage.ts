import {
  buildIndicativeActionIndex,
  calculateSuccessIndex,
} from "@domain/combat/resolution";
import {
  extractHitDeclaredFromText,
  extractLaunchSkiruId,
  extractLaunchTierFromText,
  extractWazaLaunchTargetSpec,
  resolveLaunchIrFromMessage,
  resolveRelevantLaunchSkiruCandidates,
} from "@domain/combat/waza-launch";
import {
  buildActionIndexFromDeclaredSkiru,
  computeLaunchDamagePreview,
  extractMechanicTagsFromEffect,
  getSkiruRider,
} from "@domain/combat/waza-skiru-riders";
import {
  extractIrTagFromText,
  type WazaTagCatalogEntry,
  type WazaTagPreview,
} from "@domain/combat/waza-tag-preview";
import { getSkiruDef } from "@domain/skiru/catalog";
import { getSkiruPoints } from "@domain/skiru/progression";
import type { SkiruSheet } from "@domain/skiru/types";
import type { WazaResolutionPostData } from "./ChatWazaResolutionPost";

function extractOrigineTag(text: string): string | null {
  const m = /\[origine:\s*([^\]]+)\]/i.exec(text);
  return m?.[1]?.trim() ?? null;
}

function buildDescrizione(preview: WazaTagPreview): string {
  const parts: string[] = [];
  if (preview.styleLabel) parts.push(preview.styleLabel);
  if (preview.isPassive) {
    parts.push("Passiva");
  } else {
    if (preview.tier != null) parts.push(`T${preview.tier}`);
    if (preview.csCost != null) parts.push(`CS ${preview.csCost}`);
  }
  const desc = preview.description?.trim();
  if (desc) parts.push(desc);
  return parts.join(" · ");
}

function splitWazaDisplayName(name: string): { romaji: string; italiano: string } {
  const trimmed = name.trim();
  const dashSplit = trimmed.split(/\s+[—–-]\s+/);
  if (dashSplit.length >= 2) {
    return { romaji: dashSplit[0]!.trim(), italiano: dashSplit.slice(1).join(" — ").trim() };
  }
  return { romaji: trimmed, italiano: "" };
}

export type BuildChatWazaPostInput = {
  messageContent: string;
  characterName: string;
  preview: WazaTagPreview;
  entry?: Pick<WazaTagCatalogEntry, "poolId" | "effect" | "description" | "isPassive"> | null;
  actorSkiruSheet?: SkiruSheet | null;
};

export function buildChatWazaPostFromMessage(input: BuildChatWazaPostInput): WazaResolutionPostData {
  const { messageContent, characterName, preview, entry, actorSkiruSheet } = input;
  const sheet = actorSkiruSheet ?? null;
  const effectText = entry?.effect ?? entry?.description ?? null;
  const messageIr = extractIrTagFromText(messageContent);
  const launchSkiruId = extractLaunchSkiruId(messageContent);
  const launchTargetSpec = extractWazaLaunchTargetSpec(messageContent);
  const launchTier = extractLaunchTierFromText(messageContent) ?? preview.tier;
  const hitDeclared = extractHitDeclaredFromText(messageContent);
  const skiruName = launchSkiruId ? (getSkiruDef(launchSkiruId)?.name ?? launchSkiruId) : null;
  const riderLabel = launchSkiruId ? (getSkiruRider(launchSkiruId)?.label ?? null) : null;
  const targetName =
    launchTargetSpec?.nameQuery ??
    (launchTargetSpec?.characterId ? `id:${launchTargetSpec.characterId.slice(0, 8)}…` : null);

  const { romaji, italiano } = splitWazaDisplayName(preview.name);

  const papabili =
    sheet && entry && !entry.isPassive
      ? resolveRelevantLaunchSkiruCandidates(sheet, entry).map((id) => ({
          label: getSkiruDef(id)?.name ?? id,
          rank: getSkiruPoints(sheet, id),
        }))
      : [];

  const wazaTags = extractMechanicTagsFromEffect(effectText);
  let irBreakdown: ReturnType<typeof calculateSuccessIndex> | null = null;

  if (sheet) {
    const actionInput = launchSkiruId
      ? buildActionIndexFromDeclaredSkiru(sheet, launchSkiruId)
      : buildIndicativeActionIndex(sheet);
    irBreakdown = calculateSuccessIndex(sheet, {
      ...actionInput,
      wazaTags: wazaTags.length > 0 ? wazaTags : undefined,
    });
  }

  const irFinale =
    resolveLaunchIrFromMessage(messageContent, sheet, messageIr) ??
    irBreakdown?.successIndex ??
    (preview.isPassive ? 0 : null);

  const dmg =
    !preview.isPassive && launchTier != null
      ? computeLaunchDamagePreview({
          tier: launchTier,
          attackerSheet: sheet,
          declaredSkiruId: launchSkiruId,
          wazaEffectText: effectText,
        })
      : null;

  const dannoLordo = dmg?.totalBeforeMitigation ?? preview.damage ?? null;
  const dannoFinale = dannoLordo ?? 0;
  const irDisplay = irFinale ?? 0;

  const irModifiers: { label: string; value: number }[] = [];
  if (irBreakdown && irBreakdown.indexBonus !== 0) {
    irModifiers.push({ label: "Bonus indice", value: irBreakdown.indexBonus });
  }
  if (irBreakdown && wazaTags.length > 0) {
    const preMeiju = Math.round(irBreakdown.rawAverage + (irBreakdown.indexBonus ?? 0));
    const meijuDelta = irBreakdown.successIndex - preMeiju;
    if (meijuDelta !== 0) {
      irModifiers.push({ label: "Meiju Sōkaiju", value: meijuDelta });
    }
  }
  if (messageIr != null && irFinale != null && irBreakdown && messageIr !== irBreakdown.successIndex) {
    irModifiers.push({ label: "Tag [ir] in chat", value: messageIr - irBreakdown.successIndex });
  }

  const dannoModifiers: { label: string; value: number }[] = [];
  if (dmg) {
    if (dmg.shijuPercentBonus > 0) {
      const bonus = Math.round(dmg.tierValue * dmg.shijuPercentBonus);
      if (bonus > 0) {
        dannoModifiers.push({
          label: `Shiju +${Math.round(dmg.shijuPercentBonus * 1000) / 10}%`,
          value: bonus,
        });
      }
    }
    if (dmg.riderBonus > 0 && riderLabel) {
      dannoModifiers.push({ label: riderLabel, value: dmg.riderBonus });
    } else if (dmg.riderBonus > 0) {
      dannoModifiers.push({ label: "Rider Skiru", value: dmg.riderBonus });
    }
  }

  const statusAttivi: string[] = [];
  if (launchSkiruId && skiruName) statusAttivi.push(`Skiru dichiarata: ${skiruName}`);
  else if (skiruName) statusAttivi.push(`Via ${skiruName}`);
  if (riderLabel && !dannoModifiers.some((m) => m.label === riderLabel)) {
    statusAttivi.push(riderLabel);
  }
  if (targetName) statusAttivi.push(`Bersaglio: ${targetName}`);
  if (hitDeclared) statusAttivi.push("Colpo dichiarato");
  if (!preview.found) statusAttivi.push("Non in catalogo");

  const irBase = irBreakdown
    ? {
        skiruA: getSkiruDef(irBreakdown.physicalSkiruId)?.name ?? irBreakdown.physicalSkiruId,
        valA: irBreakdown.physicalPoints,
        skiruB: getSkiruDef(irBreakdown.channelingSkiruId)?.name ?? irBreakdown.channelingSkiruId,
        valB: irBreakdown.channelingPoints,
        media: irBreakdown.rawAverage,
      }
    : {
        skiruA: "—",
        valA: 0,
        skiruB: "—",
        valB: 0,
        media: irDisplay,
      };

  return {
    characterName,
    descrizione: buildDescrizione(preview),
    wazaRomaji: romaji,
    wazaItaliano: italiano || preview.styleLabel || "",
    toroArma: extractOrigineTag(messageContent) ?? undefined,
    papabili,
    irFinale: irDisplay,
    dannoFinale,
    dannoLordo: dannoLordo ?? undefined,
    isPassive: preview.isPassive,
    notInCatalog: !preview.found,
    expanded: {
      irBase,
      irModifiers,
      dannoTier:
        launchTier != null && dmg
          ? { tier: launchTier, valore: dmg.tierValue }
          : launchTier != null && preview.damage != null
            ? { tier: launchTier, valore: preview.damage }
            : undefined,
      dannoModifiers: dannoModifiers.length > 0 ? dannoModifiers : undefined,
      statusAttivi: statusAttivi.length > 0 ? statusAttivi : undefined,
    },
  };
}
