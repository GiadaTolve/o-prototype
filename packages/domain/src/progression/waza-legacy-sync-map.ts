import { parseWazaTierFromRank } from "../combat/waza-rank";
import { getTierCsCost } from "../combat/tier";
import {
  isOrdineCatalogWaza,
  isOnimoriCatalogWaza,
  isGenericheCatalogWaza,
  resolveWazaCatalogFamily,
  type WazaCatalogFamily,
} from "./waza-catalog-family";
import { resolveMadoshoIdFromPoolId, type MadoshoId } from "./madosho";
import { isStyleId, STYLE_LABELS } from "./style-hexagon";
import { resolveWazaStyleId } from "./waza-grouping";

/** Genitori ammessi nel vocabolario DB (allineati a waza-taxonomy server). */
export const SYNC_GENITORI_DO = [
  "Tōka-dō",
  "Genzai-dō",
  "Itō-dō",
  "Naikan-dō",
  "Hensei-dō",
  "Hadō-dō",
] as const;

export const SYNC_GENITORI_MADOSHO = [
  "Rin'gai",
  "Gōkaon",
  "Nakigara",
  "Hataori",
  "Ikiryō",
] as const;

export type LegacyWazaSource = {
  skillId: string | null;
  poolId: string;
  name: string;
  description?: string | null;
  effect?: string | null;
  rank?: string | null;
  isPassive: boolean;
  styleId?: string | null;
  madoshoId?: string | null;
};

export type ParsedWazaNames = {
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string | null;
};

export type LegacyTaxonomyMap =
  | {
      mappable: true;
      categoria: "generica" | "do" | "madosho";
      genitore: string | null;
      family: WazaCatalogFamily;
      note: string;
    }
  | {
      mappable: false;
      family: WazaCatalogFamily | "unknown";
      reason: string;
    };

export type LegacySyncPayload = {
  slug: string;
  legacyId: string | null;
  categoria: "generica" | "do" | "madosho";
  genitore: string | null;
  tipo: "passiva" | "attiva";
  tier: number | null;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string | null;
  descrizione: string;
  cs: number;
  tempoQuarti: number | null;
  tags: string[];
  effetti: unknown[];
  statoCodifica: "da_codificare";
  contentHash: string;
};

// Famiglie senza equivalente nel nuovo modello catalogo:
// - "ordine": struttura di appartenenza, non una categoria di waza.
// - "oni-no-mori": famiglia riservata ai pool di premio, struttura da progettare
//   (categoria definita ma vuota; i 7 record inventati sono stati cancellati dalla direzione).
const UNMAPPABLE_FAMILIES = new Set<WazaCatalogFamily>(["ordine", "oni-no-mori"]);

export function parseLegacyWazaName(name: string): ParsedWazaNames {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+[—–−-]\s+/);
  const left = (parts[0] ?? trimmed).trim();
  const nomeItaliano = (parts.slice(1).join(" — ") || left).trim();

  const kanjiMatch = left.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (kanjiMatch) {
    return {
      nomeRomaji: kanjiMatch[1].trim(),
      nomeItaliano,
      kanji: kanjiMatch[2].trim(),
    };
  }

  return {
    nomeRomaji: left,
    nomeItaliano,
    kanji: null,
  };
}

/**
 * Madoshō → genitore canonico, identico ai valori in `vocabolari` (categoria
 * `genitore_madosho`). Evita disallineamenti di label. Komonoire volutamente ASSENTE: Madoshō in rework,
 * esclusa dal sync finché il design non è completo.
 */
const MADOSHO_GENITORE_BY_ID: Partial<Record<MadoshoId, (typeof SYNC_GENITORI_MADOSHO)[number]>> = {
  "ringai-janjae": "Rin'gai",
  gokaon: "Gōkaon",
  nakigara: "Nakigara",
  hataori: "Hataori",
  ikiryo: "Ikiryō",
};

function madoshoGenitoreFromId(id: MadoshoId): string | null {
  return MADOSHO_GENITORE_BY_ID[id] ?? null;
}

