import {
  resolveWazaCatalogFamily,
  WAZA_CATALOG_FAMILY_LABELS,
  type WazaCatalogFamily,
} from "@domain/progression/waza-catalog-family";
import {
  groupWazaByStyle,
  resolveWazaStyleId,
  sortWazaByKindAndName,
} from "@domain/progression/waza-grouping";
import { MADOSHO_CATALOG, resolveMadoshoIdFromPoolId } from "@domain/progression/madosho";
import { STYLE_HEX_ORDER, STYLE_LABELS } from "@domain/progression/style-hexagon";

export type WazaLabItem = {
  poolId: string;
  skillId: string | null;
  wazaId: string | null;
  name: string;
  description: string | null;
  effect: string | null;
  rank: string | null;
  isPassive: boolean;
  styleId: string | null;
  madoshoId: string | null;
  costExp: number;
  cs: number | null;
  tier: number | null;
  categoria: string | null;
  genitore: string | null;
  versioneId: string | null;
  versioneNumero: number | null;
  versioneStato: string | null;
  effetti: unknown[];
  skiruIr: string[];
  launchSkiruIds: string[];
  damageSkiruIds: string[];
  damageIndexKind: "CAC" | "CAD" | null;
  hasDbRow: boolean;
  hasAuthoring: boolean;
  chatName: string;
};

export type WazaLabTreeNode = {
  id: string;
  label: string;
  count?: number;
  children?: WazaLabTreeNode[];
  items?: WazaLabItem[];
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function resolveOrdineSubgroup(item: WazaLabItem): string {
  const text = normalizeText(
    `${item.description ?? ""} ${item.effect ?? ""} ${item.poolId}`,
  );
  if (text.includes("mugen-tai") || text.includes("mugen tai")) return "mugen-tai";
  if (text.includes("chisen-tai") || text.includes("chisen tai")) return "chisen-tai";
  return "comune";
}

const ORDINE_SUBGROUP_LABELS: Record<string, string> = {
  "mugen-tai": "Mugen-Tai",
  "chisen-tai": "Chisen-Tai",
  comune: "Arsenale comune",
};

function sortItems(items: WazaLabItem[]): WazaLabItem[] {
  return sortWazaByKindAndName(items, {
    isPassive: (w) => w.isPassive,
    getName: (w) => w.name,
  });
}

function leafNode(id: string, label: string, items: WazaLabItem[]): WazaLabTreeNode {
  const sorted = sortItems(items);
  return { id, label, count: sorted.length, items: sorted };
}

function branchNode(id: string, label: string, children: WazaLabTreeNode[]): WazaLabTreeNode {
  const count = children.reduce((sum, c) => sum + (c.count ?? c.items?.length ?? 0), 0);
  return { id, label, count, children };
}

function buildDoNode(items: WazaLabItem[]): WazaLabTreeNode {
  const styleGroups = groupWazaByStyle(items, (item) => resolveWazaStyleId(item));
  const children = styleGroups.map((g) =>
    leafNode(`do-${g.styleId}`, g.label, g.items as WazaLabItem[]),
  );
  for (const styleId of STYLE_HEX_ORDER) {
    if (!children.some((c) => c.id === `do-${styleId}`)) {
      children.push(leafNode(`do-${styleId}`, STYLE_LABELS[styleId], []));
    }
  }
  children.sort((a, b) => {
    const order = [...STYLE_HEX_ORDER, "other"];
    const ai = order.indexOf(a.id.replace("do-", "") as (typeof order)[number]);
    const bi = order.indexOf(b.id.replace("do-", "") as (typeof order)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return branchNode("do", WAZA_CATALOG_FAMILY_LABELS.do, children);
}

function buildMadoshoNode(items: WazaLabItem[]): WazaLabTreeNode {
  const byRamo = new Map<string, WazaLabItem[]>();
  for (const item of items) {
    const mid =
      item.madoshoId ??
      resolveMadoshoIdFromPoolId(item.poolId) ??
      (item.genitore ? `genitore:${item.genitore}` : "other");
    const list = byRamo.get(mid) ?? [];
    list.push(item);
    byRamo.set(mid, list);
  }

  const children: WazaLabTreeNode[] = MADOSHO_CATALOG.map((m) =>
    leafNode(`madosho-${m.id}`, m.name, byRamo.get(m.id) ?? []),
  ).filter((n) => (n.count ?? 0) > 0);

  const other = byRamo.get("other") ?? [];
  if (other.length > 0) {
    children.push(leafNode("madosho-other", "Altro lignaggio", other));
  }

  for (const [key, list] of byRamo.entries()) {
    if (key.startsWith("genitore:") && list.length > 0) {
      const label = key.replace("genitore:", "");
      children.push(leafNode(`madosho-gen-${label}`, label, list));
    }
  }

  return branchNode("madosho", WAZA_CATALOG_FAMILY_LABELS.madosho, children);
}

function buildOrdineNode(items: WazaLabItem[]): WazaLabTreeNode {
  const bySubgroup = new Map<string, WazaLabItem[]>();
  for (const item of items) {
    const key = resolveOrdineSubgroup(item);
    const list = bySubgroup.get(key) ?? [];
    list.push(item);
    bySubgroup.set(key, list);
  }

  const order = ["mugen-tai", "chisen-tai", "comune"];
  const children = order
    .filter((k) => (bySubgroup.get(k)?.length ?? 0) > 0)
    .map((k) => leafNode(`ordine-${k}`, ORDINE_SUBGROUP_LABELS[k] ?? k, bySubgroup.get(k)!));

  return branchNode("ordine", WAZA_CATALOG_FAMILY_LABELS.ordine, children);
}

export function buildWazaLabTree(items: WazaLabItem[]): WazaLabTreeNode[] {
  const byFamily = new Map<WazaCatalogFamily, WazaLabItem[]>();
  for (const item of items) {
    const family = resolveWazaCatalogFamily({
      styleId: item.styleId,
      madoshoId: item.madoshoId,
      description: item.description,
      name: item.name,
      poolId: item.poolId,
    });
    const list = byFamily.get(family) ?? [];
    list.push(item);
    byFamily.set(family, list);
  }

  const tree: WazaLabTreeNode[] = [];

  if (byFamily.has("do")) {
    tree.push(buildDoNode(byFamily.get("do")!));
  }
  if (byFamily.has("madosho")) {
    tree.push(buildMadoshoNode(byFamily.get("madosho")!));
  }
  if (byFamily.has("ordine")) {
    tree.push(buildOrdineNode(byFamily.get("ordine")!));
  }
  if (byFamily.has("oni-no-mori")) {
    tree.push(
      leafNode("oni-no-mori", WAZA_CATALOG_FAMILY_LABELS["oni-no-mori"], byFamily.get("oni-no-mori")!),
    );
  }
  if (byFamily.has("generiche")) {
    tree.push(leafNode("generiche", WAZA_CATALOG_FAMILY_LABELS.generiche, byFamily.get("generiche")!));
  }

  return tree;
}

export function flattenWazaLabTree(nodes: WazaLabTreeNode[]): WazaLabItem[] {
  const out: WazaLabItem[] = [];
  for (const node of nodes) {
    if (node.items) out.push(...node.items);
    if (node.children) out.push(...flattenWazaLabTree(node.children));
  }
  return out;
}
