# Decisione di design — promozione Pressione (圧) a status

> **Stato:** **Opzione C (ibrido)** — status `pressione` nel dominio + condizioni `stack(pressione) >= N` nel catalogo Gōkaon.
> Guadagno/perdita eventi e reset fine scontro restano **MANUALE** finché non c’è `styles/gokaon/pressione.ts`.

## Perché è una decisione separata

Pressione non è un malus/buff come Macchiato o Emorragia: è un **contatore di stile** con regole proprie che oggi non combaciano con un `StatusDefinition` generico senza lavoro aggiuntivo:

| Regola manuale Gōkaon | Implicazione motore |
|----------------------|---------------------|
| **Tetto 12** (soglie 2 / 5 / 9 per Metamorfosi) | `maxStacks: 12` o cap dedicato + validazione guadagno |
| **Non decade in combattimento** | `decaysOnEndOfTurn: false` (come Macchiato) |
| **Si azzera a fine scontro** | Hook `fine_combattimento` — oggi assente nel motore status generico |
| Guadagno per **eventi** (danno subito/inflitto, CS spesi/recuperati, waza nemica entro 8 m, movimento, …) | Richiede motore reattivo, non solo condizione al lancio |
| Due sentieri (Natura Ferina / Cuore Affamato) con trigger diversi | `stato_personale.gokaon_sentiero` + regole ramificate |

Promuoverla a `StatusId: 'pressione'` senza queste regole rischia di farla comportare come Emorragia (DoT/decay) o come Macchiato (blockWaza).

## Opzioni

### A) Status `pressione` nel catalogo dominio (consigliata se si automatizza Gōkaon)

Aggiungere a `packages/domain/src/combat/status/catalog.ts`:

```ts
pressione: {
  id: 'pressione',
  tag: 'Pressione',
  label: 'Pressione',
  kind: 'atypical',
  description: 'Gōkaon (圧): contatore stile; max 12; non decade in combattimento; perso a fine combattimento.',
  defaultStacks: 1,
  maxStacks: 12,
  decaysOnEndOfTurn: false,
  modifiers: {},
},
```

Poi:
- Seed vocab: `bun run seed-vocabolari-status` (dopo patch dominio)
- Condizioni waza: `stack(pressione) >= 3`, `>= 5`, `>= 9`
- Motore: modulo `styles/gokaon/pressione.ts` (guadagni evento + reset fine scontro), analogo a `hado/atsuryoku.ts` o `ito/tensione.ts`
- Migrare catalogo Gōkaon: sostituire `STATO_PERSONALE` `pressione_stack` con status container / guadagni automatici

### B) Restare su `STATO_PERSONALE` + motore dedicato

Mantenere `chiave: "pressione_stack"` e non aggiungere `pressione` al vocab status finché il motore non espone quella chiave alle condizioni (`stato_personale.pressione_stack >= 3` — soggetto condizione **nuovo**, non `stack(status)`).

Pro: non tocca `StatusId` né il dropdown status.
Contro: condizioni waza diverse dal pattern `stack(...)` usato per Macchiato/Emorragia.

### C) Ibrido transitorio ✅ **implementato**

Status `pressione` in catalogo **solo** per condizioni al lancio (`stack(pressione) >= N`), guadagno/perdita ancora a nota Master finché non c’è il modulo eventi.

## Cosa è già codificabile

Con il seed status (19 status dominio, incluso `pressione`):

```
stack(macchiato) >= 2
stack(emorragia) >= 1
stack(metamorfosi) >= 1
stack(pressione) >= 1   // visivi passiva, fiuto 20 m
stack(pressione) >= 2   // Comunione (Oni no Mezame)
stack(pressione) >= 3   // scaling attive (Ago, Hōkō, Kotsudan)
stack(pressione) >= 5   // Simbiosi + scaling (Mōshin, Jiware)
stack(pressione) >= 9   // Rovina
```

## Checklist

- [x] Confermare tetto **12** e soglie **2 / 5 / 9** nel dominio (`maxStacks: 12`)
- [x] Stack **0** = assente (`getStatusStacks` → 0 se non in container; `applyStatus` min 1 — Master imposta stack a mano)
- [ ] Hook **fine combattimento** (API o tick combattimento)
- [x] Separare Pressione (contatore) da **Metamorfosi** (status applicato alle soglie)
- [ ] Modulo guadagno eventi per sentiero (Yasei vs Gashin)
- [x] Aggiornare `gokaon-catalog-data.ts` e rieseguire compile locale
- [x] Rieseguire `seed-vocabolari-status` dopo patch dominio

## File correlati

- `apps/server/scripts/seed-vocabolari-status.ts` — solo `STATUS_DEFINITIONS`, no extra
- `apps/server/scripts/gokaon-catalog-data.ts` — condizioni `stack(pressione)`; guadagno MANUALE
- `packages/domain/src/combat/status/catalog.ts` — definizione `pressione`
- `packages/domain/src/combat/status/engine.ts` — pattern eventi hardcoded (euforia, macchiato)
- `packages/domain/src/styles/hado/atsuryoku.ts` — esempio contatore stile con accumulate a fine turno

---

# Tensione (緊張) — Itō-dō · opzione C (ibrido) ✅ implementata

Come Pressione: status `tensione` in catalogo dominio (`maxStacks: 8`) per condizioni `stack(tensione) >= N`; guadagno per filo attivo, Cedimento (soglia 2 + Fudōshin, −2 CS) e overflow→Emorragia restano **MANUALE** / modulo `styles/ito/tensione.ts`.

- Catalogo: `apps/server/scripts/ito-catalog-data.ts` (19 waza)
- Compile: `bun run compile-ito-waza` (solo DB locale)
