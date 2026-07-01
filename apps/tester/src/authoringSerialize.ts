/** Escape per stringhe in export TypeScript (virgolette doppie). */
export function escapeDoubleQuoted(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/** Escape per letterali tra apici singoli. */
export function escapeSingleQuoted(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}
