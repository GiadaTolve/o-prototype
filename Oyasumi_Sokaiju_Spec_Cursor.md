# OYASUMI — Spec d'implementazione: Sōkaiju + Lancio Waza in Chat

> Documento per Cursor. Descrive (1) l'organizzazione dell'appendice Sōkaiju, (2) il ruolo Meiju/Shiju per categoria, (3) il lancio waza in chat, (4) cosa il motore calcola/applica **da solo**.
> Convenzione: rank **0–5** per volto (Vita/Morte) su ogni ancoraggio; coefficiente **+1,5% per punto**.

---

## 0. Appendice Skiru — organizzazione

Il **Sōkaiju** è un'**appendice di Skiru a sé stante** (tab dedicata in scheda, ramo `sokaiju` nel dominio Jin). Non si mescola con Tōsō, Binshō, ecc.

| Regola | Dettaglio |
|--------|-----------|
| **Tenkan** | Unica Skiru **accademica** — non si alza di livello con EXP. Apre il Terzo Occhio; in chat `[tenkan]` gestisce accumulo CS / Overheat. |
| **Altri 10 ancoraggi** | Restano **legati a una categoria waza** (come oggi: Kongen → `[Costrutto]`, Gojū → `[Proiettile]`, …). |
| **Doppio volto** | Ogni ancoraggio ha **Meiju (Vita)** e **Shiju (Morte)** con effetti meccanici distinti sulla **stessa categoria**. |
| **Vita (Meiju)** | Ogni punto assegnato → **+1,5% IR** al lancio delle waza della categoria collegata. |
| **Morte (Shiju)** | Ogni punto assegnato → **+1,5% Danno** delle waza della categoria collegata. |

**Esempio Kongen** (`[Costrutto]`):

- **Vita** (Sorgente / Kongen): ogni punto → +1,5% IR sul lancio waza `[Costrutto]`.
- **Morte** (Corno di guerra / Senkaku): ogni punto → +1,5% Danno sulle waza `[Costrutto]`.

**Scheda punti (fase transizione):** finché non c'è UI a due barre, il rank legacy sul nodo (`kongen: 3`) vale per **entrambi** i volti. Chiavi future: `kongen:meiju`, `kongen:shiju`.

**Implementazione domain:** `packages/domain/src/skiru/sokaiju-face-effects.ts` — `calculateSokaijuMeijuIrMultiplier`, `calculateSokaijuShijuDamagePercentBonus`.

**Mappa categoria ↔ ancoraggio:** invariata (`sokaiju-categoria.test.ts`).

---

## 1. Ruolo di ogni nodo Sōkaiju (legacy + migrazione)

Legenda stato:
- **WIRED** = già a motore.
- **PARZIALE** = helper/formula in domain; non tutti i percorsi chat collegati.
- **DA IMPLEMENTARE** = ruolo definito qui, da scrivere.
- Tutti i nodi sono **passivi e automatici**: si applicano da soli, NON si dichiarano a ogni lancio.

