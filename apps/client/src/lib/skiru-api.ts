import type { SkiruDomainIndex } from "@/components/dashboard/types";

/** Risposta GET /characters/me/skiru e PATCH /characters/me/skiru (§2.7). */
export type SkiruApiResponse = {
  skiruSheet: Record<string, number>;
  expSpendable: number;
  /** Costo EXP del prossimo punto per nodo; null = max o milestone. */
  expCostNextByNode: Record<string, number | null>;
  derived: {
    hpMax: number;
    hpCurrent: number;
    mitigationPercent: number;
    movementMetersPerQuarter: number;
    cac: number;
    cad: number;
  };
  skiruDomains: SkiruDomainIndex[];
  activeJigaMilestone?: string | null;
};

export function isSkiruApiResponse(data: unknown): data is SkiruApiResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "skiruSheet" in data &&
    "expSpendable" in data
  );
}
