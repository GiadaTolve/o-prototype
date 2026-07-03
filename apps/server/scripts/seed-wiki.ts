import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

type SeedSection = {
  title: string;
  content: string;
  imageUrl?: string;
  children?: SeedSection[];
};

const GUIDA_SEED: SeedSection[] = [
  {
    title: "Introduzione",
    content: "",
    children: [
      {
        title: "Cos'è Oyasumi",
        content:
          "Oyasumi è un gioco di ruolo Dark Fantasy moderno. Il mondo è coerente ma non punitivo: la narrativa viene prima, ma le regole hanno conseguenze reali e matematiche.\n\nQui trovi le regole essenziali per giocare: statistiche, combattimento, progressione e sistemi di gioco.",
      },
      {
        title: "Come giocare",
        content:
          "Il gioco si svolge principalmente in chat, con il Master che arbitra le scene. Crea il tuo personaggio, esplora le zone della mappa, interagisci con gli altri giocatori e partecipa alle sessioni guidate dagli Shinigami.\n\nConsulta le sezioni di questa guida per approfondire ogni aspetto meccanico.",
      },
    ],
  },
  {
    title: "Statistiche",
    content: "",
    children: [
      {
        title: "Attributi primari",
        content:
          "Ogni Analista possiede cinque attributi:\n\n• Forza [F] — potenza bruta\n• Costituzione [C] — resistenza ai danni\n• Destrezza [D] — rapidità e precisione\n• Mente [M] — capacità di analisi\n• Empatia [E] — affinità mistica e Jigoka\n\nQuesti valori definiscono le capacità base del personaggio.",
      },
      {
        title: "Statistiche derivate",
        content:
          "Dal quadro momentaneo si calcolano:\n\n• Body (HP) — resistenza fisica\n• Reflexes — capacità di reazione (iniziativa)\n• Velocità — rapidità di spostamento\n• Jigoka — riserva spirituale per le Waza\n\nLe formule dipendono dalle percentuali definite nel manuale ufficiale.",
      },
    ],
  },
  {
    title: "Combattimento",
    content: "",
    children: [
      {
        title: "Chrono Stack",
        content:
          "Il Chrono Stack (CS) si accumula durante il combattimento: +3 per turno, +1 al difensore per ogni colpo subito. La capacità massima è 20.\n\nOltre il limite si entra in Overheat (−2 HP per turno per ogni stack in eccesso). Dopo 3 turni in Overheat scatta il Defaticamento (−50% stack).",
      },
      {
        title: "Waza",
        content:
          "Le Waza sono le tecniche speciali degli Analisti. Ogni Waza costa Chrono Stack e Jigoka. Il combattimento avviene in chat: il Master arbitra, i dadi si tirano solo su sua richiesta.\n\nConsulta il pannello Waza nella scheda personaggio per le tecniche apprese.",
      },
    ],
  },
];

const AMBIENTAZIONE_SEED: SeedSection[] = [
  {
    title: "Il Mondo",
    content: "",
    children: [
      {
        title: "Filosofia",
        content:
          "Oyasumi è un Dark Fantasy moderno: un mondo dove la storia viene prima, ma le regole non si piegano arbitrariamente. È narrativo, con conseguenze reali, coerente senza essere punitivo.\n\nGli Analisti esplorano un'ambientazione che mescola elementi giapponesi e occidentali in un'atmosfera cupa e misteriosa.",
      },
      {
        title: "Geografia",
        content:
          "Il mondo è organizzato in prefetture e zone esplorabili dalla mappa di gioco: Ogon, Izayoi, Onimori, Ezochi e le terre oltre.\n\nOgni zona offre chat dedicate, eventi e opportunità narrative. Esplora la mappa dal dashboard per scoprire i luoghi disponibili.",
      },
    ],
  },
  {
    title: "Fazioni e Ordini",
    content: "",
    children: [
      {
        title: "Mugen-tai",
        content:
          "Uno dei due grandi ordini degli Analisti. I membri del Mugen-tai seguono una filosofia e un percorso di progressione propri, con Waza e stili distintivi legati al loro ordine.",
      },
      {
        title: "Chisen-tai",
        content:
          "L'ordine complementare al Mugen-tai. Anche i membri del Chisen-tai possiedono tradizioni, tecniche e gerarchie proprie, con un'identità narrativa e meccanica ben definita.",
      },
    ],
  },
  {
    title: "Società",
    content: "",
    children: [
      {
        title: "Gradi e carriera",
        content:
          "Gli Analisti progrediscono attraverso gradi gerarchici che riflettono esperienza e riconoscimento nel mondo di gioco. Il grado iniziale è Nemuribito; la progressione si accompagna a nuove opportunità narrative e meccaniche.",
      },
      {
        title: "Economia",
        content:
          "La valuta principale è il REM, guadagnato con il lavoro quotidiano e le attività di gioco. L'esperienza (Exp) permette di sbloccare skill e Waza nell'albero Skiru.",
      },
    ],
  },
];

async function seedKind(
  client: Awaited<ReturnType<typeof pool.connect>>,
  kind: "guida" | "ambientazione",
  sections: SeedSection[],
) {
  const existing = await client.query(
    `SELECT COUNT(*)::int AS count FROM wiki_sections WHERE kind = $1`,
    [kind],
  );
  if (existing.rows[0].count > 0) {
    console.log(`⏭️  ${kind}: già popolato, skip.`);
    return;
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const h1 = await client.query(
      `INSERT INTO wiki_sections (kind, parent_id, level, title, content, image_url, "order")
       VALUES ($1, NULL, 1, $2, $3, $4, $5)
       RETURNING id`,
      [kind, section.title, section.content, section.imageUrl ?? null, i],
    );
    const parentId = h1.rows[0].id;

    for (let j = 0; j < (section.children ?? []).length; j++) {
      const child = section.children![j];
      await client.query(
        `INSERT INTO wiki_sections (kind, parent_id, level, title, content, image_url, "order")
         VALUES ($1, $2, 2, $3, $4, $5, $6)`,
        [kind, parentId, child.title, child.content, child.imageUrl ?? null, j],
      );
    }
  }
  console.log(`✅ ${kind}: contenuto iniziale inserito.`);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await seedKind(client, "guida", GUIDA_SEED);
    await seedKind(client, "ambientazione", AMBIENTAZIONE_SEED);
    await client.query("COMMIT");
    console.log("✅ Seed wiki completato!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Errore:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
