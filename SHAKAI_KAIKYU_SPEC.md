# Shakai Kaikyū (社会階級) — Classi Sociali

> **Stato:** spec di design (Giugno 2026) — catalogo domain in `packages/domain/src/shakai-kaikyu/`  
> **Codice attuale:** le 5 classi esistono come voci Skiru in `SKIRU_CATALOG` (`ishi`, `shokunin`, …) senza tool, tag o sottoclassi.

---

## Regole globali

1. **Una classe per personaggio** — scelta unica; non si può cambiare senza intervento manuale della moderazione.
2. **Tag invisibile** — alla scelta viene assegnato un tag interno che filtra blueprint e sblocca la tool dedicata:

| Classe | id Skiru | Tag invisibile | Tool |
|--------|----------|----------------|------|
| Ishi — Medico | `ishi` | `#Medico` | Cura + preparati |
| Shokunin — Artigiano | `shokunin` | `#Artigiano` | Riparazione/costruzione + Costrutti materiali |
| Ryōshi — Cacciatore | `ryoshi` | `#Cacciatore` | Tracciamento/caccia + raccolta |
| Seijika — Politico | `seijika` | `#Politico` | Patti + richiamo favori |
| Shisai — Sacerdote | `shisai` | `#Sacerdote` | Ofuda + interpretazione |

3. **Sottoclassi** — albero di progressione **per classe** (non misto tra classi), **sistema parallelo** al ramo Skiru. Costi in **XP** (`experienceSpendable` condiviso con Skiru/Waza), non EXP Skiru.
4. **Capstone** — richiede **keystone + esattamente un sentiero** (10 XP; **un solo sentiero** sbloccabile per classe) prima dell’acquisto (20 XP).
5. **Blueprint** — ricette/progetti/tracce/riti filtrati dal tag classe (`#Medico`, …).

---

## Albero sottoclassi (schema comune)

```
Keystone (5 XP)
    ├── Sentiero A (10 XP)
    ├── Sentiero B (10 XP)
    └── Sentiero C (10 XP)
            ↓
    Capstone (20 XP)  ← richiede Keystone + 1 Sentiero
```

---

## Ishi — Medico (`#Medico`)

**Tool:** curare giocatori; creare preparati (medicinali, veleni, droghe).

| id | Romaji (Kanji) — Italiano | XP | Ruolo |
|----|---------------------------|-----|-------|
| `ishi-minarai` | Minarai (見習い) — L'Apprendista | 5 | **Keystone** — max **15 HP/giorno** (ferite d'entità lieve, sutura); analgesici lievi, sedativi, rimedi base |
| `ishi-gekai` | Gekai (外科医) — Il Bisturi Silenzioso | 10 | **30 HP/giorno**; operazioni difficili, trapianti; ampia mole di medicinali |
| `ishi-yakushi` | Yakushi (薬師) — Il Guardiano delle Radici | 10 | **20 HP/giorno**; metodi rudimentali; droghe, medicinali, veleni |
| `ishi-itamae` | Itamae (板前) — Il Cuoco dei Rimedi | 10 | **15 HP/giorno**; piatti con benefici straordinari |
| `ishi-iryo-no-oni` | Iryō no Oni (医療の鬼) — L'Ogre della Cura | 20 | **Capstone** — **30 HP/giorno**; tutti i metodi; prereq: `ishi-minarai` + un sentiero |

**Blueprint da sistema:** ricette medico (`#Medico`).

---

## Shokunin — Artigiano (`#Artigiano`)

**Tool:** riparare/costruire oggetti ed equipaggiamento; forgiare **Costrutti materiali** (non magici).

| id | Romaji (Kanji) — Italiano | XP | Ruolo |
|----|---------------------------|-----|-------|
| `shokunin-minarai` | Minarai Shokunin (見習い職人) — L'Apprendista di Bottega | 5 | **Keystone** — max **15 Integrità/giorno** (utensili, vestiti, meccanismi semplici); materiali comuni |
| `shokunin-kajishi` | Kajishi (鍛冶師) — Il Signore della Forgia | 10 | **30 Integrità/giorno**; armi, armature, metalli pesanti, leghe rare |
| `shokunin-karakurishi` | Karakurishi (絡繰師) — Il Tessitore di Meccanismi | 10 | **20 Integrità/giorno**; macchinari, trappole, dispositivi complessi |
| `shokunin-tsukuroibito` | Tsukuroibito (繕い人) — Il Rammendatore di Cose Perdute | 10 | **15 Integrità/giorno**; recupero oggetti antichi/rotti/rari |
| `shokunin-hyakushu` | Hyakushu no Meishō (百手の名匠) — Il Maestro dalle Cento Mani | 20 | **Capstone** — **30 Integrità/giorno**; tutti i metodi; prereq: keystone + un sentiero |

