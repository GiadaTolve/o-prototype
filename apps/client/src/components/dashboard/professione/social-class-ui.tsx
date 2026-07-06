import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { icons } from "@/lib/icons";
import type { SocialClassId } from "@domain/shakai-kaikyu/types";

export const SOCIAL_CLASS_ICON: Record<SocialClassId, IconDefinition> = {
  ishi: icons.heart,
  shokunin: icons.gear,
  ryoshi: icons.search,
  seijika: icons.bullhorn,
  shisai: icons.fire,
};

export const ROLE_LABEL: Record<"keystone" | "path" | "capstone", string> = {
  keystone: "Keystone",
  path: "Sentiero",
  capstone: "Capstone",
};