| id | Nodo (Meiju) | Ruolo | Formula / regola | Stato | `drivesDerived` |
|----|--------------|-------|------------------|-------|-----------------|
| `tenkan` | Corona | Accumulo CS / Overheat | +3 CS/turno con Corona aperta e azione ≥500 caratteri. Overheat >20 stack → −2 HP/stack a fine turno; 3 turni → Defaticamento. | WIRED | `chronoStack` |
| `goju` | Comprensione | Elementi + status | 5 affinità, max 1 attiva (non-EXP, narrativa). **Auto-apply**: waza `[Elementale]` + `[hit:1]` + affinità attiva → status elementale (durata + Shōdō/Fudoshin). | WIRED | `elementalStatus` |
| `jikai` | Misericordia | Cure & potenziamenti | Le cure e i buff che applichi valgono `+jikai` (al valore di cura o al bonus del buff). | WIRED (`applySokaijuSupportValue` su cure chat) | `supportPower` |
| `gojin` | Giustizia | Counter / ritorsione | I contrattacchi e le risposte reattive fanno `+gojin` danno. (Il *floor* di danno resta su Kongen; qui solo la ritorsione.) | WIRED (`damage-pipeline` + `isReactiveCounter`) | `counterBonus` |
| `kashin` | Bellezza | Iniziativa (tie-break IR) | A parità di IR, agisce/risolve prima chi ha `kashin` più alto. Se ancora pari → priorità `[Energetiche]` → poi all'attaccante. | WIRED (`resolution.ts`) | `initiativeTiebreak` |
| `shodo` | Vittoria | Durata effetti | Gli effetti a tempo che applichi (status, buff, costrutti) durano `+floor(shodo/2)` turni. | WIRED (status generiche + Gojū chat) | `effectDuration` |
| `eiga` | Gloria | Status emotivi | Gli status emotivi che applichi (Paura, Ira, ecc.) hanno `+floor(eiga/2)` stack. | WIRED (status generiche chat) | `emotionalPower` |
| `kongen` | Fondamento | **DANNO (mole di Jigo-Ka)** | Floor di danno su OGNI waza: `+round(kongen × 1.5)`. | WIRED (`damage-pipeline`, lancio chat `[hit:1]`) | `damageFloor` |
| `hikan` | Anello Segreto | Sorpresa | Se il bersaglio non poteva percepire il colpo (fuori vista / prima azione non dichiarata) **e** `hikan > chokaku_bersaglio` → l'attacco ignora la schivata reattiva. | WIRED (`[sorpresa:1]` + `checkHikanSurpriseBypass` su `[hit:1]`) | `surprise` |
| `genkai` | Regno | Resistenza costrutti | `Res = (genkai + tier_waza) × moltiplicatore_taglia`. | WIRED | `constructResistance` |
| `chiko` | Saggezza | Costrutti: numero/complessità | Costrutti attivi max = `1 + chiko`. Taglia massima dichiarabile sale di 1 ogni 2 rank. | WIRED (cap numero + taglia max in evocazione) | `maxConstructs` |

> **Facce Shiju (Morte)** — fase 2, non ora: ogni nodo ha una faccia oscura (es. `tenkan`→Overheat già attivo; `kongen`→Senkaku "guscio di guerra" = burst quando sei ferito/aggressore). Implementare solo dopo che le facce Meiju girano.

---

## 2. Lancio di una waza in chat

**Principio:** il giocatore dichiara **con quale Skiru di competenza** incanala la waza (non i nodi Sōkaiju, che sono automatici). La Skiru scelta è una scelta tattica: cambia velocità/precisione (IR) e porta un piccolo bonus tematico (rider).

### Sintassi
Comando esplicito:
```
/waza <waza_id> --skiru <skiru_id> [--cs <n>] [--target <nome>] [--origine <costrutto_id>]
```
oppure linguaggio naturale (futuro), parsato:
```
"Lancio Hōsha con Seimitsu, 2 CS, contro Aoi."
```

**Pannello chat** (`WazaLaunchPanel` in `ChatCombatPanel`): selezione waza, Skiru incanalamento, CS, bersaglio, narrato; opzione **Colpo a segno** → `[hit:1]`.

**Tag generati:** `[waza:…] [tier:N] [cs:N] [ir:N] [skiru:id] [target:…] [generiche:colpito:…] [hit:1]`

