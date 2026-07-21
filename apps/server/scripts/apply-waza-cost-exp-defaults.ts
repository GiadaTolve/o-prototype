/**
 * Applica i costi EXP di default a tutte le waza in skills (type=WAZA).
 * Regola: Passiva/T1=15, T2=20, T3=25, T4=35, T5=40.
 *
 * Uso: cd apps/server && bun run scripts/apply-waza-cost-exp-defaults.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '../../.env') })

import { eq } from 'drizzle-orm'
import { db } from '../src/plugins/db'
import { skills } from '../src/db/schema'
import { resolveDefaultWazaCostExp } from '@domain/progression/waza-cost-exp'

async function main() {
  const rows = await db.query.skills.findMany({
    where: eq(skills.type, 'WAZA'),
    columns: {
      id: true,
      poolId: true,
      name: true,
      rank: true,
      isPassive: true,
      costExp: true,
    },
  })

  let updated = 0
  for (const row of rows) {
    const next = resolveDefaultWazaCostExp({
      isPassive: row.isPassive ?? false,
      rank: row.rank,
    })
    if ((row.costExp ?? 0) === next) continue
    await db.update(skills).set({ costExp: next }).where(eq(skills.id, row.id))
    updated += 1
    console.log(`✓ ${row.poolId ?? row.name}: ${row.costExp ?? 0} → ${next}`)
  }

  console.log(`\nWaza totali: ${rows.length} · aggiornate: ${updated}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
