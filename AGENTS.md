# Oyasumi — guida agenti (desktop, cloud, iPhone)

Monorepo RPG **Oyasumi 2.0**: `apps/server` (Elysia/Bun), `apps/client` (Next.js), `packages/domain` (regole di gioco).

## Documenti di riferimento

| Argomento | File |
|-----------|------|
| Contesto prodotto | `OYASUMI_CONTEXT.md` |
| Combattimento in chat | `COMBAT_SPEC.md`, `CHRONO_STACK.md`, `WAZA_CALCOLI.md` |
| Economia oggetti (drop · inventario · mercato) | `ECONOMY_ITEMS_SPEC.md`, `ITEMS_IMPLEMENTATION_SPEC.md` |
| Sōkaiju | `Oyasumi_Sokaiju_Spec_Cursor.md` |
| Roadmap | `MECHANICS_ROADMAP.md`, `ROADMAP_CONTEXT.md` |
| UI Dark Arcane | `.cursor/rules/design-dark-arcane.mdc` |
| Combattimento (regole fisse) | `.cursor/rules/combat-system.mdc` |

## Struttura

- `packages/domain/src/combat/` — motore combattimento, waza, status, Sōkaiju
- `packages/domain/src/economy/` — drop, junklist, smantellamento, mercato
- `packages/domain/src/skiru/` — albero Skiru, progressione
- `apps/server/src/modules/characters/` — automazione waza in chat, HP, status
- `apps/server/src/modules/drop/` — drop chat e loot a terra
- `apps/server/src/modules/artigiano/` — smantellamento (gate Shokunin)
- `apps/server/src/modules/market/` — Banco NPC + Piazza PG
- `apps/client/src/components/dashboard/chat-combat/` — pannello combattimento e lancio waza

## Setup locale (Mac)

```bash
bun install && cd apps/server && bun install && cd ../client && bun install
cp .env.example .env   # DATABASE_URL, JWT_SECRET
cd apps/server && bun run db:push
```

Avvio: `bun run dev` (API :4000 + client :3000).

## Test senza database

Per verificare il dominio dopo modifiche meccaniche:

```bash
bash scripts/cloud-agent-verify.sh
```

Oppure: `bunx vitest run packages/domain/src/combat/*.test.ts`

Economia oggetti (senza DB):

```bash
bunx vitest run packages/domain/src/economy/*.test.ts
```

## Cursor Cloud specific instructions

Ambiente definito in `.cursor/environment.json`. Prima di modifiche ampie:

```bash
bash scripts/cloud-agent-install.sh
bash scripts/cloud-agent-verify.sh
```

**Segreti** (dashboard Cursor → Cloud Agents → Secrets, non nel repo):

- `DATABASE_URL` — solo se serve testare API con DB
- `JWT_SECRET` — per script server

Senza DB, lavora su `packages/domain` e UI client; non eseguire `db:push` in cloud senza `DATABASE_URL`.

**Branch:** preferisci branch dedicati (`feature/...`) e PR verso `main`.

## Lavorare da iPhone (Cursor iOS)

Tre modalità (stesso account Cursor su Mac e iPhone):

### A) My Machines — codice sul Mac (consigliato per questo repo)

Molto lavoro è ancora **solo locale** (non tutto su GitHub). Il Mac esegue file e terminal; l'iPhone guida l'agente.

1. Sul Mac, una tantum:
   ```bash
   bash scripts/mobile-worker.sh
   ```
   (oppure `bun run mobile:worker` dalla root)
2. Completa `cursor agent login` se richiesto (stesso account dell'app).
3. Tieni il terminale aperto (Mac sveglio / non in stop).
4. Su **iPhone → Cursor**: nuovo agente → scegli worker **Giada-Mac-o-prototype** (o il nome host).
5. Descrivi il task (es. «continua pannello waza in chat»).

### B) Remote Control — sessione già aperta sul Mac

1. Desktop: apri questo progetto e avvia un agente.
2. Nella chat agente: `/remote-control`
3. iPhone: continua la stessa sessione dall'app.

### C) Cloud Agent — repo su GitHub

Repo: `https://github.com/giadagiulianatolve/o-prototype`

1. Push del branch su cui vuoi lavorare.
2. iPhone → nuovo agente → repo `o-prototype` → branch.
3. Al ritorno al Mac: `git pull`.

Configura l'environment su [cursor.com/dashboard](https://cursor.com/dashboard) collegando GitHub; `.cursor/environment.json` viene letto dal repo.

## Convenzioni codice

- Palette UI: solo variabili CSS in `globals.css` (Dark Arcane).
- Combattimento: sempre in chat, non schermata dedicata; Master arbitra.
- Diff minimi; non refactor non richiesti.
- Non committare `.env` né segreti.
