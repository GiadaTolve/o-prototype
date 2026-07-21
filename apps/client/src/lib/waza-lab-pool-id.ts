export {
  resolveWazaLabPoolId,
  slugifyWazaPoolId,
  type WazaLabFamily,
} from "@domain/progression/waza-lab-pool-id";

import type { StyleId } from "@domain/progression/style-hexagon";
import type { WazaLabFamily } from "@domain/progression/waza-lab-pool-id";

export const WAZA_LAB_FAMILY_LABELS: Record<WazaLabFamily, string> = {
  do: "Dō",
  madosho: "Madōshō",
  ordine: "Ordine",
  generiche: "Waza Generiche",
  "oni-no-mori": "Oni no Mori",
};

export const WAZA_LAB_STYLE_OPTIONS: { id: StyleId; label: string }[] = [
  { id: "toka", label: "Tōka-dō" },
  { id: "genzai", label: "Genzai-dō" },
  { id: "ito", label: "Itō-dō" },
  { id: "naikan", label: "Naikan-dō" },
  { id: "hensei", label: "Hensei-dō" },
  { id: "hado", label: "Hadō-dō" },
];

export const WAZA_LAB_MADOSHO_OPTIONS = [
  { id: "ringai-janjae", label: "Rin'gai" },
  { id: "gokaon", label: "Gōkaon" },
  { id: "nakigara", label: "Nakigara" },
  { id: "hataori", label: "Hataori" },
  { id: "ikiryo", label: "Ikiryō" },
] as const;

export const WAZA_LAB_ORDINE_OPTIONS = [
  { id: "", label: "Arsenale comune" },
  { id: "mugen-tai", label: "Mugen-Tai" },
  { id: "chisen-tai", label: "Chisen-Tai" },
] as const;
