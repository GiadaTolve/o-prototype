# OYASUMI · Spec Cursor — Pannello Catalogo & Editor Waza
### v1 · da implementare in coppia con `Oyasumi_Catalogo_Atomi_Effetto.md`

> **Prerequisito:** questo documento assume il catalogo atomi (14 atomi + DIFFERITO + MANUALE, sistema dei valori a 8 tipi, enum trigger/bersagli/durate/condizioni) definito nel file `Oyasumi_Catalogo_Atomi_Effetto.md`. Tienili entrambi nel contesto di Cursor.

> **Assunzione di stack (da confermare):** backend con DB relazionale SQL + API REST in JSON; frontend a componenti. La spec è scritta in modo neutro: dove serve codice, uso SQL standard e pseudocomponenti. Adatta la sintassi al tuo stack reale.

---

## 1. Perimetro

Il pannello serve alla **gestione di gioco** per: elencare, creare, modificare, versionare, validare, testare e pubblicare le waza. Non gestisce: l'assegnazione delle waza ai PG (modulo progressione), l'esecuzione in combattimento (modulo combat — ma ne **riusa il renderer e la sandbox**).

Entità gestite: waza di tutti i rami (6 Vie, Madoshō, Generiche, Tsukime, premi) — il ramo è un campo, non un pannello diverso.

---

## 2. Modello dati

### 2.1 Decisione strutturale: blocchi come JSON, non come tabella

I blocchi-effetto vivono in una **colonna JSON** sulla versione della waza, NON in una tabella `waza_blocchi` normalizzata. Motivi:
- i blocchi si leggono/scrivono sempre tutti insieme (mai query "dammi tutti i blocchi DANNO di tutte le waza" in gioco — quella serve solo nel filtro del catalogo, risolvibile con una colonna derivata `atomi_usati`);
- lo schema dei parametri varia per atomo: in SQL normalizzato diventerebbe EAV, il male;
- il versioning è banale: ogni versione è uno snapshot completo.

### 2.2 Schema SQL

```sql
-- Anagrafica stabile: ciò che non cambia mai tra versioni
CREATE TABLE waza (
  id              INTEGER PRIMARY KEY AUTO_INCREMENT,
  slug            VARCHAR(80) UNIQUE NOT NULL,      -- es. 'toka-hoshutsu'
  ramo            VARCHAR(30) NOT NULL,             -- 'Tōka-dō', 'Generiche', 'Madoshō:Gōkaon', 'Tsukime', ...
  tipo            ENUM('passiva','attiva') NOT NULL,
  tier            TINYINT NULL,                     -- 1–5; NULL per passive senza tier. CONGELATO alla prima pubblicazione
  creato_il       DATETIME NOT NULL,
  archiviata      BOOLEAN NOT NULL DEFAULT FALSE,   -- mai DELETE
  versione_pubblicata_id INTEGER NULL               -- FK → waza_versioni.id (la versione "viva")
);

-- Ogni salvataggio significativo = una versione (snapshot completo)
CREATE TABLE waza_versioni (
  id              INTEGER PRIMARY KEY AUTO_INCREMENT,
  waza_id         INTEGER NOT NULL REFERENCES waza(id),
  numero          INTEGER NOT NULL,                 -- 1, 2, 3… per waza
  stato           ENUM('bozza','validata','pubblicata','superata') NOT NULL,

  -- anagrafica versionabile
  nome_romaji     VARCHAR(80) NOT NULL,
  nome_italiano   VARCHAR(120) NOT NULL,
  kanji           VARCHAR(40) NULL,
  kanji_verificato BOOLEAN NOT NULL DEFAULT FALSE,
  descrizione     TEXT NOT NULL,                    -- layer narrativo, prosa mitico-cronachistica
  cs              TINYINT NOT NULL,
  tempo_quarti    TINYINT NULL,                     -- NULL per passive
  tags            JSON NOT NULL,                    -- ["Propagazione Conica","Energetica"]

  -- il cuore
  scelte_al_lancio JSON NOT NULL DEFAULT '[]',
  effetti         JSON NOT NULL DEFAULT '[]',       -- lista blocchi, schema del Catalogo Atomi

  -- colonne derivate (calcolate al salvataggio, servono ai filtri del catalogo)
  atomi_usati     JSON NOT NULL DEFAULT '[]',       -- ["DANNO","MOD_DANNO","MANUALE"]
  stato_codifica  ENUM('da_codificare','automatica','ibrida','manuale') NOT NULL,

  changelog       VARCHAR(300) NULL,                -- obbligatoria da v2 in poi (vincolo applicativo)
  salvata_il      DATETIME NOT NULL,
  salvata_da      INTEGER NOT NULL,                 -- FK utenti
  UNIQUE (waza_id, numero)
);

-- Enum di sistema gestibili senza deploy (consistenze, tipologie, status, skiru, soggetti-condizione)
CREATE TABLE vocabolari (
  id        INTEGER PRIMARY KEY AUTO_INCREMENT,
  categoria VARCHAR(40) NOT NULL,    -- 'consistenza','tipologia','status','skiru','soggetto_condizione','elemento'
  valore    VARCHAR(60) NOT NULL,
  extra     JSON NULL,               -- es. per status: {"stack_default":1}; per skiru: {"ramo":"Nintai"}
  attivo    BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (categoria, valore)
);
```