export function mapLegacyWazaTaxonomy(source: LegacyWazaSource): LegacyTaxonomyMap {
  const poolId = source.poolId.trim();
  if (!poolId) {
    return { mappable: false, family: "unknown", reason: "poolId mancante" };
  }

  const family = resolveWazaCatalogFamily(source);

  if (UNMAPPABLE_FAMILIES.has(family)) {
    return {
      mappable: false,
      family,
      reason: `Famiglia legacy «${family}» non ha equivalente nel nuovo modello (categoria/genitore)`,
    };
  }

  const pool = poolId.toLowerCase();
  if (pool.startsWith("premio-")) {
    return {
      mappable: false,
      family: "generiche",
      reason: "Waza premio (pool premio-*): assegnazione manuale richiesta",
    };
  }

  if (source.madoshoId) {
    const genitore = madoshoGenitoreFromId(source.madoshoId as MadoshoId);
    if (!genitore) {
      return {
        mappable: false,
        family: "madosho",
        reason: `Madoshō «${source.madoshoId}» non presente nei vocabolari nuovi (es. Komonoire)`,
      };
    }
    return {
      mappable: true,
      categoria: "madosho",
      genitore,
      family: "madosho",
      note: `madoshoId=${source.madoshoId}`,
    };
  }

  const resolvedMadosho = resolveMadoshoIdFromPoolId(poolId);
  if (resolvedMadosho) {
    const genitore = madoshoGenitoreFromId(resolvedMadosho);
    if (!genitore) {
      return {
        mappable: false,
        family: "madosho",
        reason: `Pool Madoshō «${poolId}» → ${resolvedMadosho}, genitore non in vocabolario`,
      };
    }
    return {
      mappable: true,
      categoria: "madosho",
      genitore,
      family: "madosho",
      note: `pool→${resolvedMadosho}`,
    };
  }

  if (family === "madosho") {
    return {
      mappable: false,
      family,
      reason: "Classificata Madoshō ma lignaggio non risolvibile con certezza",
    };
  }

  const styleId = resolveWazaStyleId(source);
  if (styleId && isStyleId(styleId)) {
    const genitore = STYLE_LABELS[styleId];
    if (!(SYNC_GENITORI_DO as readonly string[]).includes(genitore)) {
      return {
        mappable: false,
        family: "do",
        reason: `Via «${styleId}» non mappata su vocabolario Sei Vie`,
      };
    }
    return {
      mappable: true,
      categoria: "do",
      genitore,
      family: "do",
      note: `styleId=${styleId}`,
    };
  }

  if (isGenericheCatalogWaza(source) || family === "generiche") {
    return {
      mappable: true,
      categoria: "generica",
      genitore: null,
      family: "generiche",
      note: "generica",
    };
  }

  if (isOrdineCatalogWaza(source)) {
    return {
      mappable: false,
      family: "ordine",
      reason: "Waza Ordine: assegnazione manuale richiesta",
    };
  }

  if (isOnimoriCatalogWaza(source)) {
    return {
      mappable: false,
      family: "oni-no-mori",
      reason: "Waza Oni no Mori: assegnazione manuale richiesta",
    };
  }

  if (source.styleId && source.styleId !== "generiche") {
    return {
      mappable: false,
      family: "do",
      reason: `styleId «${source.styleId}» non riconosciuto come Via valida`,
    };
  }

  return {
    mappable: true,
    categoria: "generica",
    genitore: null,
    family: family === "do" ? "generiche" : family,
    note: "fallback generica (nessun segnale Via/Madoshō affidabile)",
  };
}

export function buildLegacySyncPayload(source: LegacyWazaSource): LegacySyncPayload | null {
  const taxonomy = mapLegacyWazaTaxonomy(source);
  if (!taxonomy.mappable) return null;

  const names = parseLegacyWazaName(source.name);
  const tier = source.isPassive ? null : parseWazaTierFromRank(source.rank);
  const cs = tier != null ? getTierCsCost(tier) : 0;

  const payload: LegacySyncPayload = {
    slug: source.poolId.trim(),
    legacyId: source.skillId,
    categoria: taxonomy.categoria,
    genitore: taxonomy.genitore,
    tipo: source.isPassive ? "passiva" : "attiva",
    tier,
    nomeRomaji: names.nomeRomaji,
    nomeItaliano: names.nomeItaliano,
    kanji: names.kanji,
    descrizione: (source.description ?? source.effect ?? "").trim(),
    cs,
    tempoQuarti: source.isPassive ? null : null,
    tags: [],
    effetti: [],
    statoCodifica: "da_codificare",
    contentHash: "",
  };

  payload.contentHash = hashLegacySyncPayload(payload);
  return payload;
}

export function hashLegacySyncPayload(
  payload: Pick<
    LegacySyncPayload,
    | "categoria"
    | "genitore"
    | "tipo"
    | "tier"
    | "nomeRomaji"
    | "nomeItaliano"
    | "kanji"
    | "descrizione"
    | "cs"
    | "tempoQuarti"
  >,
): string {
  return JSON.stringify({
    categoria: payload.categoria,
    genitore: payload.genitore,
    tipo: payload.tipo,
    tier: payload.tier,
    nomeRomaji: payload.nomeRomaji,
    nomeItaliano: payload.nomeItaliano,
    kanji: payload.kanji,
    descrizione: payload.descrizione,
    cs: payload.cs,
    tempoQuarti: payload.tempoQuarti,
  });
}
