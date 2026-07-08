import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { config } from "dotenv";
import { resolve } from "path";
import { SignJWT } from "jose";
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../plugins/db";
import { users, characters, waza } from "../../db/schema";
import { JWT_SECRET } from "../../config";
import { wazaAdminRoutes } from "./waza-admin.routes";
import { deleteAdminWazaRecords } from "./waza-admin.service";

config({ path: resolve(import.meta.dir, "../../../../../.env") });

const app = new Elysia().use(wazaAdminRoutes);

let authToken = "";
let fixerToken = "";
let shinigamiToken = "";
const createdWazaIds: string[] = [];
const seededUserIds: string[] = [];

async function signFor(id: string, role: string) {
  return new SignJWT({ id, sub: id, role })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(JWT_SECRET));
}

/** Crea un utente PLAYER + personaggio con il pixel-icon staff indicato. */
async function seedStaffUser(roleIcon: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [user] = await db
    .insert(users)
    .values({
      email: `test-${roleIcon}-${suffix}@waza.test`,
      passwordHash: "x",
      role: "PLAYER",
    })
    .returning({ id: users.id });
  seededUserIds.push(user.id);
  await db.insert(characters).values({
    userId: user.id,
    name: `Test ${roleIcon}`,
    uiMetadata: { roleIcon },
  });
  return signFor(user.id, "PLAYER");
}

const validEffetti = [
  {
    tipo: "DANNO",
    trigger: "AL_LANCIO",
    bersaglio: "BERSAGLIO_SINGOLO",
    durata: { tipo: "ISTANTANEA" },
    valore: { tipo: "TIER" },
  },
];

const validCreateBody = {
  categoria: "do" as const,
  genitore: "Tōka-dō",
  tipo: "attiva" as const,
  tier: 2,
  nomeRomaji: "Hōshutsu",
  nomeItaliano: "Rilascio della Fiamma",
  descrizione: "Prova narrativa.",
  cs: 2,
  tempoQuarti: 1,
  tags: ["Energetica"],
  effetti: validEffetti,
};

async function apiAs(token: string, method: string, path: string, body?: unknown) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body != null ? JSON.stringify(body) : undefined,
    }),
  );
}

