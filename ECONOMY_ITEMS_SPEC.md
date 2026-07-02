# Economia oggetti — Drop, Inventario, Smantellamento, Mercato

> **Stato:** design lock (Luglio 2026) · domain `@domain/economy`  
> **Contesto:** play-by-chat asincrono; junklist in `economy/junklist.ts` (condivisa con Shakai Kaikyū)

I quattro sistemi formano un anello: **drop** → junk → **smantellamento** (solo Artigiano) → **materiali** → **craft** → **oggetti** → **mercato** → commissione esce dal sistema.

**Rubinetto valuta:** login (~30 Rem/giorno) + ricompense Master. **Scarico:** commissione Piazza (10%) + acquisti al Banco (spread 1:3).

---

## 1) Drop in chat

**Chi genera:** solo Master/moderazione, mai i giocatori. Ricompensa materiale di scena (esplorazione, combattimento, ricerca).

### Comandi chat

| Comando | Effetto |
|---------|---------|
| `/drop @giocatore [oggetto] xN` | Messaggio-evento in chat + oggetti in inventario destinatario |
| `/drop @gruppo [tabella]` | Estrae da tabella predefinita per ogni membro del gruppo |
| `/prendi [oggetto]` | In modalità *a terra*: raccoglie da contenitore scena (primo arrivato) |

**Messaggio-evento (es.):** *"Kaede trova: Abiti del vecchio mondo ×2, Flaconi scaduti ×1"*

### Modalità *a terra*

Il Master può lasciare il loot in un contenitore condiviso della scena; i PG usano `/prendi`. Utile per micro-dinamiche di gruppo senza assegnazione manuale.

### Tabelle di drop

Richiamo per contesto — il sistema estrae con pesi fissi (nessun tiro visibile ai giocatori):

| Id tabella | Contenuto |
|------------|-----------|
| `rovine_urbane` | Junk metallo / stoffa / carta / chimica |
| `onimori` | Junk comune + probabilità bassa Frammento onirico |
| `creatura_kyofu` | Materiali creatura + eventuale Frammento |
| `bottino_umano` | Oggetti finiti, junk, Rem |

**Pesi esempio `rovine_urbane`:** 40% metallo, 30% stoffa, 20% carta, 10% chimica.

### Anti-farming

- Drop da **tabella:** max **N volte/giornata reale** per giocatore (da tarare, es. **3**)
- Drop **manuale** Master: nessun limite (giudizio narrativo)

---

## 2) Oggetti

Ogni oggetto è una scheda con campi fissi:

| Campo | Descrizione |
|-------|-------------|
| **Nome** | es. "Arma bianca forgiata" |
| **Categoria** | Junk · Materiale · Consumabile · Equipaggiamento · Costrutto materiale · Oggetto di trama |
| **Integrità** | attuale/massima (solo Equipaggiamento e Costrutti) |
| **Effetto** | testo breve + valori piatti (es. "Scudo 4") |
| **Slot** | slot inventario occupati (default 1) |
| **Origine** | craftato / droppato / comprato — tracciato per moderazione |
| **Firma** | se craftato: nome creatore (reputazione / leva prezzo in Piazza) |

### Categorie

| Categoria | Comportamento |
|-----------|---------------|
| **Junk** | Nessun effetto. Vendita (poco) o smantellamento (**solo Artigiano**) |
| **Materiale** | Componente ricette. Non equipaggiabile |
| **Consumabile** | Un uso e sparisce (preparati, Ofuda, cibo Itamae). **Nessuna scadenza a tempo** |
| **Equipaggiamento** | Indossa/impugna, Integrità, riparabile. A 0 = *rotto* (inutilizzabile, non distrutto) |
| **Costrutto materiale** | Trappole, allarmi sul campo; Integrità = Resistenza |
| **Oggetto di trama** | Solo moderazione; non vendibile né smantellabile |

### Inventario

- **5 slot corporei** default, estendibili con zaino e appartamento (struttura esistente)
- Oltre capienza: `/prendi` e pickup **bloccati**

### Usura

