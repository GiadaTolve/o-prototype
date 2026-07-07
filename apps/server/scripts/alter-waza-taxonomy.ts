/**
 * Migrazione incrementale: waza.ramo → categoria + genitore.
 * Da eseguire DOPO add-waza-authoring-tables (prima migrazione già applicata).
 *
 * Esegui da apps/server:
 *   bun run alter-waza-taxonomy
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";
import {
  GENITORI_DO,
  GENITORI_MADOSHO,
} from "../src/modules/waza/waza-taxonomy";

config({ path: resolve(import.meta.dir, "../../../.env") });

const sql = postgres(process.env.DATABASE_URL!);

const SEI_VIE_BY_SLUG: Record<string, string> = {
  toka: "Tōka-dō",
  "toka-do": "Tōka-dō",
  "tōka-dō": "Tōka-dō",
  genzai: "Genzai-dō",
  "genzai-do": "Genzai-dō",
  "genzai-dō": "Genzai-dō",
  ito: "Itō-dō",
  "ito-do": "Itō-dō",
  "itō-dō": "Itō-dō",
  naikan: "Naikan-dō",
  "naikan-do": "Naikan-dō",
  "naikan-dō": "Naikan-dō",
  hensei: "Hensei-dō",
  "hensei-do": "Hensei-dō",
  "hensei-dō": "Hensei-dō",
  hado: "Hadō-dō",
  "hado-do": "Hadō-dō",
  "hadō-dō": "Hadō-dō",
};

const MADOSHO_BY_SLUG: Record<string, string> = {
  "ringai-janjae": "Rin'gai/Janjae",
  gokaon: "Gōkaon",
  nakigara: "Nakigara",
  hataori: "Hataori",
  ikiryo: "Ikiryō",
  ikiryō: "Ikiryō",
};

function inferFromLegacyRamo(
  ramo: string,
): { categoria: "generica" | "do" | "madosho"; genitore: string | null } {
  const trimmed = ramo.trim();
  if (!trimmed || trimmed.toLowerCase() === "generiche" || trimmed.toLowerCase() === "generica") {
    return { categoria: "generica", genitore: null };
  }
  if ((GENITORI_DO as readonly string[]).includes(trimmed)) {
    return { categoria: "do", genitore: trimmed };
  }
  if ((GENITORI_MADOSHO as readonly string[]).includes(trimmed)) {
    return { categoria: "madosho", genitore: trimmed };
  }
  const key = trimmed.toLowerCase();
  if (SEI_VIE_BY_SLUG[key]) return { categoria: "do", genitore: SEI_VIE_BY_SLUG[key] };
  if (MADOSHO_BY_SLUG[key]) return { categoria: "madosho", genitore: MADOSHO_BY_SLUG[key] };
  if (trimmed.toLowerCase().endsWith("-dō") || trimmed.toLowerCase().endsWith("-do")) {
    return { categoria: "do", genitore: trimmed };
  }
  return { categoria: "generica", genitore: null };
}

try {
  await sql.begin(async (tx) => {
    await tx`ALTER TABLE waza ADD COLUMN IF NOT EXISTS categoria TEXT`;
    await tx`ALTER TABLE waza ADD COLUMN IF NOT EXISTS genitore TEXT`;

    const hasRamo = await tx<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'waza' AND column_name = 'ramo'
      ) AS exists
    `;

    if (hasRamo[0]?.exists) {
      const rows = await tx<{ id: string; ramo: string }[]>`SELECT id, ramo FROM waza`;
      for (const row of rows) {
        const mapped = inferFromLegacyRamo(row.ramo);
        await tx`
          UPDATE waza
          SET categoria = ${mapped.categoria}, genitore = ${mapped.genitore}
          WHERE id = ${row.id}
        `;
      }
      await tx`ALTER TABLE waza DROP COLUMN ramo`;
      await tx`DROP INDEX IF EXISTS idx_waza_ramo`;
    }

    await tx`
      UPDATE waza
      SET categoria = 'generica', genitore = NULL
      WHERE categoria IS NULL
    `;

    await tx`ALTER TABLE waza ALTER COLUMN categoria SET NOT NULL`;

    await tx`ALTER TABLE waza DROP CONSTRAINT IF EXISTS waza_categoria_check`;
    await tx`
      ALTER TABLE waza
      ADD CONSTRAINT waza_categoria_check
      CHECK (categoria IN ('generica', 'do', 'madosho'))
    `;

    await tx`ALTER TABLE waza DROP CONSTRAINT IF EXISTS waza_genitore_check`;
    await tx`
      ALTER TABLE waza
      ADD CONSTRAINT waza_genitore_check
      CHECK (
        (categoria = 'generica' AND genitore IS NULL)
        OR (categoria != 'generica' AND genitore IS NOT NULL)
      )
    `;

    await tx`CREATE INDEX IF NOT EXISTS idx_waza_categoria ON waza(categoria)`;
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_genitore ON waza(genitore)`;

    for (const valore of GENITORI_DO) {
      await tx`
        INSERT INTO vocabolari (categoria, valore, attivo)
        VALUES ('genitore_do', ${valore}, TRUE)
        ON CONFLICT (categoria, valore) DO UPDATE SET attivo = TRUE
      `;
    }

    for (const valore of GENITORI_MADOSHO) {
      await tx`
        INSERT INTO vocabolari (categoria, valore, attivo)
        VALUES ('genitore_madosho', ${valore}, TRUE)
        ON CONFLICT (categoria, valore) DO UPDATE SET attivo = TRUE
      `;
    }
  });

  console.log("✓ alter-waza-taxonomy: categoria/genitore pronti, vocabolari genitori seedati.");
} finally {
  await sql.end();
}
