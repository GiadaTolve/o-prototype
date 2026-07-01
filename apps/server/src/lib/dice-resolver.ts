/**
 * Risolve i dadi in chat.
 * - Comandi: `/d 20`, `/dado 100` (1dN, facce 2–1000)
 * - Legacy: `[dado:1d20]`, `[dado:2d6+M]`, …
 */

type Stats = { mind?: number; dexterity?: number; strength?: number; constitution?: number; empathy?: number };

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function parseAndRoll(expr: string, stats: Stats): { result: number; label: string } | null {
  const trimmed = expr.trim().toUpperCase();
  const simpleMatch = trimmed.match(/^(\d+)D(\d+)$/);
  if (simpleMatch) {
    const n = parseInt(simpleMatch[1], 10);
    const sides = parseInt(simpleMatch[2], 10);
    if (n < 1 || n > 10 || sides < 2 || sides > 100) return null;
    let sum = 0;
    const rolls: number[] = [];
    for (let i = 0; i < n; i++) {
      const r = rollDie(sides);
      rolls.push(r);
      sum += r;
    }
    const label = n === 1 ? `${sum}` : `${rolls.join("+")} = ${sum}`;
    return { result: sum, label };
  }

  const modMatch = trimmed.match(/^(\d+)D(\d+)\s*\+\s*([FDCME])$/);
  if (modMatch) {
    const n = parseInt(modMatch[1], 10);
    const sides = parseInt(modMatch[2], 10);
    const statKey = modMatch[3];
    const statMap: Record<string, keyof Stats> = {
      F: "strength",
      D: "dexterity",
      C: "constitution",
      M: "mind",
      E: "empathy",
    };
    const stat = stats[statMap[statKey] ?? "mind"] ?? 0;
    if (n < 1 || n > 10 || sides < 2 || sides > 100) return null;
    let sum = 0;
    const rolls: number[] = [];
    for (let i = 0; i < n; i++) {
      const r = rollDie(sides);
      rolls.push(r);
      sum += r;
    }
    const total = sum + stat;
    const label = stat > 0 ? `${sum}+${stat}(${statKey}) = ${total}` : `${sum} = ${total}`;
    return { result: total, label };
  }

  return null;
}

const SLASH_DICE_PATTERN = /(^|\s)\/(?:d|dado)\s+(\d{1,4})(?=\s|$|[.,!?;:])/gi;

/** True se il messaggio contiene dadi da risolvere server-side. */
export function messageNeedsDiceResolution(text: string): boolean {
  SLASH_DICE_PATTERN.lastIndex = 0;
  return /\[dado:/i.test(text) || SLASH_DICE_PATTERN.test(text);
}

/** Risolve `/d N` e `/dado N` nel testo (1dN). */
export function resolveSlashDiceInMessage(text: string): string {
  return text.replace(SLASH_DICE_PATTERN, (match, prefix: string, facesStr: string) => {
    const faces = parseInt(facesStr, 10);
    if (faces < 2 || faces > 1000) return match;
    const roll = rollDie(faces);
    return `${prefix}[🎲 ${roll}/${faces}]`;
  });
}

/**
 * Sostituisce comandi slash e tag [dado:…] con il risultato del tiro.
 */
export function resolveDiceInMessage(text: string, stats: Stats): string {
  let resolved = resolveSlashDiceInMessage(text);
  resolved = resolved.replace(/\[dado:([^\]]+)\]/gi, (_, expr) => {
    const parsed = parseAndRoll(expr, stats);
    if (!parsed) return `[dado:${expr}]`;
    return `[🎲 ${parsed.label}]`;
  });
  return resolved;
}
