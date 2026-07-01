# Tiri di Dado — Oyasumi 2.0

> **Riferimenti:** [COMBAT_SPEC.md](./COMBAT_SPEC.md) §5, [OYASUMI_CONTEXT.md](./OYASUMI_CONTEXT.md) (shadowban)

## 1. Uso

| Aspetto | Decisione |
|---------|-----------|
| **Quando** | Solo su **richiesta del Master** — non parte standard del flusso |
| **Chi tira** | Il **giocatore** (Master può richiedere un tiro) |
| **Dove** | In **chat** tramite sintassi dedicata |

## 2. Sintassi

- `[dado:1d20]` — tiro semplice, risultato 1–20
- `[dado:2d6]` — somma di 2d6
- `[dado:1d100]` — percentuale
- `[dado:1d20+M]` — tiro + bonus Mente (M dal personaggio)
- `[dado:1d20+D]` — tiro + bonus Destrezza

**Risoluzione:** Al momento dell’invio, i tag vengono risolti (client o server), il risultato viene mostrato in chat a tutti.

## 3. Visibilità

- **Broadcast:** Tutti in room vedono il tiro e il risultato
- **Shadowban:** I tiri di utenti shadowbannati **non vengono broadcast** (come i messaggi chat)

## 4. Integrazione Waza

Le formule `dice_formula` nelle skill (es. `1d20 + $M`) sono risolte dal giocatore quando il Master richiede il tiro. La sintassi `[dado:...]` può includere modificatori da statistiche.
