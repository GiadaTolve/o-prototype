// apps/server/scripts/seed-social-blueprints.ts
// Sync SOCIAL_BLUEPRINTS (domain) → tabella social_blueprints.
// Uso: cd apps/server && bun run scripts/seed-social-blueprints.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { SOCIAL_BLUEPRINTS } from '@domain/shakai-kaikyu/blueprint-catalog'
import { socialBlueprintOutputCatalogKey } from '@domain/shakai-kaikyu/craft'
import * as schema from '../src/db/schema'

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function main() {
  console.log('Sync blueprint Shakai Kaikyū → social_blueprints...')
  let upserted = 0

  for (const bp of SOCIAL_BLUEPRINTS) {
    const outputCatalogKey = socialBlueprintOutputCatalogKey(bp)
    const values = {
      id: bp.id,
      tag: bp.tag,
      classId: bp.classId,
      requiredSubclassId: bp.requiredSubclassId,
      kind: bp.kind,
      name: bp.name,
      description: bp.description,
      materials: bp.materials ? [...bp.materials] : null,
      gatherUnits: bp.gatherUnits ?? null,
      dailyBudgetCost: bp.dailyBudgetCost ?? null,
      weightOrPower: bp.weightOrPower ?? null,
      gatherRequires: bp.gatherRequires ? [...bp.gatherRequires] : null,
      isProcedure: bp.isProcedure === true || bp.kind === 'procedure',
      pathConstraint: bp.pathConstraint ?? null,
      exclusiveSubclassIds: bp.exclusiveSubclassIds ? [...bp.exclusiveSubclassIds] : null,
      outputCatalogKey,
      isActive: true,
      updatedAt: new Date(),
    }

    const existing = await db.query.socialBlueprints.findFirst({
      where: eq(schema.socialBlueprints.id, bp.id),
    })

    if (existing) {
      await db.update(schema.socialBlueprints).set(values).where(eq(schema.socialBlueprints.id, bp.id))
    } else {
      await db.insert(schema.socialBlueprints).values(values)
    }
    upserted += 1
  }

  console.log(`OK — ${upserted} blueprint sincronizzati.`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
