# Sistema Combattimento — Oyasumi 2.0 (v3)

> **Stato:** Spec allineata al manuale (`docs/Oyasumi_Manuale_Completo.pdf`, Giugno 2026)
> **Breaking vs legacy:** rimossi Reflexes (iniziativa), Jigoka come costo waza obbligatorio. Overheat aggiornato a −2 HP/stack, max 3 turni.
> **Riferimenti:** [CHRONO_STACK.md](./CHRONO_STACK.md), [MECHANICS_ROADMAP.md](./MECHANICS_ROADMAP.md)

---

## 1. Dove e come avviene il combattimento

| Aspetto | Decisione |
|---------|-----------|
| **Sede** | In **chat** — nessuna schermata dedicata |
| **Supervisione** | Combattimento libero senza Master è possibile; i combattimenti **validi** richiedono un **Master/Shinigami** che supervisiona e dà feedback sui risultati |
| **Struttura** | **A turni, 4/4** (i giocatori gestiscono i quarti in autonomia in chat) |
| **Arbitraggio** | Il Master decide l'esito delle azioni tramite **IR** (Indice di Riuscita) |

---

## 2. Iniziativa e ordine dei turni

- L'iniziativa è gestita **narrativamente dal Master** (o concordata fra i giocatori in PvP libero).
- In caso di ordine simultaneo si usa l'**Indice di Riuscita (IR)** come priorità: chi ha IR più alto agisce prima (vedi §2.3 del manuale).
- **Non esiste più la statistica Reflexes** — era un artefatto del sistema legacy F/C/D/M/E.

---

## 3. Chrono Stack (CS)

Vedi **[CHRONO_STACK.md](./CHRONO_STACK.md)** per i dettagli. Sintesi:

| Parametro | Valore |
|-----------|--------|
| Stack a turno | +3 |
| Stack per colpo subito (con successo) | +1 (al difensore) |
| Capacità naturale | 20 |
| Danno Overheat | **−2 PV** per ogni stack oltre 20, per turno |
| Max turni Overheat | **3 turni** → poi Defaticamento (−50% stack) |

### Overheat
- **Capacità naturale:** 20 CS (il corpo sopporta senza ripercussioni).
- **Oltre 20:** si entra in **Overheating**.
- **Penalità:** ogni stack oltre 20 → **−2 PV per turno** finché non si scaricano.
- **Dopo 3 turni in Overheat:** scatta il **Defaticamento** (−50% stack, oppure salta il turno).

### Limiti waza per turno (per costo CS)

| Costo CS della waza | Max waza concesse nel turno |
|---------------------|------------------------------|
| 1–2 cs | Nessun limite extra (tempo narrato) |
| 3 cs | 3 |
| 5 cs | 2 |
| 10 cs | 2 |
| 20 cs | 1 |

> Regola costo misto: vale il limite del **CS più alto** usato nel turno.

---

## 4. Costo Waza

Le **Waza** costano **CS** (Chrono Stack):

- **CS:** costo dichiarato sulla waza (tier 1 = 1 cs, tier 2 = 2 cs, tier 3 = 3 cs, tier 4 = 5 cs, tier 5 = 7 cs — vedi §2.10 manuale).
- **Jigo-Ka:** risorsa separata legata al personaggio (lore: «Ego»). Non è un costo automatico sulle waza standard — il suo utilizzo è narrato dal PG e arbitrato dal Master.

> **Nota legacy:** la versione precedente richiedeva sia CS sia Jigoka per ogni waza. Il sistema v3 usa **solo CS** come costo meccanico. Jigo-Ka resta una risorsa narrativa/lore.

---

## 5. Tiri di dado

| Aspetto | Decisione |
|---------|-----------|
| **Uso** | **Solo su richiesta** del Master — non sono parte standard del flusso v3 |
| **Chi tira** | Il **giocatore** (il Master può richiederlo all'occorrenza) |
| **Dove** | In chat o strumento esterno, a discrezione del Master |
| **Integrazione** | Eventuali formule `dice_formula` nelle waza (es. `1d20 + $IR`) sono risolte dal giocatore quando richiesto |

> Il dado **non è una meccanica core** in v3. La **Descrizione comanda**: un'azione ben descritta vale più di un tiro favorevole.

---

## 6. Flusso tipico (Quest / PvP)

1. Il Master annuncia l'inizio del combattimento e l'ordine di turno.
2. Ogni turno: **+3 CS** al giocatore attivo.
3. Colpo subito con successo: **+1 CS** al difensore.
4. Il giocatore dichiara le proprie azioni nei **4/4** disponibili (quarti gestiti in autonomia).
5. Usa Waza dichiarando il costo CS con `[cs:X]`; il Master valuta l'IR dei due contendenti (`calculateSuccessIndex`).
6. Il Master arbitra l'esito (IR più alto vince; parità → meno quarti spesi → stallo se ancora pari).
7. Si prosegue a turni alternati fino alla fine del combattimento.

---

## 7. Integrazione nel software

- **Chat:** il combattimento avviene nei messaggi; nessuna UI dedicata obbligatoria.
- **Tag in chat:** `[waza:Nome]` (tecnica), `[cs:X]` (Chrono Stack usate) — formattati automaticamente.
- **Helper chat:** pulsante **Waza** (dropdown con tecniche apprese) inserisce `[waza:Nome]`; link **Tester** apre il simulatore per calcoli IR/tier.
- **Validazione automatica:** il sistema offre *suggerimenti* (costi CS, IR calcolato) ma il **Master arbitra** l'esito finale.
- **Dadi:** fuori dal flusso automatico — solo su richiesta esplicita del Master.
- **Deprecato:** `[dado:…]` non è più una meccanica core (vedi `DICE_SPEC.md` → da deprecare).

---

## 8. Riferimenti incrociati

| Documento | Contenuto |
|-----------|-----------|
| [CHRONO_STACK.md](./CHRONO_STACK.md) | Accumulo CS, Overheat (−2 HP, max 3 turni), Defaticamento, limiti mosse |
| [MECHANICS_ROADMAP.md](./MECHANICS_ROADMAP.md) | Checklist implementazione §2.2–§2.10 |
| `packages/domain/src/combat/` | Motore CS, IR, tier, pipeline danno |
| `apps/tester/` | Simulatore combat v3 (IR + tier + CS) |
