# OYASUMI · Specifica — Tulpa Shinigami (vista Master)
### Documento di riferimento per l'implementazione · da dare a Claude Code

> **Cos'è.** La Tulpa Shinigami è il pannello di combattimento del master — un centro di comando privato, ordinato, completo. Affianca la narrazione: tutto ciò che il master fa qui NON compare in chat automaticamente. È lui che scrive nel masterscreen cosa succede. Il pannello è il suo reminder privato e strumento di controllo.
>
> **Principio-guida:** deve essere potente ma non caotico. Il master tiene tutto sotto controllo senza impazzire. Priorità: leggibilità immediata, azioni rapide, nessun click inutile.

---

## 0. STRUTTURA GENERALE — il centro di comando

La Tulpa Shinigami è una finestra estendibile/riducibile (come il pannello giocatore), agganciata al doc di giocata. Si divide in **tre colonne** (o sezioni navigabili su mobile):

```
┌─────────────────┬──────────────────┬─────────────────┐
│   COLONNA A     │    COLONNA B     │    COLONNA C    │
│  PG del party   │  PNG sul campo   │  Strumenti      │
│  (live)         │  (attivi)        │  Albo / Bestia  │
└─────────────────┴──────────────────┴─────────────────┘
```

Su mobile: tab A / B / C nella stessa finestra.

---

## 1. COLONNA A — I Personaggi Giocanti (live)

Per ogni PG nella stanza, il master vede una **card compatta** con:
- Nome + avatar
- **HP** (barra + X/max) — modificabile dal master (+/− o input diretto)
- **CS/Chronostack** — modificabile
- **Status attivi** (badge a stack) — aggiungibili/rimovibili
- **Meccaniche di stile** (Kaden, Pressione, Tensione, ecc.) — stack modificabili
- **Costrutti in campo** del PG (mini-lista, con HP/Resistenza residua)
- **Schivata / Parata** (valori calcolati, visibili)

**Azioni rapide per ogni PG (click singolo):**
- `+HP` / `−HP` (con campo valore)
- `+CS` / `−CS`
- `+ Status` (menu degli status seedati) con valore stack
- `− Status` (rimuovi uno status o riduci stack)
- `+ Stack meccanica` / `− Stack meccanica` (per Pressione, Kaden, Tensione, ecc.)
- `Modifica costrutto` (apre mini-panel del costrutto: cambia HP, sticker, trasferisci controllo)

**Visibilità real-time:** ogni modifica fatta dal master si riflette immediatamente sul pannello del giocatore (il giocatore vede il cambio in tempo reale). Il master poi scrive in chat cosa è successo.

---

## 2. COLONNA B — PNG Attivi sul Campo