**Regole applicative sul modello:**
- `waza.tier` si scrive una volta e si **blocca alla prima pubblicazione** (vincolo nel service, non nel DB).
- Pubblicare la versione N: `stato='pubblicata'`, la precedente pubblicata → `'superata'`, aggiorna `waza.versione_pubblicata_id`. Transazione unica.
- `stato_codifica` derivato: nessun blocco → `da_codificare`; solo MANUALE → `manuale`; misto → `ibrida`; nessun MANUALE → `automatica`.
- I PG puntano SEMPRE a `waza.id`, mai alla versione: in gioco si risolve `versione_pubblicata_id`. (Se un domani vorrai il grandfathering — PG che tengono la vecchia versione — basterà aggiungere un override sul possesso; non ora.)

### 2.3 Validazione dello JSON `effetti`

Un **JSON Schema** unico, condiviso backend/frontend (file `schemas/effetti.schema.json`), generato dal Catalogo Atomi: per ogni `tipo` di atomo, i suoi parametri obbligatori/opzionali; per ogni `valore`, gli 8 tipi ammessi; enum di trigger/bersagli/durate. Il backend rifiuta salvataggi non conformi (difesa in profondità: il form dovrebbe già impedirli).

---

## 3. API

Prefisso `/api/admin/waza`. Tutte le rotte richiedono ruolo (vedi §8).

| Metodo | Rotta | Fa |
|---|---|---|
| GET | `/` | lista catalogo. Query param: `ramo`, `tipo`, `tier`, `tag`, `atomo`, `stato_codifica`, `stato`, `q` (ricerca sui 3 nomi), `archiviata`. Ritorna righe leggere (no `effetti`) |
| GET | `/:id` | anagrafica + versione pubblicata + elenco versioni (numero, stato, changelog, data) |
| GET | `/:id/versioni/:n` | una versione completa |
| POST | `/` | crea waza + versione 1 in bozza |
| POST | `/:id/duplica` | nuova waza: copia anagrafica+ultima versione, slug nuovo, stato bozza |
| PUT | `/:id/versioni/:n` | salva la bozza (solo se `stato='bozza'`) |
| POST | `/:id/versioni/:n/valida` | esegue le regole §6, ritorna `{errori[], avvisi[]}`; se 0 errori → `stato='validata'` |
| POST | `/:id/versioni/:n/pubblica` | solo da `validata`; da v2 richiede `changelog`; congela tier |
| POST | `/:id/versioni` | nuova bozza = copia della pubblicata (per modificare una pubblicata) |
| POST | `/:id/archivia` · `/ripristina` | soft delete |
| POST | `/sandbox` | body: `{effetti, tier, contesto}` → esegue nel motore, ritorna il log (vedi §7) |
| POST | `/render` | body: `{effetti, tier}` → render meccanico testuale (vedi §5.4) |
| GET | `/vocabolari` | tutti i vocabolari attivi (il form li carica una volta) |
| POST | `/import/excel` | upload xlsx → anteprima mapping → conferma (vedi §9) |

