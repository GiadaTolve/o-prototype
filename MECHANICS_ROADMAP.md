# Roadmap Meccaniche — Oyasumi_Manuale_Completo.pdf

> **Fonte di verità:** `docs/Oyasumi_Manuale_Completo.pdf` (manuale completo regole · meccaniche · ambientazione)  
> **Ultimo allineamento:** Giugno 2026  
> **Uso:** checklist capitolo per capitolo; spunta `[x]` man mano che implementi o allinei.

---

## Legenda stati

| Simbolo | Significato |
|---------|-------------|
| `[ ]` | Da fare |
| `[~]` | Parziale / implementato ma **non allineato** al manuale nuovo |
| `[x]` | Allineato al manuale (codice + spec) |
| `📄` | Solo contenuto nel manuale (nessun codice richiesto ancora) |
| `⚠️` | **Breaking change** rispetto al prototipo attuale |
| `🔮` | Citato nel manuale ma capitolo **non ancora scritto** nel doc |

### File legacy da sostituire o deprecare

| Documento / modulo | Stato attuale | Azione |
|--------------------|---------------|--------|
| `OYASUMI_CONTEXT.md` §3 | Stats F/C/D/M/E, Reflexes, Jigoka | Riscrivere su Skiru + IR |
| `COMBAT_SPEC.md` | ~~Turni alternati, Reflexes, CS+Jigoka~~ | [x] Riscritto su 4/4 + IR + solo CS (Giugno 2026) |
| `CHRONO_STACK.md` | ~~Overheat −1 PV/stack~~ | [x] Aggiornato a −2 PV, max 2 turni (Giugno 2026) |
| `WAZA_CALCOLI.md` | Formule stat + M.G. grado | Sostituire con Tier 1–5 + pipeline danno |
| `STAT_POINTS_CONFIG.md` | Punti F/C/D/M/E per livello | Sostituire con costi Skiru + tabella leveling manuale |
| `LEVELING_DESIGN.md` | Keys/Gems, banner stat | Allineare a tabella Exp/Key/Grado del manuale |
| `DICE_SPEC.md` | Dadi in chat | **Deprecare** (manuale: assenza dadi) |
| `packages/domain/src/stats/calculator.ts` | Quadro momentaneo legacy | Nuovo motore Skiru + derivati |
| `apps/server/src/db/schema.ts` | `strength`…`empathy` | Migrare a `character_skiru` |
| `apps/tester/src/chronoStack.ts` | Re-export `@domain/combat` | [x] Deprecato wrapper, domain v3 |
| `apps/tester/src/combatSimulator.ts` | ~~Reflexes + Jigoka~~ | [x] IR + tier + CS v3 (Giugno 2026) |

---

## Ordine di implementazione consigliato

1. **Fase A — Motore (Parte II core):** ~~Skiru → Parametri derivati → Tempo → CS → Risoluzione → Tier/Pipeline~~ ✅ domain completato  
2. **Fase B — Sistemi satellite (Parte II):** ~~Status~~, ~~Consistenze~~, ~~Costrutti (base)~~, ~~Leveling~~, ~~Esagono~~ — restano DB status, costrutti persistenza, contenuto Waza/stili  
3. **Fase C — Contenuto (Parte III):** 6 Stili + meccaniche di stile  
4. **Fase D — Contenuto (Parte IV):** 6 Madoshō + waza clan  
5. **Fase E — Integrazione gioco:** scheda PG, chat, tester, deprecazione legacy  

---

# Parte I — Introduzione

