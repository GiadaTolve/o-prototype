# Waza & Stats Tester

Tester standalone per provare le waza, le formule dadi e i calcoli delle statistiche.

## Avvio

```bash
# Dalla root del progetto
bun run dev:tester

# Oppure da questa cartella
cd apps/tester && bun run dev
```

Si apre su **http://localhost:3002** (o porta successiva se occupata).

## Funzionalità

- **Statistiche base**: modifica F, C, D, M, E e il moltiplicatore Y (Tier)
- **Statistiche derivate**: calcolo in tempo reale (HP, Kotodama, Riflessi, Velocità, danni CAC/CAD, ecc.) usando le formule di `@domain/stats/calculator`
- **Formule dadi**: inserisci formule tipo `1d20 + $M`, `2d6 + $F` e lancia. Usa `$F`, `$C`, `$D`, `$M`, `$E` per le statistiche.

## Build

```bash
bun run build
```

Output in `dist/`. Puoi servire con `bun run preview` o qualsiasi server statico.
