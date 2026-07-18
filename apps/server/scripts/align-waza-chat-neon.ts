/**
 * Allinea Neon: catalogo tag chat + tabella skills + waza.legacy_id.
 *
 * Prerequisiti:
 *   - Codice aggiornato (wazaPool, generate-waza-tag-catalog) già in repo
 *   - NEON_DATABASE_URL in .env (root repo)
 *
 * Uso (da apps/server):
 *   bun run align-waza-chat-neon
 *
 * Passi:
 *   1. generate-waza-tag-catalog.ts (repo, no DB)
 *   2. sync-waza-manual.ts → upsert skills da wazaPool
 *   3. fix-waza-chat-catalog-sync.ts → legacy_id + Rasui nome
 *   4. Verifica conteggi su Neon
 *
 * Non pubblica waza né modifica effetti — solo allineamento nomi/pool/chat.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { spawnSync } from "child_process";

config({ path: resolve(import.meta.dir, "../../../.env") });

function sanitizeNeonUrl(raw: string): string {
  const url = new URL(raw.replace(/^postgres(ql)?:/, "http:"));
  if (url.hostname.includes("-pooler")) {
    url.searchParams.delete("options");
  }
  return url.toString().replace(/^http:/, raw.startsWith("postgresql:") ? "postgresql:" : "postgres:");
}

function requireNeonDatabaseUrl(): string {
  const neonUrl = process.env.NEON_DATABASE_URL?.trim();
  if (!neonUrl) {
    console.error("\n❌ NEON_DATABASE_URL mancante in .env (root repo).\n");
    process.exit(1);
  }
  if (neonUrl.includes("localhost") || neonUrl.includes("127.0.0.1")) {
    console.error("\n❌ NEON_DATABASE_URL punta a localhost.\n");
    process.exit(1);
  }
  return sanitizeNeonUrl(neonUrl);
}

function runStep(label: string, script: string) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("bun", ["run", script], {
    cwd: resolve(import.meta.dir, ".."),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      ALLOW_NEON_WAZA_ALIGN: "1",
    },
  });
  if (result.status !== 0) {
    throw new Error(`${script} fallito (exit ${result.status})`);
  }
}

async function verifyNeon() {
  const postgres = (await import("postgres")).default;
  const { WAZA_TAG_CATALOG } = await import("@domain/combat/waza-tag-catalog.generated");
  const sql = postgres(process.env.DATABASE_URL!);

  const skills = await sql`
    SELECT COUNT(*)::int AS n FROM skills WHERE type = 'WAZA' AND pool_id IS NOT NULL
  `;
  const linked = await sql`
    SELECT COUNT(*)::int AS n
    FROM waza w
    JOIN skills s ON s.id = w.legacy_id
    WHERE w.archiviata = false
  `;
  const mismatches = await sql`
    SELECT wv.nome_romaji, wv.nome_italiano, s.name AS skill_name, s.pool_id
    FROM waza w
    JOIN waza_versioni wv ON wv.waza_id = w.id
      AND wv.numero = (SELECT MAX(numero) FROM waza_versioni wv2 WHERE wv2.waza_id = w.id)
    JOIN skills s ON s.id = w.legacy_id
    WHERE w.archiviata = false
      AND wv.stato_codifica IN ('automatica','ibrida','manuale')
      AND s.name <> (
        wv.nome_romaji || CASE WHEN wv.kanji IS NOT NULL AND wv.kanji <> '' THEN ' (' || wv.kanji || ')' ELSE '' END
        || ' — ' || wv.nome_italiano
      )
    LIMIT 10
  `;

  console.log("\n── Verifica Neon ──");
  console.log(`  Catalogo tag (repo):     ${WAZA_TAG_CATALOG.length} voci`);
  console.log(`  skills WAZA con pool_id: ${skills[0].n}`);
  console.log(`  waza attive con legacy:  ${linked[0].n}`);
  if (mismatches.length) {
    console.log(`  ⚠ Nomi skill ≠ authoring (${mismatches.length} campione):`);
    for (const r of mismatches) {
      console.log(`    · ${r.nome_romaji}: skill «${r.skill_name}»`);
    }
  } else {
    console.log("  ✓ Nomi skill allineati alle versioni authoring (campione)");
  }

  await sql.end();
}

async function main() {
  const neonUrl = requireNeonDatabaseUrl();
  const host = (() => {
    try {
      return new URL(neonUrl.replace(/^postgres(ql)?:/, "http:")).host;
    } catch {
      return "(neon)";
    }
  })();

  console.log("══════════════════════════════════════════════");
  console.log("  Allinea waza chat su Neon");
  console.log(`  Host: ${host}`);
  console.log("══════════════════════════════════════════════");

  process.env.DATABASE_URL = neonUrl;
  process.env.ALLOW_NEON_WAZA_ALIGN = "1";

  runStep("1/3 Catalogo tag da wazaPool", "scripts/generate-waza-tag-catalog.ts");
  runStep("2/3 Sync skills da wazaPool", "scripts/sync-waza-manual.ts");
  runStep("3/3 Legacy_id + Rasui", "scripts/fix-waza-chat-catalog-sync.ts");

  await verifyNeon();

  console.log("\n✓ Allineamento Neon completato.\n");
}

main().catch((err) => {
  console.error("\n❌", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
});
