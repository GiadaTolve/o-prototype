import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { userCanManageWaza, userCanPublishWaza } from "../../lib/waza-access";
import {
  archiveAdminWaza,
  createAdminWaza,
  createAdminWazaDraftFromPublished,
  duplicateAdminWaza,
  getAdminWazaDetail,
  getAdminWazaVersione,
  listAdminWazaCatalog,
  listAdminWazaVocabolari,
  publishAdminWazaVersion,
  reopenAdminWazaVersion,
  restoreAdminWaza,
  runAdminWazaSandbox,
  saveAdminWazaDraft,
  validateAdminWazaVersion,
  WazaAdminHttpError,
} from "./waza-admin.service";
import {
  createWazaLabItem,
  createWazaLabTaxonomy,
  listWazaLabItems,
  listWazaLabTaxonomy,
  patchWazaLabItem,
} from "./waza-lab.service";
import { db } from "../../plugins/db";
import { characters } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * Gestione catalogo waza: Proprietario, Moderatore, Fixer (+ account ADMIN).
 * Shinigami / Capo Shinigami e account MASTER ricevono 403.
 */
async function canAccessWazaAdmin(user: { id: string; role?: string } | null): Promise<boolean> {
  if (!user) return false;
  return userCanManageWaza(user.id, user.role);
}

async function canPublishWazaAdmin(user: { id: string; role?: string } | null): Promise<boolean> {
  if (!user) return false;
  return userCanPublishWaza(user.id, user.role);
}

async function canAccessWazaLabOwner(user: { id: string; role?: string } | null): Promise<boolean> {
  if (!user) return false;
  const char = await db.query.characters.findFirst({
    where: eq(characters.userId, user.id),
    columns: { name: true, surname: true, uiMetadata: true },
  });
  if (!char) return false;
  const name = (char.name ?? "").trim().toLowerCase();
  const surname = (char.surname ?? "").trim().toLowerCase();
  const roleIcon = String(
    ((char.uiMetadata as { roleIcon?: string } | null)?.roleIcon ?? ""),
  ).toLowerCase();
  return name === "botan" && surname === "mizuhara" && roleIcon === "admin";
}

const versionBody = t.Object({
  nomeRomaji: t.String(),
  nomeItaliano: t.String(),
  kanji: t.Optional(t.Nullable(t.String())),
  kanjiVerificato: t.Optional(t.Boolean()),
  descrizione: t.String(),
  cs: t.Number(),
  tempoQuarti: t.Optional(t.Nullable(t.Number())),
  tags: t.Optional(t.Array(t.String())),
  skiruIr: t.Optional(t.Array(t.String())),
  scelteAlLancio: t.Optional(t.Array(t.Record(t.String(), t.Unknown()))),
  effetti: t.Optional(t.Array(t.Record(t.String(), t.Unknown()))),
});

const anagraficaBody = t.Object({
  categoria: t.Union([t.Literal("generica"), t.Literal("do"), t.Literal("madosho")]),
  genitore: t.Optional(t.Nullable(t.String())),
  tipo: t.Union([t.Literal("passiva"), t.Literal("attiva")]),
  tier: t.Optional(t.Nullable(t.Number())),
});

const createBody = t.Intersect([versionBody, anagraficaBody]);

const saveDraftBody = t.Intersect([
  versionBody,
  t.Object({
    categoria: t.Optional(t.Union([t.Literal("generica"), t.Literal("do"), t.Literal("madosho")])),
    genitore: t.Optional(t.Nullable(t.String())),
    tipo: t.Optional(t.Union([t.Literal("passiva"), t.Literal("attiva")])),
    tier: t.Optional(t.Nullable(t.Number())),
  }),
]);

function handleWazaAdminError(e: unknown, set: { status?: number | string }) {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    if (msg.includes("column") && msg.includes("does not exist")) {
      set.status = 503;
      return {
        error:
          "Database Waza non aggiornato. Esegui db:push in produzione (schema waza_versioni) e riprova.",
      };
    }
  }
  if (e instanceof WazaAdminHttpError) {
    set.status = e.status;
    return { error: e.message, ...(e.payload ?? {}) };
  }
  console.error("[admin/waza]", e);
  set.status = 500;
  return { error: "Errore interno del server." };
}