**Stato implementazione (luglio 2026):**
- [x] Pannello UI + anteprima danno (tier + Kongen + rider)
- [x] `/waza` slash command (espanso all'invio)
- [x] Spesa CS da `[cs:N]` · rider Skiru su danno (`waza-skiru-riders.ts`)
- [x] Danno automatico con `[hit:1]` + bersaglio (`waza_launch_damage` server)
- [x] IR dichiarato = `(skiru + complementare) / 2`
- [x] Confronto IR automatico attaccante vs difensore prima del danno (`[hit:1]` + indicativo difesa)
- [x] Parser linguaggio naturale — `parseNaturalWazaLaunchLine` + `expandWazaLaunchInMessage`
- [x] Rider Seimitsu su evasione — `resolveCombatConfrontationBetween` (−2 IR difensore se `[skiru:seimitsu]` nell'attacco)
- [x] Tenkan accademico — richiesta staff (`TENKAN` in Scheda Richieste → `grantSokaijuTenkan` su approvazione)

### Rider della Skiru dichiarata
La Skiru scelta aggiunge un piccolo effetto (tabella base, ampliabile):

| Skiru dichiarata | Rider |
|---|---|
| `bakuryoku` / `goatsu` (Potenza/Pressione) | +2 danno |
| `seimitsu` (Precisione) | riduce l'evasione del bersaglio |
| `shintai_kokan` (Inc. Arti) | +2 danno se la waza è `[Contatto]` |
| `fudoshin` (Fermezza) | +1 turno di durata se è controllo/status |
| `chokaku` / `kansatsu` (Percezione/Osservazione) | ignora finte/esche del bersaglio |

Il GM può vietare un abbinamento assurdo. In assenza di veto, la scelta è libera.

---

## 3. Cosa dichiara il giocatore vs cosa fa il motore

**DICHIARA il giocatore (input in chat):**
- quale waza, quale **Skiru** di incanalamento, quanti CS, il target;
- (opz.) da quale costrutto-origine parte (Tōka), quale affinità elementale è attiva (setup narrativo).

**AUTOMATICO (il motore calcola/applica da solo):**
- **IR** = `(skiru_dichiarata + incanalazione) / 2`; tie-break con `kashin`.
- **Danno** = `tier + round(kongen × 1.5) + rider_skiru (+ gojin se reattivo)`, poi `− mitigazione% (itami)`.
- **Status elementale** (`goju`): auto-apply su waza `[Elementale]` con affinità attiva.
- **Status emotivi** (`eiga`): stack extra.
- **Durata** (`shodo`): estende gli effetti a tempo.
- **Cure/buff** (`jikai`): valore potenziato.
- **Costrutti**: resistenza (`genkai`), numero/taglia max (`chiko`).
- **CS**: accumulo/Overheat (`tenkan`).
- **Sorpresa** (`hikan`): bypass della schivata su check contestato.

> Regola generale: se un nodo/effetto **non** richiede una scelta del giocatore, il motore lo applica **da solo**. Il giocatore dichiara solo *intento + Skiru + target + CS*.

---

## 4. Ordine di risoluzione (pipeline motore)

Per ogni lancio:
1. **Parse** chat → `{waza, skiru, cs, target, origine}`.
2. **Valida**: CS disponibili, waza posseduta, abbinamento Skiru lecito (veto GM opz.).
3. **IR** = `(skiru + incanalazione)/2`. Ordina le azioni dello scambio per IR; parità → `kashin` → `[Energetiche]` → attaccante.
4. **Colpisce?** attaccante IR ≥ IR della reazione difensiva. Eccezione: `hikan` (sorpresa) bypassa la schivata reattiva se il check passa.
5. **Danno** = `tier + round(kongen×1.5) + rider (+ gojin se reattivo)` → applica `− mitigazione% (itami)`.
6. **Applica effetti**: status elementale (`goju`), status emotivi +stack (`eiga`), durata +turni (`shodo`), cure/buff +valore (`jikai`).
7. **Aggiorna stato**: HP, CS, stack Tenkan/Overheat, costrutti sul campo (`genkai` res, `chiko` cap).

---

## 5. File coinvolti (riferimento)
- `progression.ts` — `GOJU_ELEMENTAL_SKIRU_IDS`, `expPurchasable:false` per le affinità; gate Tenkan accademico.
- `constructs.ts`, `field-constructs.ts` — resistenza costrutti (`genkai`); cap numero (`chiko` via `canPlaceFieldConstruct`).
- `chrono-stack.ts`, `combat-chrono.ts`, `tenkan-chat.ts` — CS/Overheat (`tenkan`).
- `damage-pipeline.ts`, `waza-skiru-riders.ts` — Kongen floor, Gōjin counter, rider Skiru, mitigazione.
- `waza-launch.ts`, `waza-tag-preview.ts` — build/parse tag lancio chat.
- `waza-chat-automation.ts` — CS, status, Gojū, danno `[hit:1]`.
- `sokaiju-combat.ts`, `resolution.ts` — Kashin tie-break, hook durata/stack.
- `apps/client/.../chat-combat/WazaLaunchPanel.tsx` — pannello lancio.
- Parser chat: `/waza --skiru` + NL «Lancio … con …» (`expandWazaLaunchInMessage`).

### Valori chiave (già decisi)
- Kongen: coefficiente **×1,5** (floor +0…+7,5, arrotondato).
- Tier lookup: T1=4 · T2=8 · T3=12 · T4=17 · T5=23.
- Rank di ogni nodo: 0–5.
