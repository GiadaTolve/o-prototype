# Oyasumi Tester

Tester standalone per level-up, combattimento automatico e statistiche.

## Avvio

```bash
# Dalla root del progetto
bun run dev:tester

# Oppure da questa cartella
cd apps/tester && bun run dev
```

Si apre su **http://localhost:3002** (o porta successiva se occupata).

## Funzionalità

### Level Up Tester (tab "Level Up")
- **Input EXP totale**: inserisci EXP o usa +100 / +500 per simulare guadagni
- **Mostrina**: livello attuale, barra progresso verso il prossimo livello, punti stat disponibili
- **Banner Level Up**: mostra premi (Statistiche, Key, Gem), bottoni **Aumenta** (modifica statistiche) e **Salta** (nasconde banner, riproposto al login)
- **Tabella soglie**: scala livelli 1–50 (Exp Δ, Exp tot., fasi)
- **Gradi suggeriti**: Livelli Guida per Nemuribito, Hakyō, Bunsekikan, ecc.

### Combat Tester (tab "Combat Tester")
- **Simulazione automatica**: due build (A e B) si affrontano senza Master
- **Configurazione build**: statistiche (F,C,D,M,E), Grado, Livello skill, Bonus danno
- **Regole**: Iniziativa da Reflexes, +3 CS/turno, +1 CS colpo subito, Overheat (-1 PV/stack oltre 20)
- **Waza**: Pool Dō (attive con danno). AI sceglie la Waza con maggior danno utilizzabile

### Tecniche (tab "Tecniche")
- **Lista Waza**: tutte le tecniche da wazaPool, raggruppate per ramo (Dō, Manipolazione, Materializzazione, Emissione, Trasformazione, Supporto)
- **Filtro**: mostra tutti o solo un ramo
- **Click**: espande la descrizione completa di ogni tecnica

## Build

```bash
bun run build
```

Output in `dist/`. Puoi servire con `bun run preview` o qualsiasi server statico.
