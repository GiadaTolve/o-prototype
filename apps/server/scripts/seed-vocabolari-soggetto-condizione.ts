/**
 * Popola vocabolari (categoria `soggetto_condizione`) — soggetti del menu "Solo se".
 *
 * Oggi l'editor legge ancora condizione-constants.ts (hardcoded); questo seed allinea
 * il DB alla spec Oyasumi_Spec_Pannello_Waza.md per uso futuro.
 *
 * **Non** include soggetti stile-specifici (Pressione, Macchiato, Emorragia):
 * quelli si coprono con il soggetto generico `stack(status)` + vocabolario `status`.
 *
 * Esegui da apps/server (idempotente):
 *   bun run seed-vocabolari-soggetto-condizione
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../../.env") });

type SoggettoCondizioneRow = {
  valore: string;
  extra: {
    label: string;
    tipo: "bool" | "enum" | "number";
    /** Per stack(status): nome status scelto dal vocab status */
    richiede_status?: boolean;
    operatori: readonly string[];
    valori?: readonly string[];
  };
};

const SOGGETTI: SoggettoCondizioneRow[] = [
  {
    valore: "toro.batteria",
    extra: {
      label: "Tōrō — Batteria",
      tipo: "bool",
      operatori: ["=="],
      valori: ["true", "false"],
    },
  },
  {
    valore: "toro.lanciata",
    extra: {
      label: "Lanciata dal Tōrō",
      tipo: "bool",
      operatori: ["=="],
      valori: ["true", "false"],
    },
  },
  {
    valore: "stack(status)",
    extra: {
      label: "Stack di uno status",
      tipo: "number",
      richiede_status: true,
      operatori: ["==", "!=", ">=", "<=", ">", "<"],
      valori: ["0", "1", "2", "3", "5", "6", "9", "10"],
    },
  },
  {
    valore: "grado_pg",
    extra: {
      label: "Grado del PG",
      tipo: "enum",
      operatori: ["==", "!="],
      valori: [
        "Nemuribito",
        "Hakyō",
        "Bunsekikan",
        "Sentatsu Bunsekikan",
        "Kanteikan",
        "Shin'enkan",
        "Akumu Zankyō",
      ],
    },
  },
  {
    valore: "cs_correnti",
    extra: {
      label: "CS correnti",
      tipo: "number",
      operatori: ["==", "!=", ">=", "<=", ">", "<"],
      valori: ["0", "1", "2", "3", "5", "10", "12", "15", "20"],
    },
  },
  {
    valore: "hp_pct",
    extra: {
      label: "HP residui (%)",
      tipo: "number",
      operatori: ["==", "!=", ">=", "<=", ">", "<"],
      valori: ["0", "25", "50", "75", "100"],
    },
  },
];

const sql = postgres(process.env.DATABASE_URL!);

try {
  await sql.begin(async (tx) => {
    for (const row of SOGGETTI) {
      await tx`
        INSERT INTO vocabolari (categoria, valore, extra, attivo)
        VALUES ('soggetto_condizione', ${row.valore}, ${tx.json(row.extra)}, TRUE)
        ON CONFLICT (categoria, valore) DO UPDATE
        SET extra = COALESCE(vocabolari.extra, '{}'::jsonb) || EXCLUDED.extra,
            attivo = TRUE
      `;
    }
  });
  console.log(`✓ Vocabolario soggetto_condizione: ${SOGGETTI.length} soggetti generici.`);
  console.log("  Stili Gōkaon/Rin'gai/Nakigara: usare stack(status) + slug status (pressione, macchiato, emorragia).");
} finally {
  await sql.end();
}
