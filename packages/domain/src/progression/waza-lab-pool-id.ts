import type { StyleId } from "./style-hexagon";

export type WazaLabFamily = "do" | "madosho" | "ordine" | "generiche" | "oni-no-mori";

export function slugifyWazaPoolId(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function resolveWazaLabPoolId(input: {
  name: string;
  family: WazaLabFamily;
  styleId?: string | null;
  madoshoId?: string | null;
  ordineSubgroup?: string | null;
}): string {
  const slug = slugifyWazaPoolId(input.name);
  if (!slug) return "";

  switch (input.family) {
    case "do": {
      const style = (input.styleId ?? "do").trim().toLowerCase();
      return `${style}-${slug}`.replace(/-+/g, "-");
    }
    case "madosho": {
      const mid = (input.madoshoId ?? "madosho").trim().toLowerCase();
      return `${mid}-${slug}`.replace(/-+/g, "-");
    }
    case "ordine": {
      const sub = slugifyWazaPoolId(input.ordineSubgroup ?? "");
      return sub ? `ordine-${sub}-${slug}` : `ordine-${slug}`;
    }
    case "oni-no-mori":
      return `onimori-${slug}`;
    case "generiche":
    default:
      return `generiche-${slug}`;
  }
}

export async function uniqueWazaPoolId(
  base: string,
  exists: (poolId: string) => Promise<boolean>,
): Promise<string> {
  const root = slugifyWazaPoolId(base);
  if (!root) throw new Error("Impossibile generare poolId");
  if (!(await exists(root))) return root;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error("Troppi poolId in conflitto per questo nome.");
}