export const wazaAdminRoutes = new Elysia({ prefix: "/admin/waza" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get("/vocabolari", async ({ user, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          const items = await listAdminWazaVocabolari();
          return { items };
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .get("/lab", async ({ user, set }) => {
        if (!(await canAccessWazaLabOwner(user))) {
          set.status = 403;
          return { error: "Accesso riservato al Proprietario Botan." };
        }
        try {
          const items = await listWazaLabItems();
          return { items, count: items.length };
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .get("/lab/taxonomy", async ({ user, set }) => {
        if (!(await canAccessWazaLabOwner(user))) {
          set.status = 403;
          return { error: "Accesso riservato al Proprietario Botan." };
        }
        try {
          const items = await listWazaLabTaxonomy();
          return { items };
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .post(
        "/lab/taxonomy",
        async ({ user, body, set }) => {
          if (!(await canAccessWazaLabOwner(user))) {
            set.status = 403;
            return { error: "Accesso riservato al Proprietario Botan." };
          }
          try {
            const item = await createWazaLabTaxonomy(body);
            return { item };
          } catch (e) {
            return handleWazaAdminError(e, set);
          }
        },
        {
          body: t.Object({
            categoria: t.Union([
              t.Literal("genitore_do"),
              t.Literal("genitore_madosho"),
              t.Literal("lab_categoria_macro"),
              t.Literal("lab_categoria_micro"),
            ]),
            valore: t.String(),
          }),
        },
      )
      .post(
        "/lab/create",
        async ({ user, body, set }) => {
          if (!(await canAccessWazaLabOwner(user))) {
            set.status = 403;
            return { error: "Accesso riservato al Proprietario Botan." };
          }
          try {
            const item = await createWazaLabItem(body);
            return { item };
          } catch (e) {
            return handleWazaAdminError(e, set);
          }
        },
        {
          body: t.Object({
            poolId: t.Optional(t.String()),
            name: t.String(),
            family: t.Optional(
              t.Union([
                t.Literal("do"),
                t.Literal("madosho"),
                t.Literal("ordine"),
                t.Literal("generiche"),
                t.Literal("oni-no-mori"),
              ]),
            ),
            ordineSubgroup: t.Optional(t.Nullable(t.String())),
            description: t.Optional(t.Nullable(t.String())),
            effect: t.Optional(t.Nullable(t.String())),
            rank: t.Optional(t.Nullable(t.String())),
            isPassive: t.Optional(t.Boolean()),
            styleId: t.Optional(t.Nullable(t.String())),
            madoshoId: t.Optional(t.Nullable(t.String())),
            costExp: t.Optional(t.Number()),
            cs: t.Optional(t.Nullable(t.Number())),
          }),
        },
      )
      .patch(
        "/lab/:poolId",
        async ({ user, params, body, set }) => {
          if (!(await canAccessWazaLabOwner(user))) {
            set.status = 403;
            return { error: "Accesso riservato al Proprietario Botan." };
          }
          try {
            const item = await patchWazaLabItem(params.poolId, body);
            return { item };
          } catch (e) {
            if (e instanceof Error && e.message.includes("non trovata")) {
              set.status = 404;
              return { error: e.message };
            }
            return handleWazaAdminError(e, set);
          }
        },
        {
          params: t.Object({ poolId: t.String() }),
          body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.Nullable(t.String())),
            effect: t.Optional(t.Nullable(t.String())),
            rank: t.Optional(t.Nullable(t.String())),
            isPassive: t.Optional(t.Boolean()),
            styleId: t.Optional(t.Nullable(t.String())),
            madoshoId: t.Optional(t.Nullable(t.String())),
            costExp: t.Optional(t.Number()),
            cs: t.Optional(t.Number()),
            launchSkiruIds: t.Optional(t.Array(t.String())),
            damageSkiruIds: t.Optional(t.Array(t.String())),
            damageIndexKind: t.Optional(t.Nullable(t.Union([t.Literal("CAC"), t.Literal("CAD")]))),
          }),
        },
      )
      .get("/", async ({ user, query, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          const archiviata =
            query.archiviata === "true" || query.archiviata === "false" || query.archiviata === "all"
              ? query.archiviata
              : undefined;
          const items = await listAdminWazaCatalog({
            categoria:
              query.categoria === "generica" ||
              query.categoria === "do" ||
              query.categoria === "madosho"
                ? query.categoria
                : undefined,
            genitore: query.genitore,
            tipo: query.tipo,
            tier: query.tier != null ? Number(query.tier) : undefined,
            atomo: query.atomo,
            statoCodifica: query.stato_codifica,
            stato: query.stato,
            q: query.q,
            archiviata,
          });
          return { items };
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .get("/:id", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          return await getAdminWazaDetail(params.id);
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .get("/:id/versioni/:n", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          const numero = Number(params.n);
          if (!Number.isInteger(numero) || numero < 1) {
            set.status = 400;
            return { error: "Numero versione non valido." };
          }
          return await getAdminWazaVersione(params.id, numero);
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .post(
        "/",
        async ({ user, body, set }) => {
          if (!(await canAccessWazaAdmin(user))) {
            set.status = 403;
            return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
          }
          try {
            return await createAdminWaza(body, user!.id);
          } catch (e) {
            return handleWazaAdminError(e, set);
          }
        },
        { body: createBody },
      )
      .post("/:id/duplica", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          return await duplicateAdminWaza(params.id, user!.id);
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .put(
        "/:id/versioni/:n",
        async ({ user, params, body, set }) => {
          if (!(await canAccessWazaAdmin(user))) {
            set.status = 403;
            return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
          }
          try {
            const numero = Number(params.n);
            if (!Number.isInteger(numero) || numero < 1) {
              set.status = 400;
              return { error: "Numero versione non valido." };
            }
            return await saveAdminWazaDraft(params.id, numero, body, user!.id);
          } catch (e) {
            return handleWazaAdminError(e, set);
          }
        },
        {
          params: t.Object({ id: t.String(), n: t.String() }),
          body: saveDraftBody,
        },
      )
      .post("/:id/versioni/:n/valida", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          const numero = Number(params.n);
          if (!Number.isInteger(numero) || numero < 1) {
            set.status = 400;
            return { error: "Numero versione non valido." };
          }
          const result = await validateAdminWazaVersion(params.id, numero);
          if (result.errori.length > 0) {
            set.status = 422;
          }
          return result;
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .post("/:id/versioni/:n/riapri-bozza", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          const numero = Number(params.n);
          if (!Number.isInteger(numero) || numero < 1) {
            set.status = 400;
            return { error: "Numero versione non valido." };
          }
          return await reopenAdminWazaVersion(params.id, numero, user!.id);
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .post(
        "/:id/versioni/:n/pubblica",
        async ({ user, params, body, set }) => {
          if (!(await canPublishWazaAdmin(user))) {
            set.status = 403;
            return {
              error: "Pubblicazione riservata a Proprietario e Moderatore.",
            };
          }
          try {
            const numero = Number(params.n);
            if (!Number.isInteger(numero) || numero < 1) {
              set.status = 400;
              return { error: "Numero versione non valido." };
            }
            return await publishAdminWazaVersion(params.id, numero, body.changelog);
          } catch (e) {
            return handleWazaAdminError(e, set);
          }
        },
        {
          params: t.Object({ id: t.String(), n: t.String() }),
          body: t.Object({
            changelog: t.Optional(t.Nullable(t.String())),
          }),
        },
      )
      .post("/:id/versioni", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          return await createAdminWazaDraftFromPublished(params.id, user!.id);
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .post("/:id/archivia", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          return { waza: await archiveAdminWaza(params.id) };
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .post("/:id/ripristina", async ({ user, params, set }) => {
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403;
          return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
        }
        try {
          return { waza: await restoreAdminWaza(params.id) };
        } catch (e) {
          return handleWazaAdminError(e, set);
        }
      })
      .post(
        "/sandbox",
        async ({ user, body, set }) => {
          if (!(await canAccessWazaAdmin(user))) {
            set.status = 403;
            return { error: "Accesso riservato allo staff waza (Proprietario, Moderatore, Fixer)." };
          }
          try {
            return await runAdminWazaSandbox(body);
          } catch (e) {
            return handleWazaAdminError(e, set);
          }
        },
        {
          body: t.Object({
            effetti: t.Array(t.Record(t.String(), t.Unknown())),
            tier: t.Optional(t.Nullable(t.Number())),
            skiruIr: t.Optional(t.Array(t.String())),
            contesto: t.Object({
              lanciatore: t.Object({
                skiru: t.Record(t.String(), t.Number()),
                cs: t.Optional(t.Number()),
                hp: t.Optional(t.Number()),
                grado: t.Optional(t.String()),
                stato: t.Optional(t.Record(t.String(), t.Unknown())),
                skiruIrFisica: t.Optional(t.String()),
                skiruIrIncanalamento: t.Optional(t.String()),
              }),
              bersaglio: t.Object({
                hp: t.Number(),
                scudo: t.Optional(t.Number()),
                itami: t.Optional(t.Number()),
                skiru: t.Optional(t.Record(t.String(), t.Number())),
                status: t.Optional(t.Record(t.String(), t.Number())),
              }),
              opzioni: t.Optional(
                t.Object({
                  vinciConfrontoIndice: t.Optional(t.Boolean()),
                }),
              ),
            }),
          }),
        },
      ),
  );
