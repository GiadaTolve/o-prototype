/**
 * Applica i costi CS di base alle versioni authoring (waza_versioni.cs).
 * Regola: Passiva=0, T1=2, T2=4, T3=6, T4=8, T5=10.
 *
 * Uso: cd apps/server && bun run scripts/apply-waza-cost-cs-defaults.ts
 *
 * Di default aggiorna solo se il CS attuale coincide con il vecchio schema
 * (1/2/3/5/7) o è 0 su attive — così override manuali restano intatti.
 * Passa --force per riscrivere tutti i CS al default del tier.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '../../.env') })

import { eq } from 'drizzle-orm'
import { db } from '../src/plugins/db'
import { skills, waza, wazaVersioni } from '../src/db/schema'
import { resolveDefaultWazaCostCs } from '@domain/progression/waza-cost-exp'
import { parseWazaTierFromRank } from '@domain/combat/waza-rank'
import { getTierCsCost, isWazaTier } from '@domain/combat/tier'

/** Vecchi CS di tabella (pre-riforma). */
const LEGACY_CS_BY_TIER: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 7,
}

const force = process.argv.includes('--force')

async function main() {
  const skillRows = await db.query.skills.findMany({
    where: eq(skills.type, 'WAZA'),
    columns: {
      id: true,
      poolId: true,
      name: true,
      rank: true,
      isPassive: true,
    },
  })

  let updated = 0
  let skippedCustom = 0
  let skippedNoAuthoring = 0

  for (const skill of skillRows) {
    const nextCs = resolveDefaultWazaCostCs({
      isPassive: skill.isPassive ?? false,
      rank: skill.rank,
    })

    const authoring = await db.query.waza.findFirst({
      where: eq(waza.legacyId, skill.id),
      columns: { id: true },
    })
    if (!authoring) {
      skippedNoAuthoring += 1
      continue
    }

    const versione = await db.query.wazaVersioni.findFirst({
      where: eq(wazaVersioni.wazaId, authoring.id),
      orderBy: (v, { desc }) => [desc(v.numero)],
      columns: { id: true, cs: true },
    })
    if (!versione) {
      skippedNoAuthoring += 1
      continue
    }

    const current = versione.cs ?? 0
    if (current === nextCs) continue

    if (!force) {
      const tier = skill.isPassive
        ? null
        : parseWazaTierFromRank(skill.rank) ??
          (skill.rank && isWazaTier(Number(skill.rank.replace(/^T/i, '')))
            ? (Number(skill.rank.replace(/^T/i, '')) as 1 | 2 | 3 | 4 | 5)
            : null)
      const legacy =
        skill.isPassive || tier == null ? 0 : (LEGACY_CS_BY_TIER[tier] ?? getTierCsCost(tier))
      const looksLikeDefault = current === legacy || (current === 0 && !skill.isPassive)
      if (!looksLikeDefault) {
        skippedCustom += 1
        console.log(
          `· skip custom ${skill.poolId ?? skill.name}: CS ${current} (default sarebbe ${nextCs})`,
        )
        continue
      }
    }

    await db.update(wazaVersioni).set({ cs: nextCs }).where(eq(wazaVersioni.id, versione.id))
    updated += 1
    console.log(`✓ ${skill.poolId ?? skill.name}: ${current} → ${nextCs}`)
  }

  console.log(
    `\nAggiornate: ${updated} · override lasciati: ${skippedCustom} · senza authoring: ${skippedNoAuthoring}${
      force ? ' · (--force)' : ''
    }`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
