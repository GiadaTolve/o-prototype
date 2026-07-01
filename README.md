# Oyasumi 2.0 — Prototipo

Monorepo **Oyasumi** (Dark Fantasy RPG): backend Elysia + frontend Next.js.

## Requisiti

- [Bun](https://bun.sh)
- [PostgreSQL](https://www.postgresql.org) (es. locale su `localhost:5432`)
- Database `oyasumi_2` creato

## Setup

1. **Clona e installa dipendenze**
   ```bash
   bun install
   cd apps/server && bun install
   cd ../client && bun install
   ```

2. **Environment**
   - Copia `.env.example` in `.env` alla root del progetto.
   - Imposta `DATABASE_URL` (e opzionalmente `JWT_SECRET`, `PORT`).

3. **Database**
   ```bash
   cd apps/server && bun run db:push
   ```
   Se `db:push` fallisce con *column "strength" cannot be cast automatically to type integer*, esegui prima:
   ```bash
   cd apps/server && bun run fix-stats-column-types
   ```
   poi di nuovo `bun run db:push`.

   Dopo aver applicato lo schema (tabelle `grades`, `levels`, `fetches`, ecc.):
   ```bash
   cd apps/server && bun run seed-grades-levels
   cd apps/server && bun run seed-meteo
   ```
   Popola Gradi (Analisti) e Livelli (1–50) da `QUEST_AND_FETCH_SPEC` §7, e meteo prefetture (valori mock iniziali).

   Per le **notifiche di sistema** (es. responso Fetch): la tabella `system_notifications` è definita nello schema Drizzle. Se il DB è stato creato prima dell’aggiunta, esegui `bun run scripts/add-system-notifications.ts` da `apps/server` per crearla.

## Avvio

- **API (porta 4000)**  
  Dalla root: `bun run dev:server`  
  Oppure: `cd apps/server && bun run dev`

- **Client Next.js (porta 3000)**  
  Dalla root: `bun run dev:client`  
  Oppure: `cd apps/client && bun run dev`

Apri [http://localhost:3000](http://localhost:3000) per il frontend.  
L’API è su [http://localhost:4000](http://localhost:4000) (es. `/health`, `/auth/login`, `/auth/register`, `/characters/me`).

### `curl http://localhost:4000/health` non risponde / "Server non raggiungibile"

- **Il server deve essere avviato.** Se non hai mai eseguito `bun run dev:server`, nessuno ascolta sulla 4000 → `curl` resta in attesa.
- **Porta 4000 occupata:** se avvii il server e vedi `EADDRINUSE` o `port 4000 in use`, ci sono istanze vecchie in esecuzione.

**Soluzione:**

1. **Libera la porta 4000** (dalla root del progetto):
   ```bash
   bun run kill:4000
   ```
2. **Avvia il server** in un terminale e tienilo aperto:
   ```bash
   bun run dev:server
   ```
   Oppure in un colpo solo: `bun run start:server` (esegue `kill:4000` e poi `dev:server`).

3. **In un altro terminale** verifica:
   ```bash
   curl http://localhost:4000/health
   ```
   Risposta attesa: `{"status":"ok","service":"oyasumi-2.0"}`.

4. **Avvia il client** (altro terminale):
   ```bash
   bun run dev:client
   ```

Sulla pagina di login (`/auth`) puoi usare **"Verifica server"** per controllare che l’API sia raggiungibile.

## Struttura

- `apps/server` — API Elysia, Drizzle, PostgreSQL
- `apps/client` — Next.js, React
- `packages/domain` — logica di dominio (formule, tipi)
