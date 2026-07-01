/** Parametri derivati Skiru v3 (+ campi legacy in transizione). */
export type CharacterComputed = {
  hpMax?: number;
  hpCurrent?: number;
  body?: number;
  mitigationPercent?: number;
  movementMetersPerQuarter?: number;
  movement?: number;
  cac?: number;
  cad?: number;
  jigokaMax?: number;
  reflexes?: number;
  velocity?: number;
};

export type ResolvedSkiruStats = {
  hpMax: number;
  hpCurrent: number;
  mitigationPercent: number;
  movementMeters: number;
  cac: number;
  cad: number;
};

const MOVEMENT_BAR_CAP = 20;
const MITIGATION_BAR_CAP = 30;

export function resolveCharacterComputed(
  computed?: CharacterComputed | Record<string, number> | null,
): ResolvedSkiruStats {
  const c = (computed ?? {}) as CharacterComputed;
  const hpMax = Math.max(0, c.hpMax ?? c.body ?? 0);
  const hpCurrent = Math.max(
    0,
    Math.min(hpMax, c.hpCurrent ?? c.hpMax ?? c.body ?? 0),
  );
  return {
    hpMax,
    hpCurrent: hpMax > 0 ? hpCurrent : 0,
    mitigationPercent: Math.max(0, Math.min(MITIGATION_BAR_CAP, c.mitigationPercent ?? 0)),
    movementMeters: Math.max(0, c.movementMetersPerQuarter ?? c.movement ?? 0),
    cac: Math.max(0, c.cac ?? 0),
    cad: Math.max(0, c.cad ?? 0),
  };
}

export function formatMovementMeters(meters: number): string {
  if (meters <= 0) return "0m";
  const rounded = Math.round(meters * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}m` : `${rounded.toFixed(1)}m`;
}

export { MOVEMENT_BAR_CAP, MITIGATION_BAR_CAP };