**Blueprint da sistema:** progetti artigiano (`#Artigiano`).

---

## Ryōshi — Cacciatore (`#Cacciatore`)

**Tool:** tracciare e cacciare prede; raccogliere risorse; orientarsi in ambienti ostili.

| id | Romaji (Kanji) — Italiano | XP | Ruolo |
|----|---------------------------|-----|-------|
| `ryoshi-michishirube` | Michishirube no Karyūdo (道標の狩人) — Il Cacciatore dei Primi Passi | 5 | **Keystone** — max **15 Raccolta/giorno**; prede minori; zone conosciute senza rischio |
| `ryoshi-koya` | Kōya no Ryōshi (荒野の猟師) — Il Predone della Landa | 10 | **30 Raccolta/giorno**; grossa selvaggina; agguati e abbattimenti rapidi |
| `ryoshi-sasurai` | Sasurai no Michishirube (さすらいの道標) — Il Nomade degli Onimori | 10 | **20 Raccolta/giorno**; orientamento in territori corrotti/instabili |
| `ryoshi-michimori` | Michimori (道守) — Il Guardiano dei Sentieri | 10 | **15 Raccolta/giorno**; trappole; percorsi sicuri per sé e altri |
| `ryoshi-ryokon` | Ryōkon no Nushi (猟魂の主) — Lo Spirito della Caccia | 20 | **Capstone** — **30 Raccolta/giorno**; tutti i metodi; prereq: keystone + un sentiero |

**Blueprint da sistema:** tracce e prede (`#Cacciatore`).

---

## Seijika — Politico (`#Politico`)

**Tool:** stringere e gestire **Patti**; richiamare favori (aiuto, informazioni, protezione).

| id | Romaji (Kanji) — Italiano | XP | Ruolo |
|----|---------------------------|-----|-------|
| `seijika-kojin` | Kojin (口人) — La Prima Parola | 5 | **Keystone** — Patti **Peso ≤2**, max **2 attivi**; leve minori, favori tra individui |
| `seijika-meishi` | Meishi (盟士) — Il Sigillo d'Alleanza | 10 | Peso **≤4**, max **4 attivi**; leva **formale** (Ordini, trattative ufficiali) — **0 efficacia in contesti informali** |
| `seijika-senseki` | Senseki (煽石) — La Pietra che Smuove | 10 | Peso **≤3**, max **3 attivi**; leva **popolare** (folle, dicerie) — effetto **ritardato nel tempo** |
| `seijika-kagenui` | Kagenui (影縫) — Il Cucitore d'Ombre | 10 | Peso **≤2**, max **5 attivi**; leva **sotterranea** — punta alla **quantità** di relazioni |
| `seijika-kuromaku` | Kuromaku (黒幕) — Il Burattinaio | 20 | **Capstone** — Peso **≤4**, max **5 attivi**; qualsiasi leva; **rischio esposizione** se cambia registro (formale/popolare/sotterraneo) nella stessa giornata — Patto può saltare o ritorsione (Master) |

**Blueprint da sistema:** leve e modelli di Patto (`#Politico`).

---

## Shisai — Sacerdote (`#Sacerdote`)

**Tool:** fabbricare **Ofuda** (talismani rituali) con Rito; interpretare sogni, presagi, energie nascoste.

| id | Romaji (Kanji) — Italiano | XP | Ruolo |
|----|---------------------------|-----|-------|
| `shisai-minarai-miko` | Minarai no Miko (見習いの巫) — L'Apprendista del Santuario | 5 | **Keystone** — Ofuda **Potere ≤2**, max **2 attivi**; riti semplici (protezione, conforto, letture minori) |
| `shisai-jareiba` | Jareiba (邪霊祓) — Il Cacciatore di Ombre | 10 | Potere **≤4**, max **4 attivi**; purificazione/esorcismo onirico — **solo in luogo consacrato** (0 Ofuda altrove) |
| `shisai-yumetoki` | Yumetoki (夢解き) — Il Lettore di Sogni | 10 | Potere **≤3**, max **3 attivi**; lettura sogni/presagi — **ovunque**, ma **doppio tempo** per Ofuda |
| `shisai-denshosha` | Denshōsha (伝承者) — Il Custode dei Riti Antichi | 10 | Potere **≤2**, max **5 attivi**; quantità di talismani, non potenza singola |
| `shisai-koku-no-koe` | Kokū no Koe (虚空の声) — La Voce del Vuoto | 20 | **Capstone** — Potere **≤4**, max **5 attivi**; qualsiasi Rito; **usura spirituale** (CS o piccola quota vitalità) se cambia registro rituale nella stessa giornata |