## 1.1 Che cos'è Oyasumi
- [ ] 📄 Filosofia dark-fantasy, Analisti, Nemuribito, Ordini — coerenza narrativa UI/testi onboarding
- [~] Ambientazione Ōgon: esiste `OYASUMI_CONTEXT.md` e mappe, ma non ancora allineata al manuale Word completo
- [ ] 📄 Riferimento lore completo: nel manuale è indicata «Parte III — Ambientazione» ma nel doc attuale la Parte III è **Gli Stili** (verificare se l'ambientazione è in un capitolo futuro)

## 1.2 La Principia Satirica
- [ ] 📄 Testi guida / tutorial che comunicano «non si pianifica tutto, il caos offre»
- [ ] 📄 Copy onboarding e messaggi Master che riflettono l'Articolo 0

## 1.3 Filosofia di gioco: dadi in chat
- [x] Comandi `/d N` e `/dado N` in chat — risoluzione server (`apps/server/src/lib/dice-resolver.ts`)
- [x] Legacy `[dado:…]` ancora supportato (modificatori stat F/C/D/M/E)
- [x] Guida chat in UI — bottone **info** sopra campo Luogo (`ChatInfoPanel`)
- [ ] Documentare: **Descrizione comanda** + **Tempo 4/4** come due cardini UI/chat

## 1.4 Glossario essenziale
- [ ] Glossario in-app o pagina Guida con termini sotto (allineati al manuale)

| Termine | Checklist implementazione |
|---------|---------------------------|
| Jigo-Ka | [ ] 🔮 Capitolo «Ego» citato ma non ancora nel doc; oggi esiste come `jigokaMax` da stats legacy |
| Skiru | [~] Catalogo + regole exp in `@domain/skiru`; DB/UI ancora legacy |
| Shakai Kaikyū (classi sociali) | [~] Spec + catalogo domain; tool/DB/API da fare — `SHAKAI_KAIKYU_SPEC.md` |
| Indice di Riuscita | [x] `@domain/combat/resolution` |
| Waza | [~] Pool tester + tag chat `[waza:…]`; formule legacy |
| Chronostack (CS) | [x] Motore `@domain/combat/chrono-stack` |
| Tier (1–5) | [x] `@domain/combat/tier` + pipeline danno |
| Quarto (1/4) | [x] 📄 Gestito in autonomia dai giocatori — non programmato |
| Nemuribito / Bunsekikan | [~] Gradi in DB (`grades`, `characters.grade`) — tabella leveling manuale da allineare |
| Sōkaiju (Meiju / Shiju) | [~] Catalogo + UI; runtime (Kongen, Gojū, Kashin, Seimitsu, Chikō) + lancio waza con IR pre-danno |

---

# Parte II — Meccaniche

> **Priorità massima.** Tutto il resto del gioco dipende da questa parte.

---

## 2.1 Tempo

> **Non va programmato.** I giocatori tengono i quarti (4/4) in autonomia, in chat. Il Master valida la coerenza narrativa.

- [x] 📄 Regole in manuale — nessun tracker software
- [ ] 📄 Azioni gratuite (estrarre arma, parlare) — solo reminder in guida/Master, non codice
- [ ] 📄 Esempi frammentazione turno — materiale didattico, non UI

**Nota:** niente `packages/domain/combat/time.ts` né widget quarti in dashboard.

---

## 2.2 Chronostack (CS)

### Dichiarare l'accumulo
- [ ] 📄 Regola narrativa: accumulo dichiarato in azione (Master/Gioco, non validazione automatica)
- [ ] 🔮 Capitolo Jigo-Ka / Ego (non ancora nel doc)

### Guadagnare CS
- [x] **+3 CS/turno** se accumulo attivo — `CS_PER_TURN`
- [x] **+1 CS** colpo subito con successo — `CS_PER_HIT_TAKEN`
- [x] `applyTurnChronoGain()` con bonus opzionali Skiru/Waza
- [ ] Skiru/Waza specifiche che modificano accumulo (contenuto, non motore base)
- [ ] 📄 Tag `[cs:X]` in chat — formattazione già presente; pool volatile narrata dal PG

### Overheat
- [x] Capacità naturale **20 CS** — `CS_CAPACITY`
- [x] **−2 PV per stack oltre 20** — `OVERHEAT_PV_PER_STACK`
- [x] Max **3 turni** Overheat → **Defaticamento** (−50% CS, salta turno) — `resolveChronoStackEndOfTurn`
- [ ] 📄 Master può annullare movimento mal descritto

### Limite Waza per turno (per costo CS)
- [x] Tabella manuale — `WAZA_TURN_LIMITS`, `maxWazaPerTurnFromCosts`, `validateWazaTurnUsage`

| Costo CS | Max waza/turno | Check |
|----------|----------------|-------|
| 1–2 | Nessun limite extra (tempo narrato) | [x] |
| 3 | 3 | [x] |
| 5 | 2 | [x] |
| 10 | 2 | [x] |
| 20 | 1 | [x] |

- [x] Regola costo misto: vale il limite del **CS più alto** del turno

**Motore:** `@domain/combat/chrono-stack` · tester re-export da domain (Overheat aggiornato).

---

## 2.3 Risoluzione delle Azioni

### L'Indice di Riuscita (IR)
- [x] **IR = (Skiru Fisica + Skiru Incanalamento) ÷ 2** — `calculateSuccessIndex` (arrotondamento matematico)
- [x] Skiru scelte per azione via `ActionIndexInput` (non fissate per waza)
- [x] `hintActionSkiruDomains()` — avviso Chi/Jin tipici, senza bloccare (descrizione comanda)
- [x] Bonus milestone +15% — `milestoneIrBonus()`
- [x] IR come priorità simultanea — `compareResolutionPriority()`

### Il Confronto
- [x] Confronto binario attaccante vs difensore — `resolveConfrontation()`
- [x] Vincitore = IR più alto
- [x] **Stallo** se IR e quarti spesi uguali

### Lo Spareggio
- [x] Pareggio IR → prevale chi ha speso **meno quarti**
- [x] Stessi quarti → Stallo (`outcome: 'stalemate'`)

### Quando il colpo va a segno
- [x] `didOffensiveActionLand()` — vittoria attaccante → passa a pipeline danno (§2.9)
- [x] Pipeline Tier / Scudo / Itami — `@domain/combat/damage-pipeline` + `DamagePipelineTester`

**Motore:** `@domain/combat/resolution` · niente UI né validazione chat automatica.

---

## 2.4 Status

### Regola base
- [x] Engine status: stack, durata, decay a fine turno PG — `@domain/combat/status`
- [x] Status su personaggio **e** Costrutti — `StatusTargetKind`

### Status Emotivi
- [x] Regola comune: stack = durata in turni; −1 stack/fine turno PG; default 1 stack se non specificato

| Status | Checklist effetti |
|--------|-------------------|
| Ira | [x] +1 tier danno offensivo; +1 tier danno subito; movimento solo verso nemico; 2 CS per ignorare vincolo |
| Tristezza | [x] Waza costano metà CS (min 1); danno/gittata dimezzati; no potenziamento alleati |
| Disperazione | [x] Waza costano doppio CS; no heal HP; no guadagno CS (né +3 né +1 colpo) |
| Beatitudine | [x] Non decade a fine turno; movimento dimezzato; +1 CS/turno; transizioni Euforia/Tristezza/Disperazione per CS |
| Euforia | [x] +1 m/movimento ogni 2 stack; +1 tier ogni 4 stack; gain/loss stack su confronto/danno |

### Status Elementali
- [x] Mappatura elemento → status → Skiru (tabella Fuoco/Incendiato/Kairyoku ecc.)
- [x] Durata base **3 turni** salvo eccezioni

| Elemento | Status | Skiru | Check |
|----------|--------|-------|-------|
| Fuoco | Incendiato | Kairyoku | [x] |
| Fulmine | Sovraccarico | Binshō | [x] |
| Acqua | Torpore | Nintai | [x] |
| Gravità | Appesantimento | Seishin Tanren | [x] |
| Aria | Vertigini | Shakai Kaikyū | [x] |

Dettaglio per status (Incendiato, Sovraccarico, Torpore, Appesantimento, Vertigini): [~] regole base in catalogo; affinare da manuale §165–173

### Status Atipici (Madoshō)
| Status | Check |
|--------|-------|
| Emorragia | [x] contatori, 2 dmg/turno, cap 5 |
| Debitore | [x] forza Skiru più bassa nell'IR (Madoshō Komonoire) |
| Debito (Shakkin) | [x] status Hadō · interessi/riscossione automatizzati in chat |
| Metamorfosi | [~] Hadō Atsuryoku + soglie CS (flag; soglie §4 pending) |
| Trance Onirica | [~] anti-morte, desiderio, 5 turni (flag narrativo) |
| Sigillato (Portafortuna) | [x] |
| Macchiato | [x] no waza; −1 stack per attacco subito con successo |

**Target codice:** [x] `packages/domain/src/combat/status/` · [x] DB `character_status_effects` + API Master · [x] tag chat + Status Tester · [x] `combatSimulator` · [x] UI `StatusEffectsPanel`

---

## 2.5 Consistenze e Categorie

### Consistenze (corpo della waza)
- [x] Sonoro
- [x] Elementale (+ status elementale)
- [x] Liquido
- [x] Gassoso (hazard persistenti)
- [x] Solido
- [x] Energetiche
- [x] Nessuna

### Categorie (diffusione spaziale)
- [x] Raggio
- [x] Proiettile
- [x] Propagazione Conica
- [x] Propagazione (area)
- [x] Emanazione
- [x] Emanazione a Distanza
- [x] Contatto
- [x] Potenziamento
- [x] Costrutti

**Stato attuale:** [x] `@domain/combat/waza-taxonomy` — parser chat + chip UI Waza; `apps/tester/src/wazaTaxonomy.ts` re-export.

---

## 2.6 Costrutti, Scudo, Taglie

### Costrutti
- [x] Definizione: entità/oggetto da Jigo-Ka sul campo
- [x] **Resistenza** = (Genkai + tier waza) × moltiplicatore taglia
- [x] Costrutto stazionario: nessun IR proprio — flag `stationary` + domain
- [x] Costrutti **senza Itami** (danno pieno salvo Scudo proprio) — `skipItamiMitigation` in pipeline
- [x] Regole distruzione / persistenza — `field_constructs` + API Master + danno assorbimento

### Scudo
- [x] Assorbe per **Resistenza** prima della pipeline danno
- [x] Tag `[Scudo]` in azione (parser chat client + server)

### Taglie
| Taglia | Misura | Resistenza | Movimento | Danno |
|--------|--------|------------|-----------|-------|
| Piccola | ≤0,5 m | ×0,5 | pieno | [x] |
| Media | 0,5–2 m | ×1 | ×0,75 | [x] |
| Grande | 2–5 m | ×1,5 | ×0,5 | +1 tier |
| Enorme | >5 m | ×2 | ×0,25 | +2 tier |

**Target codice:** [x] `packages/domain/src/combat/constructs.ts`, [x] `field-constructs.ts` + DB, [x] Gestione Combattimento + Damage Pipeline Tester.

---

## 2.7 Skiru

> ⚠️ **Fondamenta del refactor.** Sostituisce F/C/D/M/E e gran parte del «Quadro momentaneo».

### Regole globali Skiru
- [x] Cap **10 punti** per nodo — `SKIRU_MAX_POINTS` in `@domain/skiru`
- [x] Costo exp crescente (3, 6, 12, 24, 48…) — `expCostForNextSkiruPoint`
- [x] Validazione scheda anti-cheat — `validateSkiruSheet`
- [ ] 📄 Nessuna scheda stats separata (filosofia; integrazione UI pending)
- [ ] 📄 Trade-off ampiezza vs profondità (regola di design, non codice)

### Ten (天) — Cielo · Intelletto

#### Shakai Kaikyū — Classe Sociale

> **Spec completa:** [`SHAKAI_KAIKYU_SPEC.md`](./SHAKAI_KAIKYU_SPEC.md) (fasi 0–9 + domande aperte) · domain `@domain/shakai-kaikyu`

| Fase | Contenuto | Stato |
|------|-----------|-------|
| **0** | Decisioni design (Skiru vs classe, valuta XP, reset giornaliero) | [~] |
| **1** | DB: `social_class`, `social_subclass_sheet`, `social_daily_usage` | [ ] |
| **2** | Domain: catalogo ✅, prerequisiti ✅, budget, assign/unlock | [~] |
| **3** | API: scelta classe, sblocco sottoclasse, moderazione | [ ] |
| **4** | UI: scelta classe, albero sottoclassi in scheda | [ ] |
| **5** | Tool dashboard (×5 classi) | [ ] |
| **6** | Blueprint filtrati per tag `#Medico` … `#Sacerdote` | [ ] |
| **7** | Integrazione HP, inventario, costrutti, patti, ofuda | [ ] |
| **8** | Moderazione staff + audit | [ ] |
| **9** | Docs, onboarding, allineamento Skiru catalogo | [ ] |

**Già fatto**
- [x] Spec regole + 5 classi + 25 sottoclassi (`SHAKAI_KAIKYU_SPEC.md`)
- [x] `@domain/shakai-kaikyu/catalog.ts` — limiti numerici, trade-off testuali
- [x] `@domain/shakai-kaikyu/progression.ts` — `canUnlockSocialSubclass()`, `resolveDailyLimitFromSubclasses()`
- [x] 5 voci Skiru base (`ishi` … `shisai`) — solo lore, **non ancora** collegate a tool

**Prossimi step consigliati (ordine)**
1. Rispondere **Q1–Q4** in `SHAKAI_KAIKYU_SPEC.md` (Skiru, valuta, sentieri, reset)
2. Schema DB + migrazione (Fase 1)
3. `POST /characters/me/social-class` + UI scelta (Fasi 3–4)
4. Albero sottoclassi + spesa XP (Fasi 2–4)
5. Prima tool: **Medico** (Fase 5.1–5.2) con budget HP giornaliero
6. Blueprint minimo `#Medico` (Fase 6.2)

**Tool per classe (quando pronte)**

| Tag | Classe | Capacità tool |
|-----|--------|----------------|
| `#Medico` | Ishi | Cura PG + preparati (ricette) |
| `#Artigiano` | Shokunin | Ripara/costruisce + Costrutti materiali (progetti) |
| `#Cacciatore` | Ryōshi | Traccia/caccia + raccolta (tracce/prede) |
| `#Politico` | Seijika | Patti + richiamo favori (leve) |
| `#Sacerdote` | Shisai | Ofuda + interpretazione (riti) |

**Domande aperte:** vedi tabella Q1–Q12 in `SHAKAI_KAIKYU_SPEC.md`.

#### Seishin Tanren — Disciplina Mentale
- [x] Fudōshin (Fermezza)
- [x] Kansatsu (Osservazione)
- [x] Chōkaku (Percezione Superiore)

### Chi (地) — Terra · Fisicità

#### Tōsō — Combattimento
- [x] Kensei (Maestro Lame)
- [x] Jūsei (Maestro Armi da Fuoco)
- [x] Kenka-Ō (Re della Rissa)

#### Binshō — Agilità
- [x] Undō (Movimento) → governa **Movimento** (derivati: step 2.8)
- [x] Hansha (Riflessi)
- [x] Seimitsu (Precisione)

#### Nintai — Tempra
- [x] Dokusei (Robustezza) → governa **HP**
- [x] Itami (Dolore) → governa **Mitigazione**
- [x] Konjou (Tenacia) → governa **HP**

#### Kairyoku — Vigore
- [x] Bakuryoku (Potenza)
- [x] Kairiki (Forza Bruta)
- [x] Gōatsu (Pressione)

### Jin (人) — Uomo · Spirito

#### Shinka no Nagare — Flusso Libero
- [x] Itten Kōkan (Incanalamento · Armi Bianche)
- [x] Jūryoku Kōkan (Incanalamento · Armi da Fuoco)
- [x] Shintai Kōkan (Incanalamento · Arti)

#### Sōkaiju — Il Doppio Albero dei Mondi
- [x] Struttura 11 ancoraggi — **una Skiru per nodo** con doppio volto Meiju + Shiju (`sokaijuMeiju` / `sokaijuShiju`)
- [x] Tenkan (Keter) · Shikai (Nehemoth) — accumulo CS / Overheat; **Tenkan accademico** (`expPurchasable: false`, gate `tenkan:1` per altri nodi)
- [x] Gojū (Binah) · Kyogai (Chramazon) + 5 affinità elementali — auto-status su hit elementale in chat
- [x] Genkai (Malkut) · Sōmei (Thaumiel) → **Resistenza Costrutti**
- [x] Kongen floor danno · Gōjin counter · Kashin tie-break — `sokaiju-combat.ts` + `damage-pipeline.ts` + `resolution.ts`
- [x] Shōdō durata · Eiga stack emotivi — hook in `waza-chat-automation` (status colpiti)
- [x] Chikō cap costrutti — `canPlaceFieldConstruct()` + blocco in `createFieldConstructForCharacter`
- [x] Rider Seimitsu (−2 IR difensore) — `resolveCombatConfrontationBetween`
- [x] Confronto IR pre-danno su `[hit:1]` — attaccante (Skiru dichiarata o indicativo) vs difesa indicativa bersaglio
- [~] Jikai cure/buff · Hikan sorpresa/schivata — helper in domain; flussi chat incompleti
- [x] UI scheda: tab Sōkaiju, lore, formule live, automatismi collassabili — `SchedaSkiruPage.tsx`
- [ ] Meccaniche runtime per nodi Shiju oltre Shikai (narrativo / fase 2)

#### Jiga no Shihaisha — Padrone dell'Io (milestone narrativi, non comprabili)
- [x] Milestone in catalogo (`kind: 'milestone'`)
- [x] Solo **1 milestone attiva** alla volta — `applyJigaMilestone()` su approvazione Premio
- [x] Bonus: **+15% IR** e **+15% danno** waza pertinenti — `milestoneIrBonus`, `MILESTONE_DAMAGE_PERCENT_BONUS`
- [x] Keishōsha (Erede 55% Madoshō)
- [x] Kanpeki Keishōsha (85% Madoshō)
- [x] Renkinjutsushi (4 Waza stessa Consistenza)
- [x] Daisei no Renkin (8 Waza stessa Consistenza)
- [x] Inkyo (55% Premio)
- [x] Sentō Senshi (55% arsenale d'ordine)

### Integrazione dati (non ancora necessaria per il motore)
- [x] Schema DB `skiru_sheet` jsonb su `characters` (già in `apps/server/src/db/schema.ts`)
- [x] API GET/PATCH `/characters/me/skiru` — `getSkiruSheet` + `raiseSkiruNode` (MECHANICS_ROADMAP §2.7, commit feature/skiru-api)
- [x] UI scheda: albero Ten / Chi / Jin — `SchedaSkiruPage.tsx` + editor punti (`PATCH /me/skiru`, EXP spendibile)
- [x] Vista **albero a rombi** videogame — `SkiruTreeView.tsx` + layout PDF (`tree-layout.ts`)
- [x] Sotto-rami Tōsō investibili — 9 nodi catalogo + prerequisito padre (`parentSkiruId`)
- [~] Spesa exp collegata al gioco live (Skiru ✅; skill shop ✅ in finestra Waza; level-up banner ✅ dashboard §2.11)
- [~] Migrazione personaggi legacy — script eseguito; PG con stats F/C/D/M/E → jsonb

**Stato attuale:** [x] Motore domain `@domain/skiru` (**54 voci** catalogo, 9 rami). [x] Tester `skiruPool.ts` = adapter read-only su `SKIRU_CATALOG`; fallback F/C/D/M/E se `skiruSheet` vuoto.

---

## 2.8 Parametri Derivati

| Parametro | Formula manuale | Stato |
|-----------|-----------------|-------|
| HP | `20 + 5 × (Dokusei + Konjou)` | [x] `@domain/skiru` |
| Mitigazione | `3% × Itami` (max −30%) | [x] `@domain/skiru` |
| Movimento | `2 + 1,5 × Undō` m/quarto | [x] `@domain/skiru` |

- [x] Calcolo in `packages/domain/src/skiru/derived-stats.ts`
- [x] Esporre in scheda PG (tab Principale + Statistiche + HUD mobile) — HP / Mitigazione / Movimento
- [~] API pubblica: `GET /characters/:id/public` — solo `computed` + `skiruSheet`/`skiruDomains` (stats F/C/D/M/E rimosse)
- [x] Rimuovere Body/Reflexes/Velocità/Jigoka dalla UI principale — legacy F/C/D/M/E collassato in `<details>`

---

## 2.9 Pipeline del Danno

- [x] **Danno base** = Tier + bonus — `calculateBaseDamage()`
- [x] **Danno HP** = (Danno base − Scudo) × mitigazione Itami — `resolveDamageToHp()`
- [x] Scudo assorbe Resistenza per prima — `applyShieldToDamage()`
- [x] Itami via `@domain/skiru/derived-stats`
- [x] Milestone +15% danno — `MILESTONE_DAMAGE_PERCENT_BONUS`
- [x] Floor Kongen + bonus Gōjin (reattivo) — `resolveSokaijuFlatDamageBonus` in `damage-pipeline.ts`
- [x] Rider Skiru dichiarata (+2 danno Bakuryoku/Gōatsu, Shintai su `[Contatto]`) — `waza-skiru-riders.ts` + lancio chat `[hit:1]`
- [x] Integrazione UI/chat/tester — `DamagePipelineTester`, breakdown log combat, tag `[tier:N]` in chat

**Motore:** `@domain/combat/damage-pipeline` · esempio manuale T3+15% vs Itami 2 → **13 HP**.

---

## 2.10 Scala dei Tier

### Tabella tier
| Tier | Danno/Resistenza | Costo CS | Grado PG indicativo |
|------|------------------|----------|---------------------|
| 1 | 4 | 1 | Nemuribito |
| 2 | 8 | 2 | Hakyō |
| 3 | 12 | 3 | Bunsekikan |
| 4 | 17 | 5 | Sentatsu Bunsekikan |
| 5 | 23 | 7 | Kanteikan / Shin'enkan |

- [x] `WazaTier` 1–5 + `TIER_TABLE` — `@domain/combat/tier`
- [x] `getTierValue`, `getTierCsCost`, `getTierMinGrade`
- [ ] 📄 Tier fissato sulla waza al authoring (tester/pool), non comprato con exp
- [ ] 📄 Waza senza danno: tier vale per CS / Resistenza costrutto, non HP

---

## 2.11 Leveling

- [x] **Curva EXP** (LEVELING_DESIGN) — cap **50**; Δ = 50 + 39×(L−2); formula in `@domain/progression/levels.ts`
- [x] **Premi v3** — Key da tabella manuale 1–15 (+1 default 16–50); EXP spendibile al gain (non +5 stat / Gems)
- [x] **Paragon** post-cap 50 — stessa formula Δ EXP; nome **viola** in Lista Presenti (`presentiNameClass`)
- [x] Domain unificato — `@domain/progression/levels.ts` (`getLevelFromExp`, `getParagonFromExp`, `formatLevelLabel`)
- [~] Grado PG legato a soglie exp — `getGradeForLevel()` indicativo (Consiglio assegna discrezionalmente)
- [~] ⚠️ Rimuovere **Gems** — rimosse da UI/API client; colonna DB legacy deprecata (non droppata)
- [x] Banner level-up tester — Skiru/Key/EXP spendibile (`LevelUpBanner.tsx`)
- [x] **Level-up end-to-end** — `applyCharacterExpGain` (chat + quest), Key incrementali (`lastLevelKeysApplied`), overlay dashboard, WS `level_up`, `GET /characters/me` + `PATCH /me/level-up-banner`
- [x] Scheda client — `resolveLevelFromExp` al posto di soglie hardcoded (100/300/…)
- [x] Finestra **Skiru & Waza** unificata — `SkiruWazaPanel.tsx` (EXP + tab Skiru/Waza); Market solo REM

**Target:** `packages/domain/src/progression/`, seed DB `levels`/`grades` (aggiornare seed a 60 se re-seed).

---

## 2.12 Slot Passivi

| Slot | Costo exp |
|------|-----------|
| 3° | 50 |
| 4° | 100 |
| 5° | 200 |
| 6° | 400 |

2 slot base + sblocco fino a 6 con EXP spendibile. Equip Waza `isPassive` possedute (distinto dagli slot inventario oggetti).

- [x] Modello slot passivi PG (`uiMetadata.passiveSlotsUnlocked`, `equippedPassiveIds`; `@domain/progression/passive-slots`)
- [x] Acquisto slot con EXP (`POST /characters/me/passive-slots/unlock`)
- [x] Equip passivi (`PATCH /characters/me/passive-slots/equip`; `skills.is_passive`)
- [x] UI tab Waza — `PassiveSlotsPanel` rombi + shop passive (catalogo via `sync-waza-manual.ts`)

---

## 2.13 Esagono degli Stili

- [x] Matrice affinità 6 Vie: Tōka, Genzai, Itō, Naikan, Hadō, Hensei — `@domain/progression/style-hexagon`
- [x] Stile principale + adiacenti (3) + lontani (1) + opposto (0) — caps 6/3/1/0
- [x] Sblocco rami non-principali con Key — `POST /characters/me/style-hexagon/unlock`
- [x] Tabella §505–537 in config domain + validazione acquisto Waza + `StyleHexagonPanel`

**Stato attuale:** [~] `apps/tester/src/wazaBranches.ts` — verificare 6 rami vs esagono.

---

# Parte III — Gli Stili

> Per ogni stile: **meccanica di stile** prima, poi singole waza nel pool.

Legenda sotto-sezioni:
- **Meccanica** = regole speciali del ramo
- **Waza** = tecniche da inserire in pool/tester/DB
- **Codice** = implementazione regole in domain + tester

---

## 3.1 Tōka-dō (灯火道) — Via della Lanterna

### Meccanica: il Tōrō
- [x] Sistema lanterna / luce guidata — `@domain/styles/toka/toro`
- [x] Codice domain + UI stato Tōrō — `ToroStatePanel`, `GET/PATCH /characters/me/toro-state`
- [x] Tag chat `[toro]` / `[Tōrō]` formattati — `formatToroTagsInText`

### Waza
- [x] Tōrō (灯籠) — Lanterna Incisa — `wazaPool` + `sync-waza-manual`
- [x] Michishirube (道標) — Luce Guida
- [x] Shōka (小火) — Fiamma Docile
- [x] Nokuribi (残り火) — Fuoco Residuo
- [x] Kintsugi (金継ぎ) — Legame dei Frammenti
- [x] Kakuchō (拡張) — Espansione della Luce
- [x] Hōshutsu (放出) — Rilascio della Fiamma
- [x] Ukabu Tōrō (浮かぶ灯籠) — Lanterna Fluttuante
- [x] Fuin no Hi (封印の火) — Sigillo della Fiamma
- [x] Kyōmei (共鳴) — Risonanza della Fiamma
- [x] Omocha (玩具) — Il Giocattolo — grado SB
- [x] Gangushi (玩具師) — Il Giocattolaio — grado K

---

## 3.2 Genzai-dō (現在道) — Via della Scrittura

### Meccanica: Gosa (誤差) — Margine d'Errore
- [x] Regole Gosa implementate — `@domain/styles/genzai/gosa`
- [x] UI tracker — `GosaStatePanel`, `GET/PATCH /characters/me/gosa-state`
- [x] Accumulo su evocazione costrutto (Master API) + tag `[Gosa:N]`

### Waza
- [x] Nikutai-Mei (肉体銘) — Carne Iscritta — `genzai-waza-pool`
- [x] Honshitsu (本質) — Essenza Affine
- [x] Kōchiku (構築) — Struttura Salda
- [x] Bugusho (武具書) — Arsenale Scritto
- [x] Kaihen (改編) — Forgia Ibrida
- [x] Kioku-Mei (記憶銘) — Sigillo Mnemonico
- [x] Eizoku (永続) — Sigillo Persistente
- [x] Kajū (過重) — Sovraccarico Geometrico
- [x] Hakai-Mei (破壊銘) — Marchio del Disfacimento
- [x] Irekogo (入れ子) — Sigillo Annidato
- [x] Tōki (闘気) — Aura Dichiarata
- [x] Raimei-Fu (雷鳴符) — Sigillo del Fulmine
- [x] Yōki no Iki (妖気の息) — Soffio dello Yōkai
- [x] Onnen-dama (怨念玉) — Globo del Rancore
- [x] Hashira (柱) — Colonne Incise
- [x] Utsushi (写し) — Copia Conforme
- [x] Shōgeki-Te (衝撃手) — Palmo Elementale
- [x] Genso-Ya (元素矢) — Dardo Elementale
- [x] Kesshō-Mei (結晶銘) — Memento Mori
- [x] Jiban (地盤) — Terreno Ostile
- [x] Meisaku (銘作) — Opera Prima — grado SB
- [x] Shinryaku (侵略) — Invasione — grado K
- [x] Rakuen (楽園) — Eden — grado S

---

## 3.3 Itō-dō (糸道) — Via del Filo

### Meccanica: Tensione (緊張)
- [x] Tracker tensione fili — `DoMechanicsPanel`, `GET/PATCH /characters/me/do-mechanics`, `@domain/styles/ito/tensione`

### Waza
- [x] Ayatsuri (操り) — Filo del Burattinaio
- [x] Someito (染め糸) — Filo Tinto
- [x] Yugami (歪み) — Filo Deforme
- [x] Tazuna (手綱) — Redini
- [x] Wakeito (分け糸) — Filo Sdoppiato
- [x] Hikitome (引き止め) — Trattenuta
- [x] Hajiki (弾き) — Fionda del Filo
- [x] Irekae (入れ替え) — Scambio dei Fili
- [x] Mayu-Wari (繭割り) — Bozzolo Squarciato
- [x] Hikiyose (引き寄せ) — Richiamo dei Fili
- [x] Musubi (結び) — Nodo Gemello
- [x] Mayakashi (まやかし) — Inganno del Filo
- [x] Ubaiito (奪い糸) — Filo Rubato
- [x] Unari (唸り) — Ronzio del Filo
- [x] Shime (締め) — Stretta del Filo
- [x] Rensa (連鎖) — Catena di Fili
- [x] Kankatsu (管轄) — Giurisdizione — grado SB
- [x] Chokurei (勅令) — Decreto — grado K
- [x] Mugen-Shihai (夢幻支配) — Dominazione Onirica — grado S

---

## 3.4 Naikan-dō (内観道) — Via del Supporto

### Meccanica: Junkan (循環)
- [x] Sistema circolazione / supporto alleati — `DoMechanicsPanel`, `@domain/styles/naikan/junkan`

### Waza
- [x] Junnō (順応) — Pelle che Apprende
- [x] Hibiki-Gaeshi (響き返し) — Eco di Risposta
- [x] Jiga-Hōki (自我放棄) — Ego Traboccante
- [x] Ittai (一体) — Un Solo Corpo
- [x] Naka-Kae (中替え) — Scambio del Nucleo
- [x] Tobi-Kake (飛び駆け) — Slancio in Carica
- [x] Datsui-Tate (脱衣盾) — Scudo Spogliato
- [x] Datsui-Yumi (脱衣弓) — Arco Spogliato
- [x] Hari-Tsume (張り詰め) — Carico Trattenuto
- [x] Sen'i-Gake (繊維掛け) — Avvolgimento delle Fibre
- [x] Geki-Ryū (激流) — Corrente Violenta
- [x] Hada-Yuzuri (肌譲り) — Cessione attraverso la Pelle
- [x] Tsubo-Uchi (壺打ち) — Colpo al Punto
- [x] Shōka (昇華) — Sublimazione
- [x] Shokushin (触診) — Lettura del Corpo — grado SB
- [x] Kōmei (抗命) — Chi lo ha Deciso? — grado K
- [x] Hōgō (縫合) — Sutura dell'Ego — grado S

---

## 3.5 Hensei-dō (変成道) — Via dell'Oscillazione

### Meccanica: Yuragi (揺らぎ)
- [x] Cambio consistenza / priorità parità IR — `DoMechanicsPanel`, `@domain/styles/hensei/yuragi`

### Waza
- [x] Nuova Consistenza (regola)
- [x] Kyōsei-Hen (強制変) — Mutazione Imposta
- [x] Genso-Ka (元素化) — Elementalizzazione
- [x] Renkin-Soku (錬金則) — Regole Alchemiche
- [x] Kenja no Ishi (賢者の石) — Pietra Filosofale
- [x] Rōei (漏洩) — Scia Incontrollata
- [x] Hannō (反応) — Reazione di Consistenza
- [x] Wana (罠) — Trappola!
- [x] Ihen (異変) — Aberrazione
- [x] Bōgai (妨害) — Disturbo
- [x] Oboro (朧) — Velo Onirico
- [x] Bōchō (膨張) — Espansione Instabile
- [x] Kōkan (交換) — Scambio di Consistenza
- [x] Sōkotsu (相崩) — Fusione Instabile
- [x] Shoku (蝕) — Corrosione
- [x] Tenka (転化) — Dalla Padella alla Brace
- [x] Shokubai (触媒) — Catalisi
- [x] Nagori (名残) — Principio di Instabilità — grado SB
- [x] Igyō-Rensei (異形錬成) — Insegnamenti di Tucker — grado K
- [x] Ishi (意志) — Volere

---

## 3.6 Hadō-dō (波動道) — Via dell'Onda

### Meccanica: Atsuryoku (圧力) — Pressione
- [x] Soglie CS / Metamorfosi (12 CS, Overheat…) — `DoMechanicsPanel`, `@domain/styles/hado/atsuryoku`; status §2.4 in tick combattimento

### Waza
- [x] Chikuden (蓄電) — Batteria
- [x] Gyakuryū (逆流) — Riflusso
- [x] Teishūha (低周波) — Onda Bassa
- [x] Kanshi (監視) — Occhio Remoto
- [x] Fuantei (不安定) — Deflagrazione Instabile
- [x] Kaatsu (加圧) — Sovrappressione
- [x] Kantsū (貫通) — Calibro Pesante
- [x] Sorashi (逸らし) — Deviazione
- [x] Hōwa (飽和) — Saturazione
- [x] Fukitobashi (吹き飛ばし) — Spinta d'Urto
- [x] Tanraku (短絡) — Corto Circuito
- [x] Hōsha (放射) — Raffica Psichica
- [x] Tameru (溜め) — Impeto Trattenuto
- [x] Hōden (放電) — Scarica d'Impatto
- [x] Mugen no Tsukai (夢幻の使い) — Famiglio Onirico
- [x] Rensa-Baku (連鎖爆) — Detonazione a Catena
- [x] Kasan (加算) — Carica Detonante
- [x] Byō (鋲) — Ancora Psionica
- [x] Maikomi (埋め込み) — Innesto Forzato
- [x] Kunō-Baku (苦悩爆) — Implosione della Sofferenza
- [x] Tōshi (投資) — Investimento Energetico — grado SB
- [x] Shakkin (借金) — Indebitamento — grado K

### Integrazione Parte III (trasversale)
- [x] **Fonte canonica waza** — `docs/Oyasumi_Manuale_Completo.pdf` + waza avanzate per grado · `MANUAL_WAZA_POOL_IDS` in `@domain/progression/do-statutes` (112 waza: Tōka 12 · Genzai 23 · Itō 19 · Naikan 17 · Hensei 19 · Hadō 22)
- [x] Pool waza tester (`wazaPool.ts`) allineato al PDF — test `do-mechanics.test.ts` vs catalogo
- [x] Keystone Dō — Tōrō, Honshitsu, Ishi, Chikuden (`STYLE_KEYSTONE` + validazione acquisto)
- [x] Sync catalogo DB — `bun run sync-waza-manual` (pool-first; CALCOLI solo per branch non coperti)
- [x] Raggruppamento waza per Dō in UI — `WazaByDoSections` (registro scheda)
- [x] Browser catalogo Dō — `WazaDoBrowser` (statuto PDF, nav Vie, acquisto EXP, ramo Key)
- [x] Tracker meccaniche per stile — Tōrō, Gosa, DoMechanics (Itō–Hadō)
- [x] Acquisto waza con EXP + vincoli Esagono/Key/keystone — `characters.service` + `WazaDoBrowser`
- [x] Tool authoring Idee e sviluppo allineato a tier/consistenza/categoria — tier da CS §2.10, chip tag §2.5 in WazaInsertionTool
- [x] Tag chat `[waza:Nome]` con anteprima tier/CS/IR suggerito — `@domain/combat/waza-tag-preview` + catalogo generato
- [x] **Waza Generiche** — pool `generiche-waza-pool.ts` (**34**); acquisto EXP senza Esagono; status `[Rallentato]` in domain; semi-auto Ippuku + status-on-hit (Suishin, Nenmō, Kyōkan, Hankyō)
- [~] **Ordine / Oni no Mori** — pool vuoti (`ordine-waza-pool.ts`, `onimori-waza-pool.ts`) + regole acquisto Ordine (Sentō Senshi + ordine militare); tab UI + classifier famiglia

---

# Parte IV — Le Madoshō

> Madoshō = eredità di sangue, **non comprabile**, **non segue Esagono**.  
> Ogni PG ne ha **una alla creazione**; dà accesso alle waza del lignaggio.

## 4.0 Regole generali Madoshō
- [x] Scelta Madoshō — richiesta giocatore in Scheda → Richieste; approvazione staff Gestione
- [x] Campo `madoshoId` su character — assegnato solo ad approvazione
- [x] Waza Madoshō senza vincoli Esagono/Key — disponibili se `madoshoId` PG coincide (`characters.service`); costo EXP 0 fino a milestone Jiga
- [x] Pool `apps/tester/src/madoshoPool.ts` — **55 waza** (11×5 lignaggi; Komonoire vuoto)
- [x] Taxonomy `madoshoTaxonomy.ts` — 6 lignaggi allineati al domain
- [x] `MANUAL_MADOSHO_POOL_IDS` in `@domain/progression/madosho` + test allineamento pool

---

## 4.1 Rin'gai — soglia vita/morte

### Lore & identità
- [ ] 📄 Testi origini Hyakki Yagyō in scheda / codex

### Waza
- [x] Zan'ei (残影) — Traccia d'Ego
- [x] Kegare (穢れ) — Untore
- [x] Kokurui (黒涙) — Lacrime Nere
- [x] Handō (反動) — Elastico
- [x] Magai Jigoku (紛い地獄) — Inferno non così Onirico
- [x] Hedo (反吐) — Rigurgito della Psiche
- [x] Tamashii no Hake (魂の刷毛) — Spolverino dell'Anima
- [x] Yobimodoshi (呼び戻し) — Richiamo dell'Essere
- [x] Buttō (沸騰) — Bollore d'Ego
- [x] Kugutsushi (傀儡師) — Marionettista del Dolore
- [x] Uzu (渦) — Purgatorio, il Mulinello

---

## 4.2 Gōkaon — trasformazione (oni)

### Meccanica: Pressione + forma demoniaca
- [ ] Jigo-Ka scura, calore, pressione non dissipa in combattimento

### Waza
- [x] Yasei (野性) — Natura Ferina
- [x] Gashin (餓心) — Cuore Affamato
- [x] Oni no Kyūkaku (鬼の嗅覚) — Fiuto dell'Ogre
- [x] Oni no Mezame (鬼の目覚め) — Risveglio dell'Oni
- [x] Oni no Ago (鬼の顎) — Mascella dell'Ogre
- [x] Jūshi (獣肢) — Arto Bestiale
- [x] Oni no Hōkō (鬼の咆哮) — Ruggito dell'Oni
- [x] Mōshin (猛進) — Impeto Feroce
- [x] Kotsudan (骨弾) — Proiettile Osseo
- [x] Jiware (地割れ) — Spezza-terra
- [x] Dōka (同化) — Assimilazione

---

## 4.3 Komonoire — patto sbagliato

### Meccanica: dado demoniaco + Debitore
- [~] Invocazione arma casuale ogni turno — tag `[komonoire:tira:N]` / `[komonoire:dado:N]` (N=1–6)
- [x] Status Debitore su rifiuto/opposizione — `[komonoire:rifiuta]` / `[komonoire:opposizione]`
- [ ] 🔮 Waza del lignaggio: **lore presente, elenco waza da completare nel manuale**

---

## 4.4 Nakigara — sangue

### Waza
- [x] Chi ni somaru (血に染まる) — Tinti dal Sangue
- [x] Chi no Kehai (血の気配) — Se vive, sanguina
- [x] Matsugo no Chi (末期の血) — Se sanguina, muore
- [x] Ketsumyaku no Yaiba (血脈の刃) — Foce della Progenie
- [x] Chi no Hōyō (血の抱擁) — Abbracciati dal Nostro Sangue
- [x] Hirui (緋涙) — Lacrime Scarlatte
- [x] Chi no Kizuna (血の絆) — Legame di Sangue
- [x] Yuketsu (輸血) — Trasfusione
- [x] Kaketsu (化血) — Nati nel Sangue
- [x] Soketsu no Minamoto (祖血の源) — Sorgente del Progenitore
- [x] Yume ga nijimu (夢が滲む) — Il sogno sanguina

---

## 4.5 Ikiryō — giardino nero

### Meccanica: emozioni → fiori / avvelenamento
- [ ] Trigger emotivi fuori corpo

### Waza
- [x] Aku no Hana (悪の華) — Fiori del Male
- [x] Dokushu (毒手) — Pollice Nero
- [x] Jagan no Niwashi (邪眼の庭師) — Giardinieri del Malocchio
- [x] Chōkafun (弔花粉) — Polline Funereo
- [x] Himawari no Kushi (向日葵の串) — Girasole Impalatore
- [x] Ibara no Batsu (茨の罰) — Rovina di Rovi
- [x] Bara no Shokei (薔薇の処刑) — Sterminio di Rose
- [x] Tanpopo no Noroi (蒲公英の呪い) — Dannazione di Denti di Leone
- [x] Chōkafunsō (弔花粉葬) — Sepoltura del Polline Funereo
- [x] Bochi no Hasami (墓地の鋏) — Cesoie Cimiteriali
- [x] Yume ga Saku (夢が咲く) — Il Sogno in Fiore

---

## 4.6 Hataori — telaio / nodi

### Meccanica: fili da pelle, sigilli, portafortuna
- [ ] Sistema nodi / Sigillato / comunicazione mente-mmente

### Waza
- [x] Kinu no Hada (絹の肌) — Pelle di Seta
- [x] Sokubakukan (束縛感) — Nato Stretto e Costretto
- [x] Nodoshibari (喉縛り) — Nodo alla Gola
- [x] Hishi-musubi (菱結び) — Sigillo Portafortuna: Nodo a Diamante
- [x] Kanmusubi (冠結び) — Sigillo di Controllo: Nodo a Corona
- [x] Jūji-musubi (十字結び) — Sigillo Portafortuna: Nodo a Croce
- [x] Mitsuba-musubi (三つ葉結び) — Sigillo di Controllo: Nodo a Trifoglio
- [x] Kiku-musubi (菊結び) — Sigillo di Confinamento: Nodo a Crisantemo
- [x] Sōsen-musubi (双銭結び) — Sigillo di Controllo: Nodo a Doppia Moneta
- [x] Ai no Musubi (愛の結び) — Sigillo Onirico: Nodo dell'Amore
- [x] Ori no Mohō (織りの模倣) — Sigillo Onirico: Imitazione dell'Arazzo

---

# Integrazione nel software (cross-cutting)

## Scheda personaggio
- [x] Finestra Scheda (`DashboardWindowPanel`) — Skiru-first; legacy F/C/D/M/E in sezione collassata
- [x] Vista Skiru + derivati + tier waza possedute (scheda altrui read-only; PG proprio → finestra Skiru & Waza)
- [x] Milestone Jiga no Shihaisha — approvazione richiesta Premio → `skiruSheet` + pixel-icon ◆
- [x] Creazione PG — solo registrazione (`/auth`); profilo in Scheda → Modifica; niente `/create-character`

## Finestra Skiru & Waza (dock)
- [x] Pannello unificato `SkiruWazaPanel` — banner EXP spendibile + Keys, tab Skiru | Waza + acquisto skill
- [x] Rimosso da Market/Shop (solo REM)

## Chat & combattimento
- [x] Tag `[waza:…]`, `[cs:X]`, `[tier:N]`, `[ir:N]`, `[skiru:id]`, `[target:…]`, `[hit:1]` formattati / parsati
- [x] **Pannello lancio waza** — `WazaLaunchPanel` (Skiru, CS, bersaglio, colpo a segno, anteprima danno, invio diretto)
- [x] Comando `/waza … --skiru … --cs … --target …` espanso all'invio
- [x] `WazaLaunchStrip` in messaggio — Skiru, rider, bersaglio, danno indicativo
- [x] Automazione danno tier su `[hit:1]` — `waza_launch_damage` (Kongen + rider + mitigazione Itami)
- [x] Spesa CS al lancio da tag `[cs:N]`
- [x] Tag quarti `[1/4]`…`[4/4]` in `narrative-parser.ts`
- [x] Tag `[Scudo]` formattato
- [x] Hint IR read-only `[IR:N]` (non sostituisce Master)
- [x] Dadi `/d N`, `/dado N` — risoluzione server + stile `.dice-tag`
- [x] Tag `[toro]` / `[Tōrō]` — `.toro-tag`
- [x] Guida chat — bottone **info** (`ChatInfoPanel`)
- [x] Waza in scheda/shop raggruppate per Dō — `WazaByDoSections`
- [x] Tracker turno 4/4 in UI chat — `QuarterTurnHud` legge `[N/4]` nel draft messaggio
- [x] Automazione chat Hadō: Tōshi `[investimento:+N]` / `[investimento:riscuoti]` · Shakkin `[debito:NomePG]` / `[debito:riscuoti]` / `[debito:restituisci]` — `@domain/combat/waza-chat-automation`
- [x] Automazione chat Naikan/Hensei: Kōmei (inversione status + buff meta) · Shokushin `[lettura:NomePG]` · Nagori + `[yuragi:da→a]` — stesso modulo; `[stato: …]` include segmenti avanzati
- [x] Catalogo waza in UI — tab **Generiche | Dō | Madoshō | Ordine | Oni no Mori** (`WazaCatalogPanel`) · registro per famiglia (`WazaByFamilySections`)

## Tester (`apps/tester`)
- [x] Combat simulator v3 — `combatSimulator.ts` + `CombatTester.tsx` (IR, tier, CS)
- [x] `chronoStack.ts` → re-export `@domain/combat/chrono-stack`
- [~] Skiru browser — allineato a catalogo domain (adapter read-only; snapshot solo via API)
- [x] Waza browser client — `WazaDoBrowser` + registro `SchedaWazaPage` (tier, chip taxonomy)
- [x] Madoshō browser tester — `MadoshoBrowser` + pool 55 waza PDF

## Server & domain
- [x] `packages/domain` — motore Skiru + combat v3 (Parte II core)
- [ ] API combattimento (opzionale): validazione CS/quarti
- [x] Seed skills/waza — `sync-waza-manual.ts` (**122** voci pool: 112 Dō + 10 Generiche · eseguire `bun run sync-waza-manual` in `apps/server`)
- [~] Tag catalog generato — `generate-waza-tag-catalog.ts` → **122** entry (112 Dō + 10 Generiche); rigenerare dopo ogni modifica pool
- [x] Seed waza Madoshō — `sync-madosho-manual.ts` (55 waza · `bun run sync-madosho-manual`)

---

# Capitoli citati ma assenti nel doc (da scrivere / chiedere)

| Capitolo | Dove citato | Note |
|----------|-------------|------|
| Jigo-Ka — l'Ego | §2.2 CS «Dichiarare l'accumulo» | 🔮 Regole accumulo narrativo |
| Parte III — Ambientazione | §1.1 intro | Nel doc attuale Parte III = Stili |
| Komonoire — waza complete | §4.3 | Solo lore + meccanica dado |
| Waza Generiche — batch completo | ROADMAP_CONTEXT | **10/40+** in pool; resto Movimento, Proiettili, Raggi, Coni, Scudi… |
| Spareggio — dettaglio completo | §2.3 | Estrarre regole esatte dal Word |

---

# Audit tecnico — Waza · Skiru · Effetti (Giugno 2026)

> Revisione stato reale del codice vs manuale. **Nessuna implementazione** — solo mappa lacune e drift.

## Inventario cataloghi

| Catalogo | Fonte authoring | Conteggio | DB sync | Automazione chat | Note |
|----------|-----------------|-----------|---------|------------------|------|
| **Dō** | `apps/tester/src/pools/*-waza-pool.ts` | **112** | `sync-waza-manual.ts` | ~15 waza avanzate (SB/K) | Keystone + Esagono OK |
| **Generiche** | `generiche-waza-pool.ts` | **10** | stesso sync | solo prosa Master | `[Rallentato]` OK; tag `[waza:…]` **fuori** catalogo generato |
| **Madoshō** | `madosho-waza-pool.ts` | **55** | `sync-madosho-manual.ts` | parziale (Hōgō, Shinryaku, Eden…) | Komonoire **0** waza |
| **Ordine** | `ordine-waza-pool.ts` | **0** | stesso sync | — | pool + acquisto Sentō Senshi |
| **Oni no Mori** | `onimori-waza-pool.ts` | **0** | stesso sync | — | pool vuoto, EXP senza Esagono |
| **Skiru** | `packages/domain/src/skiru/catalog.ts` | **41** | jsonb `skiru_sheet` | via IR (`waza-resolve`) | Tester `skiruPool.ts` **non allineato** (4 voci) |

**Pool totale waza:** `WAZA_POOL` = **122** (112 + 10). **Tag catalog generato:** **112** → drift da rigenerare.

## Come sono definiti gli effetti oggi (4 strati)

1. **Prosa nel pool** (`description` + `effect`) — ~90% delle waza; Master arbitra in chat.
2. **Preview numerica** — `waza-resolve.ts` (**20** `poolId` con formule IR/gittata/resistenza).
3. **Automazione chat** — `waza-chat-automation.ts` + moduli `packages/domain/src/styles/*` (~15 waza avanzate; ~25 tipi effetto server-side).
4. **Status engine** — `status/catalog.ts` (**17** status incluso `[Rallentato]`); separato dalle waza.

**Il DB (`skills`) non contiene logica eseguibile** — solo metadati acquisto/display. Comportamento = TypeScript hardcoded **oppure** narrativo.

## Lacune Waza (priorità contenuto)

| Area | Fatto | Manca |
|------|-------|-------|
| Generiche batch 1 | 6 passive + 4 accademia | Ippuku, Ukenagashi, Shukuchi, Chōyaku, Kaginawa, Nenwa, proiettili/raggi/coni/scudi/emanazione (~30 waza ROADMAP_CONTEXT) |
| Automazione avanzata | Tōshi, Shakkin, Kōmei, Nagori, Hōgō (parz.), Shinryaku contatto, Eden rigenera, Ippuku, status-on-hit generiche, Kyōshin, Komonoire dado/Debitore | Giurisdizione reclaim, Chokurei enforcement, Mugen dominion, Meisaku permanenza, Nagori gassoso/elementale/sonoro completo, passive generiche (Kajiba, Iai…) |
| Tag catalog | Dō 112 | Rigenerare con Generiche; aggiornare test `waza-tag-preview.test.ts` |
| Ordine / Oni | Classifier UI | Pool, sync, contenuto manuale |
| Komonoire | Status Debitore in engine | Waza pool + dado demoniaco + tag chat |

## Lacune Skiru

| Area | Stato |
|------|--------|
| Catalogo domain + albero UI | [x] 41 nodi, EXP, milestone Jiga / Sentō Senshi |
| Tester authoring | [~] `SkiruInsertionTool` scrive formato legacy, non `SKIRU_CATALOG` |
| Legacy F/C/D/M/E | [~] Colonne DB + `legacy-map.ts` + fallback calculator — da deprecare quando tutti i PG hanno `skiru_sheet` |
| Effetti Skiru ↔ waza | [~] Solo dove `waza-resolve` o status engine referenziano `skiruId`; nessun registry unificato |

## Drift / debito tecnico da risolvere

- [x] Rigenerare `waza-tag-catalog.generated.ts` (122 entry) + sync DB generiche *(catalogo OK; DB richiede `sync-waza-manual` con .env)*
- [x] Allineare test conteggio catalogo (112 → 122)
- [x] Unificare tester Skiru → domain catalog (`skiruPool.ts` adapter read-only)
- [ ] Tier waza: ancora **inferito da CS** in sync/generator; manuale chiede tier esplicito in authoring
- [ ] `WAZA_STATUS_APPLICABILI` (12 id tester) vs `status/catalog.ts` (17) — nessun link bidirezionale

---

# Proposta: Pannello Authoring Effetti

> Obiettivo: un unico posto (staff/tester) per creare waza, Madoshō, Skiru ed effetti simili, modificare modifier/status, e pubblicare verso DB + chat.

## Fattibilità: **sì, in fasi** — non tutto in un colpo solo

Il **70% del contenuto** resterà prosa-only (Principia Satirica: Master arbitra). Il pannello deve distinguere **3 livelli di automazione** per ogni voce:

| Livello | Cosa fa il software | Esempio |
|---------|---------------------|---------|
| **A — Catalogo** | Nome, famiglia, costi EXP/CS, tier, taxonomy, testo effetto | Shoken, waza Madoshō standard |
| **B — Preview** | Formule IR/gittata/resistenza in chat | Michishirube, Ubaiito |
| **C — Automazione** | Tag chat → mutazione stato/HP/CS/costrutti | Tōshi, Hōgō, Shinryaku |

Oggi A è in `WazaInsertionTool` (~2600 LOC), B/C sono sparsi in domain TS — **non c'è uno schema condiviso**.

## Architettura consigliata (incrementale)

### Fase 1 — Consolidare l’authoring esistente (basso rischio)
- Estendere `WazaInsertionTool` / `SkiruInsertionTool` per **leggere/scrivere** le fonti canoniche (`wazaPool`, `SKIRU_CATALOG`) invece del pool legacy Skiru.
- Aggiungere campo **`automationLevel: 'none' | 'preview' | 'full'`** + **`automationHookId?`** su `WazaDef`.
- Script **Publish** unico: `generate-waza-tag-catalog` → `sync-waza-manual` → `sync-madosho-manual` (npm script in `apps/server`).
- Tab famiglia Generiche / Ordine / Onimori nel tool (oggi solo export verso pool TS).

### Fase 2 — Registry effetti dichiarativi (medio rischio)
- Nuovo modulo `@domain/effects/registry.ts`:
  - **Status modifiers** — subset editabile di `StatusCombatModifiers` (già tipizzato).
  - **Chat effect kinds** — mappa `hookId` → handler esistente (wrappa codice attuale, non riscrivere).
  - **Waza preview resolvers** — registrazione per `poolId` (estende `WAZA_RESOLVERS`).
- UI pannello: form per modifier (+2 tier, −3 IR, `[Rallentato]`, block decay…) + selezione hook da lista chiusa.
- **Non** DSL completo al inizio — solo preset + parametri numerici.

### Fase 3 — Authoring Skiru + regole famiglia (medio rischio)
- Editor nodi Skiru collegato a `catalog.ts` (prerequisiti, branch, milestone).
- Profili acquisto per famiglia waza (Generiche / Dō / Madoshō / Ordine / Oni) — oggi sparsi in `characters.service` + `waza-catalog-family`.

### Fase 4 — Persistenza opzionale DB (alto rischio, futuro)
- Spostare catalogo da TS → DB solo se serve hotfix senza deploy.
- Richiede migration, versioning, e fallback al pool TS per CI/test.
- **Consiglio:** rimandare finché Fase 1–2 non stabilizzano il flusso publish.

## Cosa **non** conviene automatizzare subito

- Condizioni narrative complesse (Iai, Kajiba, passiva sigillata Hōgō stile).
- Meccaniche lignaggio intere (Gōkaon pressione, Hataori nodi, Ikiryō fiori) — restano moduli domain dedicati.
- Tier derivato da descrizione comanda (filosofia manuale).

## File chiave per il pannello futuro

| Ruolo | Path |
|-------|------|
| Authoring waza oggi | `apps/tester/src/WazaInsertionTool.tsx` |
| Authoring skiru oggi | `apps/tester/src/SkiruInsertionTool.tsx` |
| Status/modifier engine | `packages/domain/src/combat/status/` |
| Chat automation | `packages/domain/src/combat/waza-chat-automation.ts` |
| Preview IR | `packages/domain/src/combat/waza-resolve.ts` |
| Taxonomy tag | `packages/domain/src/combat/waza-taxonomy.ts` |
| Publish DB | `apps/server/scripts/sync-waza-manual.ts`, `sync-madosho-manual.ts`, `generate-waza-tag-catalog.ts` |

---

# Pulizia proposta (⚠️ attendere OK esplicito)

> **Giugno 2026 — eseguita parzialmente** (P1–P3). P4 ancora in attesa (legacy DB/stats).

| Priorità | Candidato | Stato |
|----------|-----------|-------|
| P1 | Tag catalog stale | [x] Rigenerato a 122; test aggiornati |
| P1 | Test conteggio 112 | [x] `waza-tag-preview.test.ts` → 122 |
| P2 | `seed-passive-waza.ts` | [x] Rimosso |
| P2 | `seed-skills.ts` | [x] Stub deprecato + script `publish-waza-catalog` |
| P2 | `apps/tester/dist/` | [x] Rimosso + `.gitignore` |
| P3 | Tester Skiru legacy | [x] Adapter domain; serialize read-only |
| P3 | `ANALISI_WAZA.md` | [x] Rimosso |
| P3 | `pattiPool.ts` vuoto | [ ] Mantenuto (authoring Patti futuro) |
| P4 | Colonna `gems`, stats F/C/D/M/E | [ ] Dopo migration PG completa |
| P4 | `DICE_SPEC.md`, fallback CALCOLI | [ ] Documentazione — deprecare a parte |

---

# Note di manutenzione

- Quando aggiorni una regola nel manuale Word, modifica la riga corrispondente qui e la spec in `packages/domain`.
- Quando un capitolo è `[x]`, indica in commit/PR: `MECHANICS_ROADMAP §X.Y`.
- Per domande di bilanciamento usa `apps/tester` **dopo** che il motore Parte II è allineato.

## Diario integrazione (Cursor)

| Data | Area | Fatto |
|------|------|-------|
| Giugno 2026 | Scheda client | Skiru editor, Waza tier, create-character, legacy collassato |
| Giugno 2026 | Tester/chat | `combatSimulator` v3, tag chat, migrazione skiru_sheet, seed rank |
| Giugno 2026 | Leveling §2.11 | `@domain/progression`, banner Skiru, tabella manuale 1–15 |
| Giugno 2026 | Chat UI | `QuarterTurnHud` + shop REM/EXP banner |
| Giugno 2026 | API pubblica | `GET /:id/public` senza stats legacy |
| Giugno 2026 | Skiru & Waza | Finestra unificata EXP; Gems UI rimosse; Market solo REM |
| Giugno 2026 | Parte III Waza | Catalogo allineato a `Oyasumi_Manuale_Completo.pdf`; keystone; `WazaDoBrowser` Dark Arcane |
| Giugno 2026 | Chat tag waza | `[waza:Nome]` → tier·CS inline + tooltip IR; helper inserimento con preview |
| Giugno 2026 | Tester authoring | WazaInsertionTool: tier §2.10 da CS, chip consistenza/categoria §2.5 |
| Giugno 2026 | Generiche + status | Pool 10 waza, `[Rallentato]`, acquisto senza Esagono, semi-auto Hōgō/Shinryaku/Eden |
| Giugno 2026 | Audit Waza/Skiru | Sezione «Audit tecnico» + proposta pannello authoring effetti + pulizia proposta |
| Giugno 2026 | Pulizia P1–P3 | Tag catalog 122, script seed deprecati, dist rimosso, Skiru adapter domain, ANALISI_WAZA rimosso |
| Giugno 2026 | Richieste PG | Tab scheda (fuoco) + Gestione → Richieste; Madoshō/Ordine/Premi approvati staff |
| Luglio 2026 | Sōkaiju + lancio waza | Tab scheda, `sokaiju-combat.ts`, Kongen/Gojū/Shōdō/Eiga in chat, `WazaLaunchPanel`, `/waza`, `[hit:1]` danno |
| Luglio 2026 | Mobile Cursor | `AGENTS.md`, `.cursor/environment.json`, worker My Machines |