async function api(method: string, path: string, body?: unknown) {
  return apiAs(authToken, method, path, body);
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

beforeAll(async () => {
  const admin = await db.query.users.findFirst({
    where: eq(users.role, "ADMIN"),
    columns: { id: true },
  });
  if (!admin) {
    throw new Error("Serve almeno un utente ADMIN nel database per i test delle rotte waza.");
  }

  authToken = await signFor(admin.id, "ADMIN");
  fixerToken = await seedStaffUser("fixer");
  shinigamiToken = await seedStaffUser("shinigami");
});

afterAll(async () => {
  await deleteAdminWazaRecords(createdWazaIds);
  for (const id of seededUserIds) {
    await db.delete(characters).where(eq(characters.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
});

describe("rotte /admin/waza", () => {
  it("salvataggio bozza con effetti validi → 200 e derivate corrette", async () => {
    const createRes = await api("POST", "/admin/waza", validCreateBody);
    expect(createRes.status).toBe(200);
    const created = await readJson<{
      waza: { id: string };
      versione: { numero: number; atomiUsati: string[]; statoCodifica: string };
    }>(createRes);
    createdWazaIds.push(created.waza.id);

    const saveRes = await api("PUT", `/admin/waza/${created.waza.id}/versioni/1`, {
      ...validCreateBody,
      effetti: [
        ...validEffetti,
        {
          tipo: "MANUALE",
          testo: "Il Tōrō può disintegrarsi.",
        },
      ],
    });
    expect(saveRes.status).toBe(200);
    const saved = await readJson<{
      versione: { atomiUsati: string[]; statoCodifica: string };
    }>(saveRes);
    expect(saved.versione.atomiUsati).toEqual(["DANNO", "MANUALE"]);
    expect(saved.versione.statoCodifica).toBe("ibrida");
  });

  it("effetti non conformi → 422 con errori Ajv", async () => {
    const createRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Test 422",
      nomeItaliano: "Test 422",
    });
    const created = await readJson<{ waza: { id: string } }>(createRes);
    createdWazaIds.push(created.waza.id);

    const saveRes = await api("PUT", `/admin/waza/${created.waza.id}/versioni/1`, {
      ...validCreateBody,
      effetti: [
        {
          tipo: "DANNO",
          trigger: "AL_LANCIO",
          durata: { tipo: "ISTANTANEA" },
          valore: { tipo: "TIER" },
        },
      ],
    });

    expect(saveRes.status).toBe(422);
    const body = await readJson<{ error: string; errori: unknown[] }>(saveRes);
    expect(body.error).toContain("schema");
    expect(Array.isArray(body.errori)).toBe(true);
    expect(body.errori.length).toBeGreaterThan(0);
  });

  it("PUT su versione validata → 409", async () => {
    const createRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Test 409",
      nomeItaliano: "Test 409",
    });
    const created = await readJson<{ waza: { id: string } }>(createRes);
    createdWazaIds.push(created.waza.id);

    const validaRes = await api("POST", `/admin/waza/${created.waza.id}/versioni/1/valida`);
    expect(validaRes.status).toBe(200);
    const validata = await readJson<{ versione: { stato: string } }>(validaRes);
    expect(validata.versione.stato).toBe("validata");

    const saveRes = await api("PUT", `/admin/waza/${created.waza.id}/versioni/1`, validCreateBody);
    expect(saveRes.status).toBe(409);
  });

  it("generica con genitore → 422", async () => {
    const createRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Generica Con Genitore",
      nomeItaliano: "Generica Con Genitore",
      categoria: "generica",
      genitore: "Tōka-dō",
      effetti: [{ tipo: "MANUALE", testo: "Solo master." }],
    });
    expect(createRes.status).toBe(422);
    const body = await readJson<{ error: string }>(createRes);
    expect(body.error).toContain("genitore");
  });

  it("sei Vie (do) senza genitore → 422", async () => {
    const createRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Do Senza Genitore",
      nomeItaliano: "Sei Vie Senza Genitore",
      categoria: "do",
      genitore: null,
    });
    expect(createRes.status).toBe(422);
    const body = await readJson<{ error: string }>(createRes);
    expect(body.error.toLowerCase()).toContain("genitore");
  });

  it("genitore non valido → 422", async () => {
    const createRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Genitore Invalido",
      nomeItaliano: "Genitore Invalido",
      genitore: "Via-Inesistente",
    });
    expect(createRes.status).toBe(422);
  });

  it("filtro per categoria e genitore (sei Vie) ritorna solo le waza giuste", async () => {
    const tokadoRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Filtro Tokado",
      nomeItaliano: "Filtro Tōka-dō",
      categoria: "do",
      genitore: "Tōka-dō",
    });
    const wazaTokado = await readJson<{ waza: { id: string } }>(tokadoRes);
    createdWazaIds.push(wazaTokado.waza.id);

    const genericaRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Filtro Generica",
      nomeItaliano: "Filtro Generica",
      categoria: "generica",
      genitore: null,
      effetti: [{ tipo: "MANUALE", testo: "Solo master." }],
    });
    const wazaGenerica = await readJson<{ waza: { id: string } }>(genericaRes);
    createdWazaIds.push(wazaGenerica.waza.id);

    const listRes = await api(
      "GET",
      `/admin/waza?categoria=do&genitore=${encodeURIComponent("Tōka-dō")}&archiviata=all`,
    );
    expect(listRes.status).toBe(200);
    const list = await readJson<{
      items: Array<{ id: string; categoria: string; genitore: string | null }>;
    }>(listRes);
    const ids = list.items.map((item) => item.id);
    expect(ids).toContain(wazaTokado.waza.id);
    expect(ids).not.toContain(wazaGenerica.waza.id);
    expect(
      list.items.every((item) => item.categoria === "do" && item.genitore === "Tōka-dō"),
    ).toBe(true);
  });

  it("filtro categoria=madosho ritorna solo Madoshō", async () => {
    const madoshoRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Filtro Gokaon",
      nomeItaliano: "Filtro Gōkaon",
      categoria: "madosho",
      genitore: "Gōkaon",
      effetti: [{ tipo: "MANUALE", testo: "Effetto Madoshō." }],
    });
    const wazaMadosho = await readJson<{ waza: { id: string } }>(madoshoRes);
    createdWazaIds.push(wazaMadosho.waza.id);

    const seiVieRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Filtro Naikan",
      nomeItaliano: "Filtro Naikan-dō",
      categoria: "do",
      genitore: "Naikan-dō",
    });
    const wazaSeiVie = await readJson<{ waza: { id: string } }>(seiVieRes);
    createdWazaIds.push(wazaSeiVie.waza.id);

    const listRes = await api("GET", "/admin/waza?categoria=madosho&archiviata=all");
    expect(listRes.status).toBe(200);
    const list = await readJson<{
      items: Array<{ id: string; categoria: string; genitore: string | null }>;
    }>(listRes);
    const ids = list.items.map((item) => item.id);
    expect(ids).toContain(wazaMadosho.waza.id);
    expect(ids).not.toContain(wazaSeiVie.waza.id);
    expect(list.items.every((item) => item.categoria === "madosho")).toBe(true);
  });

  it("filtro per atomo ritorna solo le waza giuste", async () => {
    const dannoRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Filtro Danno",
      nomeItaliano: "Filtro Danno",
      effetti: validEffetti,
    });
    const danno = await readJson<{ waza: { id: string } }>(dannoRes);
    createdWazaIds.push(danno.waza.id);

    const manualeRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Filtro Manuale",
      nomeItaliano: "Filtro Manuale",
      effetti: [{ tipo: "MANUALE", testo: "Solo master." }],
    });
    const manuale = await readJson<{ waza: { id: string } }>(manualeRes);
    createdWazaIds.push(manuale.waza.id);

    const listRes = await api("GET", "/admin/waza?atomo=DANNO&archiviata=all");
    expect(listRes.status).toBe(200);
    const list = await readJson<{ items: Array<{ id: string; atomiUsati: string[] }> }>(listRes);
    const ids = list.items.map((item) => item.id);
    expect(ids).toContain(danno.waza.id);
    expect(ids).not.toContain(manuale.waza.id);
    expect(list.items.every((item) => item.atomiUsati.includes("DANNO"))).toBe(true);
  });

  it("duplica genera slug non in collisione", async () => {
    const createRes = await api("POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Duplica",
      nomeItaliano: "Duplica Origine",
    });
    const created = await readJson<{ waza: { id: string; slug: string } }>(createRes);
    createdWazaIds.push(created.waza.id);

    const dup1Res = await api("POST", `/admin/waza/${created.waza.id}/duplica`);
    expect(dup1Res.status).toBe(200);
    const dup1 = await readJson<{ waza: { id: string; slug: string } }>(dup1Res);
    createdWazaIds.push(dup1.waza.id);
    expect(dup1.waza.slug).not.toBe(created.waza.slug);

    const dup2Res = await api("POST", `/admin/waza/${created.waza.id}/duplica`);
    expect(dup2Res.status).toBe(200);
    const dup2 = await readJson<{ waza: { id: string; slug: string } }>(dup2Res);
    createdWazaIds.push(dup2.waza.id);

    const slugs = [created.waza.slug, dup1.waza.slug, dup2.waza.slug];
    expect(new Set(slugs).size).toBe(3);

    const existing = await db.select({ slug: waza.slug }).from(waza);
    const slugSet = new Set(existing.map((row) => row.slug));
    for (const slug of slugs) {
      expect(slugSet.has(slug)).toBe(true);
    }
  });
});

describe("permessi ruoli /admin/waza", () => {
  it("un Fixer crea e salva una bozza con successo", async () => {
    const createRes = await apiAs(fixerToken, "POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Fixer Bozza",
      nomeItaliano: "Bozza del Fixer",
    });
    expect(createRes.status).toBe(200);
    const created = await readJson<{ waza: { id: string } }>(createRes);
    createdWazaIds.push(created.waza.id);

    const saveRes = await apiAs(fixerToken, "PUT", `/admin/waza/${created.waza.id}/versioni/1`, {
      ...validCreateBody,
      nomeRomaji: "Kaji Fixer Bozza",
      nomeItaliano: "Bozza del Fixer (agg.)",
    });
    expect(saveRes.status).toBe(200);
  });

  it("uno Shinigami riceve 403 su GET e POST", async () => {
    const getRes = await apiAs(shinigamiToken, "GET", "/admin/waza?archiviata=all");
    expect(getRes.status).toBe(403);

    const postRes = await apiAs(shinigamiToken, "POST", "/admin/waza", {
      ...validCreateBody,
      nomeRomaji: "Kaji Shinigami Vietato",
      nomeItaliano: "Vietato allo Shinigami",
    });
    expect(postRes.status).toBe(403);
  });
});
