# OYASUMI_PRERELEASE Inventory

Snapshot di riferimento della cartella legacy:
`/Users/giadagiulianatolve/Documents/OYASUMI_PRERELEASE`

Data inventario: 2026-07-09

## Dimensione totale

- `OYASUMI_PRERELEASE`: ~295 MB

## Struttura principale

- `gdr-frontend/` (React + Vite legacy)
  - `public/` ~169 MB
  - `node_modules/` ~85 MB
  - `src/` ~604 KB
  - `package.json` con stack Vite/React
  - `README.md` template standard Vite (nessuna doc progetto specifica)
- `gdr-oyasumi-node/` (backend legacy Node/Express)
  - `node_modules/` ~39 MB
  - DB locale sqlite:
    - `gdr.db` ~136 KB
    - `gdr.db-wal` ~1.0 MB
    - `gdr.db-shm` ~32 KB
  - `server.js`, `authMiddleware.js`, `migrate.js`
  - `.env` locale legacy
- `node_modules/` root + lockfile/package root minimi

## Cosa è stato preservato qui

- Inventario e metriche principali (questo file).
- Nessun file codice o database è stato copiato nel monorepo attivo.

## Note operative

- Se serve recuperare asset legacy, priorità su:
  - `gdr-frontend/public/`
  - eventuali script in `gdr-oyasumi-node/server.js` e `migrate.js`
- La cartella può essere eliminata per recuperare spazio **solo se** non serve più consultare:
  - DB sqlite legacy (`gdr.db*`)
  - `.env` legacy
  - asset in `gdr-frontend/public/`