Lista dei PNG attualmente in scontro. Ogni PNG ha una **card** con:
- Nome + tipo (Umano / Kyōfu / Kizu / Holic / Boss / Mob)
- **HP** (barra + X/max)
- **CS** (se pertinente)
- **IR attacco** (indice di riuscita all'attacco)
- **IR difesa** (schivata/parata)
- **Tier** (indica la fascia di potere)
- **Status attivi** — modificabili
- **Waza/attacchi disponibili** (lista semplice, il master sceglie cosa usare)
- **Note libere** (campo testo per il master)
- Pulsante **Rimuovi dal campo** (fine scontro o PNG sconfitto)
- Pulsante **Salva in Albo** (opzionale — salva il PNG per riuso futuro)

**Azioni rapide per ogni PNG:** identiche a quelle dei PG (HP, CS, status, stack).

**Come arriva un PNG in Colonna B:**
1. Creato al volo (Colonna C → Creazione rapida)
2. Dall'Albo PNG (Colonna C → Albo)
3. Dal Bestiario (Colonna C → Bestiario)
→ In tutti i casi, appare in Colonna B come PNG "attivo sul campo".

---

## 3. COLONNA C — Strumenti

Tre tab interni: **Creazione** · **Albo** · **Bestiario**

### 3A. Creazione PNG

**Creazione manuale:**
- Nome, tipo, note
- Parametri: HP, CS, IR attacco, IR difesa, Tier (1-5)
- Waza/attacchi (lista libera, testo)
- Pulsante **Aggiungi al campo** (va in Colonna B)
- Pulsante **Salva in Albo** (opzionale)

**Creazione randomica (per tier):**
Il master sceglie il **Tier** (1-5) e preme "Randomizza". Il sistema genera automaticamente parametri plausibili basati sulla fascia:

| Tier | Fascia livello PG | HP range | IR range | CS range |
|---|---|---|---|---|
| T1 | lv 5-15 | 30-60 | 3-5 | 5-10 |
| T2 | lv 16-20 | 61-100 | 5-7 | 8-14 |
| T3 | lv 21-30 | 101-160 | 7-9 | 12-18 |
| T4 | lv 31-45 | 161-240 | 9-11 | 16-22 |
| T5 | lv 46+ | 241-400 | 11-14 | 20-30 |

Il master può **modificare singoli campi** dopo la randomizzazione prima di aggiungere al campo.

**Tipo PNG → strumenti diversi:**
- **Umano** → usato anche dalla Tool Politico (vedi §6)
- **Kyōfu / Kizu / Holic / Boss / Mob** → tipi bestia, disponibili anche in Bestiario

### 3B. Albo PNG

Lista dei PNG salvati dal master (persistente per account master). Ogni voce:
- Nome + tipo + Tier
- Pulsante **Istanzia sul campo** (copia il PNG in Colonna B con parametri freschi)
- Pulsante **Modifica** (edita il template salvato)
- Pulsante **Elimina**

Ricerca/filtro per nome, tipo, tier.

### 3C. Bestiario

Catalogo delle creature di Oyasumi — **predisposto per la funzione Caccia.**

Ogni voce Bestiario:
- Nome (IT + JP + kanji) + tipo + Tier + descrizione lore
- Parametri base (HP, IR, CS, waza)
- **Drop table** — lista oggetti/materiali che il mob può droppare (quantità, probabilità)
- **Onimori di appartenenza** (quale wasteland/area è il suo habitat)
- Tag speciali: `[mob-caccia]` per le bestie cacciabili in gioco libero
- Pulsante **Istanzia sul campo**
- Pulsante **Salva in Albo** (copia nel tuo Albo personale)

Il Bestiario è **condiviso tra tutti i master** (dato di sistema, non per-account). Le voci le aggiunge solo il game management.

---

## 4. SCHEDA PNG — struttura dati

Una scheda PNG contiene:

```
id, nome, tipo (umano|kyofu|kizu|holic|boss|mob)
tier (1-5)
hp_max, hp_correnti
cs_max, cs_correnti
ir_attacco, ir_difesa
waza: [{ nome, descrizione, danno?, tier? }]  // lista libera
status_attivi: [{ slug, stack }]
note: string  // campo libero master
drop_table?: [{ item_id, quantita, probabilita }]  // solo per bestie
onimori?: string  // solo per bestie
creato_da: master_id
salvato_in_albo: boolean
```

**Non è eccessivamente dettagliata** — serve come linee guida al master, non come scheda personaggio completa. Niente Skiru albero, niente milestone, niente meccaniche di stile (troppo complesso per un PNG; il master gestisce a mano quello che serve).

---

## 5. SCHEDA BESTIARIO — struttura dati

Estende la scheda PNG con:

```
// tutto di scheda PNG +
drop_table: [{
  item_id: string,
  item_nome: string,
  quantita_min: number,
  quantita_max: number,
  probabilita: number  // 0-100%
}]
onimori: string  // wasteland di appartenenza
habitat: string  // descrizione ambiente
comportamento: string  // note per il master
tag_caccia: boolean  // se true, appare nella funzione caccia
lore: string  // testo narrativo
immagine?: string  // URL opzionale
```

---

## 6. INTEGRAZIONE CON ALTRI SISTEMI

**Tool Politico:** i PNG di tipo "Umano" sono gli stessi usati dalla tool politico (per negoziazioni, NPC di fazione, ecc.). L'Albo PNG è condiviso tra Tulpa Shinigami e Tool Politico — il master crea un PNG umano una volta, lo usa in entrambi i contesti.

**Funzione Caccia:** i mob con `tag_caccia: true` possono essere istanziati in una sessione di caccia autonoma (i giocatori combattono senza master attivo). La drop table viene calcolata alla fine dello scontro. Predisporre l'infrastruttura, implementazione caccia autonoma in futuro.

**Pannello Giocatore:** le modifiche del master su HP/CS/status di un PG si riflettono in real-time sul pannello giocatore (WebSocket, stesso pattern già usato per CS/status).

**Persistenza:** stessa logica del pannello giocatore — write-through su DB. Fine sessione = reset stack/status/costrutti (tranne HP).

---

## 7. COSA NON FA LA TULPA SHINIGAMI

- **Non scrive in chat da sola.** Tutto ciò che il master fa è privato. È lui che narra.
- **Non risolve il combattimento.** Niente "attacca automaticamente". Il master dichiara cosa fa il PNG, poi scrive in chat.
- **Non gestisce l'economia/drop da sola.** Il drop viene calcolato e *suggerito* al master; è lui che lo assegna ai giocatori (e lo scrive in chat).

---

## 8. CHECKLIST DI IMPLEMENTAZIONE

- [x] Struttura a tre colonne / tab mobile
- [x] Colonna A: card PG con azioni rapide (HP/CS/status/stack/costrutti)
- [x] Modifiche master → real-time sul pannello giocatore (WebSocket)
- [x] Colonna B: card PNG attivi, azioni rapide, rimuovi/salva
- [x] Colonna C tab Creazione: manuale + randomica per tier
- [x] Colonna C tab Albo: CRUD PNG salvati (per-master)
- [x] Colonna C tab Bestiario: catalogo condiviso con drop table e tag caccia
- [x] Schema DB: tabella `npcs` (scheda PNG) + tabella `bestiario` + tabella `albo_png`
- [x] Integrazione Tool Politico: PNG umani condivisi
- [x] Predisposizione funzione Caccia (infrastruttura, non implementazione completa)
- [x] Persistenza: write-through + reset fine sessione
  - Nota: caccia autonoma (sessione senza master) resta futura; `tag_caccia` + drop table sono in Bestiario.

---

## 9. ORDINE DI IMPLEMENTAZIONE CONSIGLIATO

1. **Schema DB** (tabelle npcs, bestiario, albo_png) — fondamenta
2. **Colonna A** (i PG live con azioni rapide) — il pezzo più usato e più urgente
3. **Colonna B + Creazione manuale PNG** — core del combattimento
4. **Creazione randomica per tier**
5. **Albo PNG** (CRUD)
6. **Bestiario** (catalogo + drop table)
7. **Real-time sul pannello giocatore** (WebSocket modifiche master)
8. **Integrazione Tool Politico**
9. **Predisposizione Caccia**