---

## 4. Struttura componenti frontend

```
/admin/waza
├── CatalogoWaza                 (pagina lista)
│   ├── BarraFiltri              (ramo, tipo, tier, tag, atomo, stato, ricerca)
│   ├── ContatoriCodifica        ("74/189 codificate · 14 ibride · 12 manuali · 89 da fare")
│   └── TabellaWaza              (righe: nomi, ramo, tipo, tier, CS, tags, badge stato, badge codifica, azioni)
│
└── EditorWaza                   (pagina singola, layout 2 colonne)
    ├── colonna sinistra (form)
    │   ├── BarraStato           (Bozza/Validata/Pubblicata · versione · bottoni: Salva, Valida, Pubblica, Prova)
    │   ├── SezioneAnagrafica
    │   ├── SezioneScelteAlLancio
    │   ├── SezioneBlocchi
    │   │   ├── CardBlocco       (×N, drag-riordinabili)
    │   │   │   ├── IntestazioneAtomo   (colore per famiglia, collassa/espandi, elimina, duplica)
    │   │   │   ├── CampiAtomo          (form dinamico dal JSON Schema del tipo)
    │   │   │   ├── CampiTrasversali    (trigger, bersaglio, durata, costo_extra, nota_master)
    │   │   │   └── EditorCondizione    (3 menu concatenati: soggetto → operatore → valore)
    │   │   ├── CardDifferito    (variante contenitore: finestra + fino a 3 rilasci con card figlie)
    │   │   └── BottoneAggiungi  (menu dei 16 tipi, raggruppati per famiglia)
    │   └── PannelloValidazione  (sempre visibile: errori rossi bloccanti, avvisi gialli)
    │
    └── colonna destra (anteprima viva, aggiornata a ogni modifica con debounce)
        ├── SchedaManuale        (render come apparirà nel manuale: nomi, kanji, tipo·tags·tier·CS·tempo, descrizione)
        ├── RenderMeccanico      (traduzione testuale dei blocchi via /render)
        └── PannelloSandbox      (collassato di default; si apre col bottone Prova)
```

### 4.1 Comportamenti chiave dell'editor

- **Form dinamico per atomo:** i campi di ogni CardBlocco sono generati dal JSON Schema — un componente `CampoValore` unico gestisce gli 8 tipi di valore (select del tipo + campi contestuali). Niente form scritti a mano per 16 atomi: uno solo, guidato dallo schema.
- **Selettore tier in anagrafica:** scegliendo T1–T5 precompila `cs` dal valore della scala (modificabile) e mostra il danno piatto corrispondente in sola lettura accanto ("T2 → danno 8"). Se la waza è pubblicata, il selettore è disabilitato con tooltip "tier congelato alla pubblicazione".
- **EditorCondizione:** i soggetti vengono da `vocabolari.soggetto_condizione` (`toro.batteria`, `stack(status)`, `grado_pg`, `cs_correnti`, `hp_pct`, `metri_percorsi`, `ultima_consistenza_subita`, `origine`…), gli operatori dipendono dal tipo del soggetto (bool → `==`; numerico → `== != >= <= > <`), il valore è input tipizzato. Output: stringa canonica salvata nel blocco. MAI textarea libera.
- **Riferimenti `@id`:** i campi che accettano riferimenti a `scelte_al_lancio` mostrano un select delle scelte definite; se una scelta viene eliminata mentre è referenziata → errore di validazione.
- **Kanji da verificare:** checkbox in anagrafica; finché false, un badge 「?」 resta accanto al kanji ovunque (catalogo incluso).
- **Autosave:** ogni 30 s se sporco, solo su bozze. Uscita con modifiche non salvate → conferma.

---

## 5. Render meccanico (funzione condivisa)

Modulo `renderEffetti(effetti, tier) → string[]` — una riga per blocco, in italiano, formato compatto stile manuale:

```
DANNO { valore:TIER, bersaglio:CONO 6m }            → "Danno = tier (8) a ogni bersaglio in un cono di 6 m."
MOD_DANNO { TIER_DELTA +1, cond: toro.batteria }    → "+1 tier di danno se il Tōrō ha [Batteria]."
BUFF_SKIRU { Binshō +3, 2 turni, junkan }           → "+3 Binshō per 2 turni (conta nel pool Junkan)."
MANUALE { testo }                                    → "⚑ Master: <testo>"
```

**Vive in un modulo condiviso col motore di combattimento** (stessa funzione usata: nell'anteprima dell'editor, nella scheda waza vista dai giocatori, e nel layer meccanico dei post di combattimento). Una sola verità testuale.

---

## 6. Regole di validazione

Eseguite da `/valida` e replicate live nel PannelloValidazione.

**Errori (bloccanti):**
1. Attiva senza `tempo_quarti`, o con tier nullo se ha blocchi DANNO con valore TIER.
2. Blocco non conforme al JSON Schema del suo atomo (parametro obbligatorio mancante, enum fuori lista).
3. `DANNO` senza `bersaglio`; `AREA`/`CONO` senza dimensioni.
4. Riferimento `@id` a una scelta_al_lancio inesistente; `RIFERIMENTO` a waza senza selettore compilato.
5. `DIFFERITO` senza rilasci, o con annidamento > 1 livello.
6. `condizione` che usa un soggetto non presente nei vocabolari.
7. Pubblicazione: changelog mancante (da v2), kanji presente ma `kanji_verificato=false` → errore (scelta dura: il flag esiste apposta, se preferisci degradarlo ad avviso dimmelo).
8. Passiva con `cs > 0` che non sia del pattern "1 CS per uso" (campo dedicato `costo_per_uso`, vedi Hensei-dō) — evita passive-attive ambigue.

**Avvisi (non bloccanti):**
1. `APPLICA_STATUS` senza stack → "applicato default 1" (regola deprecati).
2. `BUFF_SKIRU` senza `conta_junkan` esplicitato → "confermare se entra nel pool".
3. Blocco che LEGGE una chiave di STATO che nessun blocco della waza (né il motore di default) SCRIVE.
4. Nessun blocco → resterà `da_codificare`.
5. `MOLTIPLICATORE` su danno piatto → "verifica arrotondamento (per difetto, standard pipeline)".
6. Due blocchi identici (probabile duplicazione accidentale).
7. Waza con più di 6 blocchi → "complessità alta: valuta se una parte è nota_master".

---

## 7. Sandbox ("Prova")

`POST /sandbox` con `{effetti, tier, contesto}` dove `contesto` è configurabile dal pannello:

```json
{
  "lanciatore": { "skiru": {"Kensei":3,"Seimitsu":2}, "cs": 14, "hp": 38,
                  "stato": {"toro.batteria": true}, "grado": "Bunsekikan" },
  "bersaglio":  { "hp": 35, "scudo": 0, "itami": 2, "status": {"Incendiato": 3} },
  "opzioni":    { "vinci_confronto_indice": true }
}
```

Risposta: le **righe di log del motore vero**, pipeline esplicita:

```
[1] DANNO: tier 2 → 8 base
[2] MOD_DANNO: toro.batteria=true → +1 tier → 12
[3] Pipeline: (12 − 0 scudo) × (1 − 0,03×2) = 11,28 → 11
[4] HP bersaglio: 35 → 24
[⚑] Master: "Se grado < SB il Tōrō si disintegra" (grado=Bunsekikan → SI APPLICA)
```

**Vincolo architetturale:** la sandbox chiama le stesse funzioni del modulo combattimento (`applicaEffetti`, `pipelineDanno`) su uno stato in-memory, senza scrivere nel DB. Se il motore combat non esiste ancora, la sandbox È il primo pezzo del motore che scrivi — non un simulatore parallelo.

---

## 8. Permessi

Matrice definitiva. Non esiste il ruolo «proponente»: l'addetto alle waza è il **Fixer**. I ruoli staff sono i pixel-icon `uiMetadata.roleIcon` (più l'account `ADMIN`).