**Blueprint da sistema:** riti e Ofuda (`#Sacerdote`).

---

## Note nomenclatura (kanji)

Alcuni nomi sottoclasse usano **kanji composti** per coerenza semantica (es. Karakurishi 絡繰師, Michimori 道守, Kojin 口人, Senseki 煽石) — non sempre termini attestati. Verifica finale prima del manuale definitivo.

---

## Note implementative (per dopo)

### Separazione da Skiru «normale»

Le 5 classi in `SKIRU_CATALOG` (`ishi`…`shisai`) sono **solo gate di acquisizione** (max **1** punto ciascuna, non potenziabili 0–10). Servono a **sbloccare la classe** e la tool; **non** rappresentano maestria professionale.

- **Classe (Skiru)** = scelta unica tra le 5 (mutuamente esclusive) — 1 punto = classe attiva + tag + tool
- **Sottoclassi** = albero XP dedicato parallelo (5 / 10 / 20), con prerequisiti — **non** passano dal ramo Skiru

**Dati PG:**

```ts
socialClass: 'ishi' | 'shokunin' | 'ryoshi' | 'seijika' | 'shisai' | null
socialSubclassUnlocked: string[]  // id sottoclassi acquistate
socialDailyBudget: { ... }        // HP curati, integrità, raccolta, ecc. — reset 00:00 UTC
```

`socialClass` può derivare dal nodo Skiru a 1 pt (o essere campo dedicato sincronizzato in migrazione).

### Componenti da costruire

| Layer | File / area suggerita |
|-------|------------------------|
| Catalogo sottoclassi | `packages/domain/src/shakai-kaikyu/catalog.ts` ✅ |
| Validazione XP / prerequisiti | `packages/domain/src/shakai-kaikyu/progression.ts` ✅ |
| Tag blueprint | estendere sistema blueprint con `requiredTag: '#Medico'` |
| API scelta classe | `PATCH /characters/me/social-class` (moderazione per cambio) |
| Tool UI | 5 pannelli dashboard (`MedicoTool`, `ArtigianoTool`, …) |
| Budget giornaliero | tabella o jsonb su `characters` + tick/reset |

### Riferimenti incrociati

- Skiru ramo `shakai-kaikyu` — `packages/domain/src/skiru/catalog.ts`
- EXP spendibile — già su personaggio (`expSpendable`)
- Costrutti materiali (Artigiano) vs magici (Sōkaiju/Genkai) — `field-constructs.ts`, `SHAKAI_KAIKYU` vs `genkai`

---

## Piano di implementazione (step)

> Stato globale: **Fase 0–1 parziali** (spec + catalogo domain). Resto da fare.

### Fase 0 — Decisioni di design

- [x] Spec regole (classe unica, tag, albero sottoclassi, limiti giornalieri)
- [x] Catalogo 5 classi + 25 sottoclassi in `@domain/shakai-kaikyu`
- [x] **D0.1** — Skiru `ishi`…`shisai`: **solo gate classe** (max 1 pt, non potenziabili); sottoclassi = sistema parallelo XP
- [x] **D0.2** — XP sottoclassi = **`experienceSpendable`** condiviso (opzione A)
- [x] **D0.3** — Reset budget giornaliero: **00:00 UTC** con tick REM (opzione A)
- [x] **D0.4** — Capstone: **un solo sentiero** (10 XP) prima del 20 XP
- [x] **D0.5** — Artigiano costrutti: **ibrido (D)** — trappole/piccoli = item inventario; strutture grandi = entità campo **separate** da Genkai (`field_constructs`)
- [x] **D0.6** — Politico: **nessun materiale** (Patti in gioco); junklist opzionale «Oggetto di valore» rimandata

### Fase 1 — Modello dati (DB)