Integrità cala solo per **eventi Master** (colpo critico, uso estremo, scena) — **nessun decadimento automatico** nel tempo.

---

## 3) Smantellamento

**Regola unica: solo `#Artigiano` smantella.** Qualsiasi sottoclasse dal keystone Minarai Shokunin in su — funzione base del keystone.

### Flusso tool

1. Artigiano seleziona Junk (o Equipaggiamento **rotto**) dal proprio inventario
2. *Smantella* → consuma oggetto, accredita materiali

| Tipo oggetto | Resa |
|--------------|------|
| **Junk** | Resa fissa da junklist (nessuna casualità) |
| **Equipaggiamento rotto** | **50%** materiali ricetta costruzione (arrotondato per difetto). Es. arma 3 Rottami + 1 Legno → 1 Rottame + 0 Legno |

### Limiti

- **Non** consuma budget giornaliero Integrità (riparazione/costruzione)
- Tetto proprio: **max 10 oggetti smantellati/giorno** per artigiano (anti riciclo industriale)

### Economia sociale

Junk degli altri PG → vendere al Banco (poco Rem) **oppure** portarla all'Artigiano. Interdipendenza voluta per PbC.

---

## 4) Mercato e vendita

### A. Il Banco (NPC, mercato di sistema)

- **Compra** qualsiasi cosa a prezzo fisso basso (valvola di sfogo junk)
- **Vende** solo listino base: materiali **comuni** (Stoffa, Legno, Rottame, Carta, Erba comune) a prezzo maggiorato
- **Mai** vende rari (Erba rara, Frammento onirico, Componente fine — solo da gioco)

| Voce | Banco compra | Banco vende |
|------|--------------|-------------|
| Junk (qualsiasi) | 2 Rem | — |
| Materiale comune | 5 Rem | 15 Rem |
| Materiale raro | 20 Rem | — |
| Consumabile craftato | 10 Rem | — |
| Equipaggiamento integro | 25 Rem | — |

Rapporto **1:3** sui comuni: comprare al Banco sempre possibile ma antieconomico → commercio PG-PG.

### B. La Piazza (tra giocatori)

- **Inserzioni:** oggetto + prezzo Rem (o baratto oggetto↔oggetto)
- Oggetto inserito **impegnato** nello slot fino a vendita
- Accettazione → scambio automatico + evento canale-bacheca pubblico
- **Commissione 10%** sui Rem (assorbe valuta, anti lavaggio)
- Max **5 inserzioni attive** (estendibile con appartamento)

### Regole trasversali

- Oggetti di trama: non vendibili / non inseribili
- Oggetti **firmati**: firma visibile in inserzione (reputazione = leva prezzo naturale)
- Moderazione: pannello calmieramento prezzi Banco se economia sbanda

---

## Junklist condivisa

Vedi `packages/domain/src/economy/junklist.ts`. Tutte le voci sono **Junk**; solo Artigiano smantella (nessuna eccezione per Medico/Cacciatore/Sacerdote).

---

## Da tarare insieme

| Parametro | Proposta iniziale |
|-----------|-------------------|
| Prezzi Banco | Tabella §4 (tarare su economia 30 Rem/login) |
| Tetto drop tabella/giorno | **3** per PG |
| Scadenza consumabili | **No** (gestione asincrona troppo pesante) |

---

## Ordine implementazione consigliato

1. **Oggetti** — schema DB + categorie + Integrità/Firma/Origine — **Fase 1 in corso** (`ITEMS_IMPLEMENTATION_SPEC.md`)
2. **Drop in chat** — comandi `/drop`, `/prendi`, tabelle, anti-farming
3. **Smantellamento** — tool Artigiano + junklist + resa 50% rotti
4. **Mercato** — Banco + Piazza + commissione

---

## Riferimenti incrociati

- Shakai Kaikyū craft: `SHAKAI_KAIKYU_TOOLS_BLUEPRINTS.md`
- Inventario esistente: `apps/server/src/db/schema.ts` (`items`, `inventory`)
- Domain: `packages/domain/src/economy/`