| Azione | Proprietario (`admin`) | Moderatore (`moderatore`) | Fixer (`fixer`) | Shinigami / Capo Shinigami |
|---|:---:|:---:|:---:|:---:|
| Catalogo: vedere, creare, salvare bozze, validare, duplicare, archiviare | SÌ | SÌ | SÌ | NO |
| Pubblicare (Sprint 4) | SÌ | SÌ | NO | NO |

- **Gestire** (tutte le rotte attuali `/admin/waza`) = accesso Sviluppo → `userCanManageWaza` (account ADMIN oppure `roleIcon` ∈ {admin, moderatore, fixer}).
- **Pubblicare** (rotta dello Sprint 4, ancora da implementare) = accesso Gestione → `userCanPublishWaza` (account ADMIN oppure `roleIcon` ∈ {admin, moderatore}).
- **Shinigami / Capo Shinigami** e account **MASTER**: né voce di menu né API (403 su GET/POST).
- **Giocatori:** nessun accesso al pannello; vedono le waza pubblicate nella loro scheda (fuori perimetro).

Helper: `apps/server/src/lib/waza-access.ts` (server) e `apps/client/src/lib/waza-authoring-access.ts` (`canManageWaza`, `canPublishWaza`).

---

## 9. Import da Excel (migrazione una-tantum + riusabile)

Fonte: `Oyasumi_Waza_Skiru_Database.xlsx`. Flusso in 3 passi:

1. **Upload + mapping:** il backend legge i fogli e propone il mapping colonne → campi (`nome`, `ramo/stile`, `tipo`, `tier`, `CS`, `tags`, `descrizione`…). L'operatore conferma/corregge il mapping a schermo.
2. **Anteprima:** tabella con le righe che verranno create, evidenziando: slug duplicati (→ skip o aggiorna), campi mancanti, tags non presenti nei vocabolari (→ proposta di aggiunta al vocabolario o correzione).
3. **Conferma:** crea ogni waza con versione 1 in `bozza`, `effetti=[]`, `stato_codifica='da_codificare'`. Report finale: N create, N saltate, N con avvisi.

L'import NON tenta di parsare gli effetti dal testo: porta solo l'anagrafica. La codifica in blocchi è lavoro umano nell'editor (con la scorciatoia "duplica da waza simile").

---

## 10. Ordine di implementazione (4 sprint)

**Sprint 1 — fondamenta:** schema SQL + JSON Schema effetti + rotte CRUD + CatalogoWaza con filtri base + EditorWaza con anagrafica e blocchi per i 5 atomi principali (DANNO, MOD_DANNO, BUFF_SKIRU, APPLICA_STATUS, EVOCA_COSTRUTTO) + MANUALE + validazione errori 1–4. → *Il pannello è già usabile.*

**Sprint 2 — import + copertura:** import Excel, gli altri 9 atomi, DIFFERITO, EditorCondizione completo, avvisi, colonne derivate e ContatoriCodifica.

**Sprint 3 — anteprima + sandbox:** renderEffetti condiviso, colonna destra completa, /sandbox col motore in-memory.

**Sprint 4 — governance:** workflow stati completo, versioning con changelog, congelamento tier, rotta di pubblicazione con `userCanPublishWaza` (solo Proprietario/Moderatore), duplica, archiviazione, vocabolari editabili.

---

## 11. Decisioni prese in questa spec (vetabili)

1. **Blocchi in JSON**, non tabella normalizzata (§2.1) — con colonna derivata `atomi_usati` per i filtri.
2. **Versioni immutabili** una volta pubblicate; modificare = nuova bozza. I PG puntano alla waza, non alla versione (niente grandfathering per ora).
3. **Kanji non verificato blocca la pubblicazione** (errore, non avviso).
4. **Vocabolari in tabella** (status, consistenze, skiru…) invece che hardcoded: potrai aggiungere uno status senza deploy. Contro: una fonte di verità in più da tenere allineata al manuale.
5. **La sandbox riusa il motore combat** — dipendenza dichiarata: se il combat non c'è, la sandbox ne diventa il seme.
6. **Passive con costo "1 CS per uso"** modellate con campo dedicato `costo_per_uso` invece di cs>0, per distinguerle pulitamente dalle attive (pattern Hensei-dō).