- [ ] **1.1** — Colonna `social_class` su `characters` (`ishi` | … | `null`)
- [ ] **1.2** — Jsonb `social_subclass_sheet` (id sottoclasse → `true`)
- [ ] **1.3** — Jsonb `social_daily_usage` (cura HP, integrità, raccolta, … + `resetAt`)
- [ ] **1.4** — Migrazione: PG con punti Skiru su una classe → promuovere a `social_class`?
- [ ] **1.5** — Tag invisibile derivato da `social_class` (non salvato in chiaro in DB se si ricava sempre)

### Fase 2 — Domain

- [x] **2.1** — `catalog.ts` — classi, sottoclassi, limiti numerici
- [x] **2.2** — `progression.ts` — `canUnlockSocialSubclass()`, `resolveDailyLimitFromSubclasses()`
- [ ] **2.3** — `assignSocialClass()` — validazione scelta unica
- [ ] **2.4** — `unlockSocialSubclass()` — spesa XP + prerequisiti
- [ ] **2.5** — `consumeSocialDailyBudget()` / `getRemainingDailyBudget()` per classe
- [ ] **2.6** — `getActiveSocialClassTag()` per filtro blueprint
- [ ] **2.7** — Test unitari progression + budget

### Fase 3 — API server

- [ ] **3.1** — `GET /characters/me` espone `socialClass`, sottoclassi, budget residuo
- [ ] **3.2** — `POST /characters/me/social-class` — scelta iniziale (irreversibile lato client)
- [ ] **3.3** — `PATCH /characters/me/social-subclass` — sblocco sottoclasse (spesa XP)
- [ ] **3.4** — Endpoint moderazione — cambio classe / reset sottoclassi (staff only)
- [ ] **3.5** — Validazione anti-cheat allineata a `validateSkiruSheet`
- [ ] **3.6** — `GET /characters/:id/public` — **non** espone `socialClass` (decisione: No)

### Fase 4 — UI scelta classe

- [ ] **4.1** — Flusso onboarding o scheda: scelta una tantum tra 5 classi (con conferma)
- [ ] **4.2** — Blocco re-scelta in UI; messaggio «contatta moderazione»
- [ ] **4.3** — Ramo Skiru Shakai Kaikyū: mostra classe attiva, non 5 nodi paralleli investibili
- [ ] **4.4** — Albero sottoclassi in scheda (keystone → sentieri → capstone) con costi XP

### Fase 5 — Tool dedicate (dashboard)

> **UX e blueprint:** [`SHAKAI_KAIKYU_TOOLS_BLUEPRINTS.md`](./SHAKAI_KAIKYU_TOOLS_BLUEPRINTS.md) · catalogo domain `blueprint-catalog.ts`, `materials.ts`, `tool-ux.ts`

Ordine suggerito: **Medico → Artigiano → Cacciatore → Politico → Sacerdote**.

| Step | Tool | Funzioni minime |
|------|------|-----------------|
| **5.1** | `#Medico` | Curare PG (target, HP, budget giornaliero); log azioni in chat |
| **5.2** | `#Medico` | Creare preparato da blueprint ricetta; inventario output |
| **5.3** | `#Artigiano` | Riparare oggetto (integrità, budget); log |
| **5.4** | `#Artigiano` | Costruire da blueprint progetto; Costrutti **materiali** |
| **5.5** | `#Cacciatore` | Traccia/preda (da blueprint); raccolta unità (budget) |
| **5.6** | `#Politico` | Creare/gestire Patto (peso, attivi max); richiamo favore |
| **5.7** | `#Sacerdote` | Fabbricare Ofuda (potere, attivi max, vincoli sentiero) |
| **5.8** | Tutte | Pannello accessibile solo se `socialClass` corrisponde |
| **5.9** | Tutte | Entry in dock / tab scheda con icona classe |

### Fase 6 — Blueprint per tag

- [ ] **6.1** — Schema blueprint DB/API: `requiredTag` + id da `SOCIAL_BLUEPRINTS`
- [x] **6.2** — Seed ricette medico — design in `blueprint-catalog.ts`
- [x] **6.3** — Seed progetti artigiano — design in `blueprint-catalog.ts`
- [x] **6.4** — Seed tracce/prede cacciatore — design in `blueprint-catalog.ts`
- [x] **6.5** — Seed modelli Patto politico — design in `blueprint-catalog.ts`
- [x] **6.6** — Seed riti Ofuda sacerdote — design in `blueprint-catalog.ts`
- [ ] **6.7** — API lista blueprint filtrata per tag classe PG

### Fase 7 — Integrazione sistemi esistenti

- [ ] **7.1** — Cura medico → `combat-hp` / HP personaggio
- [ ] **7.2** — Artigiano materiali vs `field-constructs` + `genkai` (magici) — regole distinte
- [ ] **7.3** — Inventario: oggetti prodotti da preparati/progetti
- [ ] **7.4** — Patti politico: persistenza + scadenza + effetti narrativi (log chat)
- [ ] **7.5** — Ofuda: entità attive sul PG (come status? item? jsonb?)
- [ ] **7.6** — Daily tick REM: opzionale reset budget sociale nello stesso job
- [ ] **7.7** — Tester / sandbox per simulare tool classe

### Fase 8 — Moderazione & staff

- [ ] **8.1** — Gestione: cambio classe, reset sottoclassi, override budget
- [ ] **8.2** — Audit log azioni tool (cura, patto, ofuda, …)

### Fase 9 — Documentazione & allineamento

- [ ] **9.1** — Allineare `SKIRU_CATALOG` descrizioni classi con tool
- [ ] **9.2** — `MECHANICS_ROADMAP.md` §2.7 aggiornato a ogni milestone
- [ ] **9.3** — Guida giocatore in `ChatInfoPanel` o Guida — cosa fa ogni classe
- [ ] **9.4** — Copy onboarding classe sociale

---

## Decisioni registrate (Fase 0)

| # | Domanda | Decisione |
|---|---------|-----------|
| **Q1** | Relazione **classe** vs **punti Skiru** su `ishi`…`shisai` | **C (variante):** punti Skiru servono **solo ad acquisire** la classe (max 1, non potenziabili); sottoclassi = **sistema parallelo** XP |
| **Q2** | **Valuta** sottoclassi (5 / 10 / 20 XP) | **A)** `experienceSpendable` condiviso |
| **Q3** | **Più sentieri** (10 XP) sulla stessa classe | **Un solo sentiero** sbloccabile |
| **Q4** | **Reset giornaliero** limiti | **A)** 00:00 UTC con stipendio REM |
| **Q5** | **Visibilità** classe agli altri PG | **D→3.6:** macro-classe visibile **solo al proprio PG** in scheda; **non** in profilo pubblico; sottoclassi sempre nascoste agli altri |
| **Q6** | **Costrutti materiali** (Artigiano) | **D)** ibrido: piccoli = item; grandi = entità campo separate da Genkai |
| **Q7** | **Patti** (Politico) | **C)** solo narrativa — log chat + note Master; **zero automazione** DB |
| **Q8** | **Ofuda** (Sacerdote) | **D)** item in inventario → attivazione crea **buff temporaneo** |
| **Q9** | **Trade-off** sentieri | **C)** limiti numerici hard; penalità narrative = suggerimento tool, **Master conferma** |
| **Q10** | **Capstone** «tutti i metodi» | Capstone sblocca tutti i blueprint craft/gather della classe + limiti al massimo |
| **Q11** | **Prima classe** | **C)** gate Skiru 1 pt; feature **opzionale** — PG può ignorare classe sociale (`social_class` null, niente tool) |
| **Q12** | **Blueprint** contenuto | Seed da `SHAKAI_KAIKYU_TOOLS_BLUEPRINTS.md` + `blueprint-catalog.ts` |
| **1.4** | Migrazione PG esistenti | **B)** solo nuovi PG / scelta esplicita UI; nessun auto-promote |
| **1.5** | Tag `#Medico` in DB | **A)** derivato da `social_class`, mai salvato |
| **3.6** | Classe in profilo pubblico | **No** — `GET /characters/:id/public` **non** espone `socialClass` |
| **I1** | Cura Medico | **A)** applicazione HP **automatica** dal tool (entro budget) |
| **I2** | Log azioni tool in chat | **B)** **nessun** messaggio automatico; solo narrativa PG/Master; la tool aggiorna solo dati |
| **I3** | Scadenza Patti | **A)** solo narrativa; nessuna scadenza automatica |
| **I4** | Gate smantellamento | **A)** Skiru `shokunin ≥ 1` (fino a `social_class` DB) |

## Domande aperte

*Tutte le decisioni Fase 0 / economia E1–E8 sono chiuse (Luglio 2026).*

---

## Checklist roadmap

Vedi `MECHANICS_ROADMAP.md` § Shakai Kaikyū — sottosezione completa con fasi 0–9.
