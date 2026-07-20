# OYASUMI · Catalogo Atomi-Effetto
### Spec per il modulo di creazione waza · v1
> Estratto dall'analisi delle 6 Vie + Generiche (~100 waza dai file di refactoring v2).
> Questo documento è: (a) lo schema JSON del campo `effetti`, (b) il menu del form di creazione, (c) il contratto che il motore di combattimento deve eseguire.

---

## 0. Principio

Una waza **non contiene testo eseguibile**: contiene una lista di **blocchi-effetto**. Ogni blocco è un atomo preso da questo catalogo, con i suoi parametri. Il form di creazione è un costruttore di blocchi: scegli l'atomo, compili i parametri, aggiungi il successivo.

```
waza = anagrafica (nome, tier, cs, tempo, tags, stile)
     + effetti[]  (lista di blocchi-atomo)
```

Ciò che il catalogo non copre finisce in `EFFETTO_MANUALE` (testo libero mostrato al master alla conferma). **È una feature, non un fallback vergognoso**: il tuo sistema a due layer con conferma del GM lo assorbe nativamente.

---

## 1. Campi trasversali (presenti su OGNI blocco)

Ogni blocco-effetto, di qualsiasi tipo, ha questi campi:

| Campo | Obbligatorio | Valori | Note |
|---|:--:|---|---|
| `tipo` | ✔ | uno degli atomi §4 | il "verbo" |
| `trigger` | ✔ | enum §2 | *quando* scatta |
| `bersaglio` | ✔ | enum §2 | *su chi* |
| `valore` | dipende | oggetto-valore §3 | *quanto* |
| `durata` | ✔ | oggetto-durata §2 | *per quanto* |
| `condizione` | ✖ | espressione §2 | *se* |
| `costo_extra` | ✖ | `{cs: N}` oppure `{hp: N}` | attivazioni opzionali (Kajū, Sorashi, Tazuna) |
| `nota_master` | ✖ | testo libero | dettaglio non eseguibile che accompagna il blocco |

---

## 2. Enum trasversali

### 2.1 Trigger — quando il blocco scatta
Estratti dai pattern reali del database:

| Trigger | Significato | Esempi dal DB |
|---|---|---|
| `AL_LANCIO` | quando la waza viene eseguita (default per le attive) | quasi tutte le attive |
| `PRE_COSTO` | nel calcolo del costo CS | Shōka (Tōka), Kioku-Mei |
| `PRE_LANCIO` | prima della risoluzione: trasformazioni di tag, traiettoria | Michishirube, Yugami, Ishi, Wakeito |
| `ALL_IMPATTO` | quando il colpo va a segno | Fukitobashi, Shōgeki-Te (status), Hōden |
| `QUANDO_SUBISCI_DANNO` | il possessore viene colpito | Junnō, Hibiki-Gaeshi, Nikutai-Mei, Onnen-dama |
| `QUANDO_SUBISCI_STATUS` | riceve/possiede uno status | Jiga-Hōki, Shōka (Naikan) |
| `INIZIO_TURNO` | tick a inizio turno (zone, rigenerazione) | Unari, Balsamo dell'Anima |
| `FINE_TURNO` | tick a fine turno (scadenze, cedimenti) | Tensione/Cedimento, Hōden non scaricato |
| `A_COMANDO` | il giocatore lo attiva quando vuole (entro finestra) | Tanraku, Maikomi, Tameru, Fuin no Hi |
| `A_SCADENZA` | il timer esaurisce senza rilascio | Fuin no Hi (Emanazione), Geki-Ryū (contraccolpo) |
| `ENTRA_IN_ZONA` | un bersaglio entra/attraversa/sosta nell'area | Jiban, Rōei, Unari |
| `SU_DISTRUZIONE` | il costrutto/oggetto legato viene distrutto | Kenja no Ishi, Kesshō-Mei, Sōkotsu, Bōchō |
| `SU_MOVIMENTO` | scala con i metri percorsi | Kyōmei, Tobi-Kake, Scatto |

### 2.2 Bersaglio
`SE_STESSO` · `BERSAGLIO_SINGOLO` · `AREA` (con `raggio_m`) · `CONO` (con `profondita_m`) · `LINEA` · `PROPRIO_COSTRUTTO` · `COSTRUTTO_NEMICO` · `TORO` · `ZONA_TERRENO` · `TUTTI_IN_AREA`

### 2.3 Durata
```json
{ "tipo": "ISTANTANEA" | "TURNI" | "PERSISTENTE" | "FINO_A_CONDIZIONE" | "COMBATTIMENTO",
  "n": 3,
  "condizione_fine": "zona non colpita per 2 turni" }
```
Valori reali nel DB: quasi sempre **1–4 turni** o istantanea. `PERSISTENTE` con condizione di decadimento copre Tsubo-Uchi, Shōka (Naikan), Chikuden.

### 2.4 Condizione
Espressione booleana valutata dal motore. Il form la costruisce a menu (soggetto · operatore · valore), non a testo libero. Soggetti ricorrenti nel DB:

- `origine == toro` (tutto il Tōka-dō)
- `toro.batteria == true` (Hōshutsu, Tanraku, Teishūha, Maikomi)
- `grado_pg >= SB` (Hōshutsu, sblocchi di grado)
- `bersaglio.stack(status) >= N` (Kasan, Kunō-Baku, Kesshō-Mei, Tenka)
- `possessore.hp_pct < 50` (Adrenalina)
- `cs_correnti >= 12` / `>= soglia_overheat` (Kaatsu, Atsuryoku)
- `colpi_su_bersaglio_nel_turno >= 2` (Hōwa)
- `metri_percorsi >= movimento*2` (Tobi-Kake)
- `waza.tag contiene [X]` (dovunque)
- `ultima_consistenza_subita == X` (Junnō, Hibiki-Gaeshi)
- `consistenza != precedente` (Renkin-Soku / Yuragi)

---

## 3. Sistema dei valori

Questa è la scoperta più importante dell'analisi: **quasi nessun valore nel database è un numero libero**. I valori appartengono a 7 tipi, e il form deve offrire *questi tipi*, non un campo numerico nudo — è ciò che tiene il modulo allineato al design "no scaling formulas":

| Tipo valore | Sintassi | Esempi dal DB |
|---|---|---|
| `FISSO` | `{tipo:"FISSO", n:4}` | Fukitobashi (spinta 4 m), Bōgai (−2 CS), gittate |
| `TIER` | `{tipo:"TIER"}` → legge il tier della waza (T1=4…T5=23) | il 70% dei danni |
| `TIER_DELTA` | `{tipo:"TIER_DELTA", n:+1}` | Kakuchō, Hakai-Mei, Hōwa, Kaatsu, tutta la famiglia "+1 tier" |
| `TIER_PER_STACK` | `{tipo:"TIER_PER_STACK", status:"*"}` | Kunō-Baku, Kesshō-Mei (taglia per stack) |
| `SOMMA_BOOST` | somma dei Bun sacrificati | Datsui-Tate, Datsui-Yumi |
| `TIER_COLPO_SUBITO` | eco del tier dell'ultimo colpo ricevuto | Junnō, Hibiki-Gaeshi |
| `FORMULA_SKIRU` | `{tipo:"FORMULA", base:8, skiru:"Seimitsu", per_punto:1}` | Michishirube (8+Seimitsu m), soglie di stile (2+Fudōshin, 3+Itami…), Movimento |
| `SCALARE_A_CRESCERE` | `{tipo:"SCALA", passi:[2,4,6], cap:6}` | Tsubo-Uchi |
| `MOLTIPLICATORE` | `{tipo:"MOLT", x:0.75}` | Wakeito (×0,75), Kantsū (−25%), Yugami (gittata ×1,5/×0,5) |

---

## 4. Il catalogo — 14 atomi

Per ogni atomo: parametri propri + prove di copertura (waza reali che codifica).

---

### A1 · DANNO
Infligge danno che entra nella pipeline `(Danno − Scudo) × (1 − 0,03·Itami)`.
```json
{ "tipo":"DANNO", "valore":{...}, "bersaglio":"...", "consistenza":"Energetica",
  "area":{"forma":"cerchio|cono|linea", "raggio_m":3} }
```
**Copre:** Hōshutsu, Kyōmei, Hajiki, Mayu-Wari, Raimei-Fu, Shōgeki-Te, Genso-Ya, Sōkotsu, Tanraku, Hōsha (×2 proiettili → campo `ripetizioni`), Tameru, Hōden, Maikomi, Kunō-Baku, Datsui-Yumi, Eco del Pugno, Dardo Psichico, Scintilla d'Ego, Shrapnel Psichico. **~35% di tutte le attive.**

### A2 · MOD_DANNO
Modifica il danno di altre waza (proprie o subite). È l'atomo delle passive offensive.
```json
{ "tipo":"MOD_DANNO", "valore":{"tipo":"TIER_DELTA","n":1},
  "filtro_waza":{"tag":["Contatto"]}, "condizione":"..." }
```
**Copre:** Kakuchō, Hakai-Mei (+1 tier vs [Costrutto]), Hōwa, Kaatsu, Adrenalina, Incombenza, Tobi-Kake, Hibiki-Gaeshi, Kenja no Ishi, Parata Perfetta (bonus post-parata), Wakeito (×0,75), Kantsū (−25% a bersagli successivi), Kajū (ignora 25% Resistenza — variante `penetrazione`), Tsubo-Uchi (scala a crescere).

### A3 · BUFF_SKIRU / DEBUFF_SKIRU
`+X`/`−X` a una Skiru mappata → ±Indice e ±danno delle azioni relative. **Tutto il Naikan-dō è questo atomo.** Il motore lo conta nel pool Junkan (`3 + Itami`).
```json
{ "tipo":"BUFF_SKIRU", "skiru":"Binshō", "valore":{"tipo":"FISSO","n":3},
  "durata":{"tipo":"TURNI","n":2}, "conta_junkan":true }
```
**Copre:** Hari-Tsume, Sen'i-Gake, Geki-Ryū (buff poi debuff differito), Shōka (Naikan), Yōki no Iki (−3 Indice Hansha = debuff), trasferimenti di Jiga-Hōki/Ittai (campo `trasferibile_a_costrutto:true`).

### A4 · APPLICA_STATUS
```json
{ "tipo":"APPLICA_STATUS", "status":"Incendiato", "stack":1, "bersaglio":"..." }
```
Default stack = 1 (regola deprecati). **Copre:** status elementali di Honshitsu/Shōgeki-Te/Genso-Ya/Jiban/Nokuribi, Unari (Vertigini), Rōei, Shokubai, Kasan (variante: `richiede_status_esistente:true`).

### A5 · MANIPOLA_STATUS
Le quattro operazioni non-applicative sugli status, tutte presenti nel DB:
```json
{ "tipo":"MANIPOLA_STATUS", "operazione":"TRASFERISCI|TRASMUTA|CONSUMA|RIMUOVI",
  "status":"*", "stack":"tutte|N", "da":"SE_STESSO", "a":"BERSAGLIO" }
```
**Copre:** Hada-Yuzuri (trasferisci), Tenka (trasmuta, stessi stack), Kunō-Baku e Kesshō-Mei (consuma → alimenta un DANNO/EVOCA nello stesso blocco successivo), Shōka Naikan (consuma → alimenta BUFF).

### A6 · SCUDO
```json
{ "tipo":"SCUDO", "resistenza":{"tipo":"TIER"}, "durata":{...}, "mitigazione_extra_pct":5 }
```
**Copre:** Shoheki, Tōki-Armatura (resistenza tier + 5% mitigazione), Datsui-Tate (resistenza = `SOMMA_BOOST`).

### A7 · MOD_RESISTENZA
```json
{ "tipo":"MOD_RESISTENZA", "valore":{"tipo":"TIER_DELTA","n":1},
  "filtro":{"tag":["Solido"]}, "vs_consistenza":"opzionale" }
```
**Copre:** Kōchiku, Shime, Junnō (`TIER_COLPO_SUBITO`, `vs_consistenza:ultima_subita`), scrittura precisa di Gosa, reazione Acqua+Solido (−1).

### A8 · MOD_COSTO
```json
{ "tipo":"MOD_COSTO", "delta_cs":-1, "minimo":1, "filtro_waza":{"origine":"toro"} }
```
**Copre:** Shōka (Tōka), Kioku-Mei (−1 CS su forme memorizzate). Le attivazioni opzionali (+1 CS di Kajū, Fuantei, Sorashi, Tazuna) NON usano questo atomo: sono il campo trasversale `costo_extra` sul loro blocco.

### A9 · MOD_CS
Agisce sulle CS come risorsa (non come costo).
```json
{ "tipo":"MOD_CS", "valore":{"tipo":"FISSO","n":-2}, "bersaglio":"BERSAGLIO_SINGOLO" }
```
**Copre:** Bōgai (−2 CS al bersaglio a contatto), Balsamo dell'Anima (+1 rigen condizionata), Nikutai-Mei (redirect danno→CS, variante `redirect_danno:"cs"`), Chikuden (deposita fino a 5 CS in costrutto → scrive `batteria` sullo stato, vedi A13), Cedimento di Tensione (−2), Mugen no Tsukai (`blocca_rigenerazione:true`).

### A10 · TRASFORMA_TAG
Cambia [Categoria] o [Consistenza] di una waza o di un costrutto. È la firma condivisa Itō/Hensei + Michishirube/Nokuribi.
```json
{ "tipo":"TRASFORMA_TAG", "dimensione":"CATEGORIA|CONSISTENZA",
  "da":["Energetica","Contatto"], "a":["Energetica","Proiettile"],
  "oggetto":"WAZA_PROPRIA|COSTRUTTO", "effetti_collaterali":{"gittata":{"tipo":"MOLT","x":1.5}} }
```
**Copre:** Michishirube, Nokuribi (con consumo dello stato-elemento), Yugami, Someito, Ishi, Genso-Ka, Kyōsei-Hen, Wana, Kōkan (scambio bidirezionale, `oggetti:2`), Shoku (graduale: `per_turno:true` + MOD_RESISTENZA −1/turno). Il motore Yuragi (catena, effetti alchemici) legge *questi blocchi* per contare i cambi.

### A11 · MOD_TRAIETTORIA
Tutto ciò che piega, sospende, moltiplica o reindirizza il percorso di una waza.
```json
{ "tipo":"MOD_TRAIETTORIA",
  "operazione":"DEVIA|RIMBALZA|SOSPENDI|SDOPPIA|PENETRA|ANCORA|SPINGI",
  "parametri":{"angolo_max":180, "metri_extra":4, "n_copie":2} }
```
**Copre:** Tazuna (DEVIA+RIMBALZA), Hikitome (SOSPENDI 1 turno), Wakeito (SDOPPIA, con MOD_DANNO ×0,75 in coppia), Kantsū (PENETRA), Byō (ANCORA verso costrutto-bersaglio), Fukitobashi (SPINGI 4 m), Fuantei (effetti per categoria), Sorashi (DEVIA su oggetti, con `costo_extra` per taglia), Irekae (variante TELEPORT-SCAMBIO fra costrutti).

### A12 · EVOCA_COSTRUTTO
Inserisce un nuovo partecipante di tipo `costrutto` (riusa lo schema `partecipanti`).
```json
{ "tipo":"EVOCA_COSTRUTTO",
  "taglia":"Piccola|Media|Grande", "consistenza":"Solido",
  "resistenza":{"tipo":"TIER"}, "danno":{"tipo":"TIER"},
  "durata":{"tipo":"TURNI","n":3}, "gittata_controllo_m":8,
  "movimento_m":6, "attacchi_per_turno":1, "n_copie":1,
  "comportamento":"COMANDATO|SEGUE|AUTO_REAZIONE|STATICO",
  "conta_mei":true }
```
`conta_mei:true` = entra nel conteggio Gosa (`2+Seimitsu`); il Tōka usa `gittata_controllo:8` per Ukabu Tōrō. `comportamento:AUTO_REAZIONE` copre Onnen-dama (si lancia sulla prima fonte di danno).
**Copre:** Ukabu Tōrō, Bugusho (n_copie:3), Kaihen, Hashira (n_copie:2, STATICO), Onnen-dama, Mugen no Tsukai, Monile, Byō, Ihen (variante `sostituisce_arto:true`), Kesshō-Mei (taglia da `TIER_PER_STACK`), Tōki-Armatura (STATICO indossato).

### A13 · STATO_PERSONALE (scrivi/leggi)
Il registro chiave-valore sul partecipante (il "blob Tōrō" e i suoi fratelli). Due operazioni:
```json
{ "tipo":"STATO", "operazione":"SCRIVI|LEGGI",
  "chiave":"toro.elemento_residuo", "valore":"Fuoco",
  "scade":{"tipo":"TURNI","n":1} }
```
**Copre:** Nokuribi (scrive elemento al POST_LANCIO, legge+consuma al PRE_LANCIO), Chikuden (`toro.batteria`), Tsubo-Uchi (`punto_pressione.zona` + contatore), Junnō/Hibiki-Gaeshi (`ultima_consistenza_subita` — che conviene far scrivere *dal motore* di default a ogni colpo, così le due passive solo leggono), Fuin no Hi (`toro.waza_sigillata`), Kanshi/Teishūha (energia depositata).

### A14 · ZONA
Area persistente sul campo con effetti agganciati ai trigger `ENTRA_IN_ZONA`/`INIZIO_TURNO`.
```json
{ "tipo":"ZONA", "forma":"cerchio", "raggio_m":4, "ancoraggio":"PUNTO|SEGUE_ANALISTA|SEGUE_COSTRUTTO",
  "durata":{"tipo":"TURNI","n":3},
  "effetti_zona":[ {"tipo":"APPLICA_STATUS", "trigger":"ENTRA_IN_ZONA", ...} ],
  "immunita":["SE_STESSO"] }
```
Nota: `effetti_zona` è ricorsivo — una zona contiene altri atomi. **Copre:** Jiban (immunità analista), Yōki no Iki (con DEBUFF_SKIRU dentro + `infiammabile:true` come nota/reazione), Rōei, Unari (segue costrutto), Oboro (variante `occulta:true`, nessun danno).

---

## 5. EFFETTO_DIFFERITO — non è un atomo, è un involucro

Pattern ricorrente: "prepara ora, scatta dopo". Invece di un atomo dedicato, è un **wrapper** che contiene altri blocchi + finestre di rilascio:

```json
{ "tipo":"DIFFERITO",
  "finestra":{"tipo":"TURNI","n":3},
  "rilasci":[
    {"trigger":"ALL_IMPATTO",  "effetti":[ ...blocchi... ]},
    {"trigger":"A_COMANDO",    "effetti":[ ...blocchi... ]},
    {"trigger":"A_SCADENZA",   "effetti":[ ...blocchi... ]}
  ] }
```
**Copre:** Fuin no Hi (3 rilasci: impatto / fendente / rottura — con la particolarità che gli effetti sono `{riferimento_waza_id}`, un puntatore), Maikomi, Tameru (rilascio anticipato se colpito), Tanraku, Geki-Ryū (il contraccolpo è un DEBUFF in `A_SCADENZA`), Hōden (autodanno in `A_SCADENZA`).

---

## 6. EFFETTO_MANUALE — la valvola di sfogo

```json
{ "tipo":"MANUALE", "testo":"Ricrea un oggetto/costrutto distrutto il turno precedente…",
  "mostra_a":"MASTER", "suggerimento_bottoni":["Concesso","Negato"] }
```
Waza che dall'analisi cadono qui (in tutto o in parte) — **~12 su 100, il 12%**:

| Waza | Perché manuale |
|---|---|
| Kintsugi | "distrutto nel turno precedente, non da energia psichica" → adjudicazione + lettura log |
| Kaihen | fusione creativa di due armi, forma libera |
| Mayakashi | illusione: l'effetto è sull'informazione, non sui numeri |
| Ubaiito | il confronto d'Indice è calcolabile, ma "controllo vago" del costrutto rubato è narrativo |
| Irekogo | guscio annidato: sequenza scudo→rivela gestibile a mano finché non è frequente |
| Musubi | "ciò che accade a uno si ripete sull'altro" — troppo generale per automatizzarlo ora |
| Gyakuryū | richiamo per "la traiettoria più veloce" → fato/master |
| Kanshi | vista remota: puro narrativo |
| Sorashi (esiti) | la deviazione ha "esiti variabili" dichiarati |
| Oboro (occultamento) | cosa è nascosto a chi = informazione, master |
| Hikiyose | fisica positivo/negativo: attrazione risolta narrativamente |
| Nikutai-Mei (forma) | la forma dell'arto è libera; il redirect danno→CS invece È automatizzabile (A9) |

Nota il pattern dell'ultima riga: molte waza sono **ibride** — blocchi automatici + un blocco manuale. Il formato lo consente nativamente: `effetti: [A9, MANUALE]`.

---

## 7. Copertura misurata

Su ~100 waza analizzate (6 Vie + Generiche):

- **Interamente automatizzabili:** ~74
- **Ibride (automatico + 1 blocco manuale):** ~14
- **Prevalentemente manuali:** ~12

Atomi per frequenza d'uso: DANNO e MOD_DANNO da soli coprono metà dei blocchi totali; DANNO + MOD_DANNO + BUFF_SKIRU + APPLICA_STATUS + EVOCA_COSTRUTTO ≈ 75% di tutti i blocchi. **Consiglio implementativo: parti da questi 5 atomi + MANUALE**, e il modulo è già utilizzabile in gioco; gli altri 9 si aggiungono a sprint successivi senza toccare lo schema.

---

## 8. Esempi completi (waza reali codificate)

### Hōshutsu · Rilascio della Fiamma (Tōka-dō)
```json
{
  "nome": "Hōshutsu", "kanji": "放出", "stile": "Tōka-dō",
  "tipo_waza": "Attiva", "tier": 2, "cs": 2, "tempo_quarti": 1,
  "tags": ["Propagazione Conica", "Energetica"],
  "effetti": [
    { "tipo":"DANNO", "trigger":"AL_LANCIO", "bersaglio":"CONO",
      "area":{"forma":"cono","profondita_m":6},
      "valore":{"tipo":"TIER"}, "durata":{"tipo":"ISTANTANEA"} },
    { "tipo":"MOD_DANNO", "trigger":"AL_LANCIO",
      "valore":{"tipo":"TIER_DELTA","n":1},
      "condizione":"toro.batteria == true", "durata":{"tipo":"ISTANTANEA"} },
    { "tipo":"MANUALE", "trigger":"AL_LANCIO",
      "testo":"Se [Batteria] usata e grado < Sentatsu Bunsekikan: il Tōrō si disintegra.",
      "condizione":"toro.batteria == true && grado_pg < 'SB'" }
  ]
}
```
*(La disintegrazione potrebbe anche essere un atomo DISTRUGGI: l'ho lasciata manuale perché tocca l'inventario, che è un altro modulo.)*

### Sen'i-Gake · Avvolgimento delle Fibre (Naikan-dō)
```json
{
  "nome": "Sen'i-Gake", "stile": "Naikan-dō", "tipo_waza": "Attiva",
  "cs": 2, "tempo_quarti": 1, "tags": ["Nessuna","Potenziamento"],
  "scelte_al_lancio": [
    { "id":"fibra", "opzioni":["Bianche→Kairyoku","Neuromuscolari→Binshō","Rosse→Nintai"] },
    { "id":"settore", "opzioni":["Gambe","Braccia","Torace"] }
  ],
  "effetti": [
    { "tipo":"BUFF_SKIRU", "trigger":"AL_LANCIO", "bersaglio":"SE_STESSO",
      "skiru":"@fibra", "valore":{"tipo":"FISSO","n":2},
      "durata":{"tipo":"TURNI","n":2}, "conta_junkan":true,
      "nota_master":"Si applica solo alle azioni del settore @settore" }
  ]
}
```
*(Nota il campo `scelte_al_lancio`: parametri decisi dal giocatore al momento dell'uso, referenziati con `@id`. Serve anche a Honshitsu, Raimei-Fu, Tsubo-Uchi, Hada-Yuzuri.)*

### Fuin no Hi · Sigillo della Fiamma (Tōka-dō)
```json
{
  "nome": "Fuin no Hi", "stile": "Tōka-dō", "tipo_waza": "Attiva",
  "tier": 2, "cs": 2, "tempo_quarti": 1, "tags": ["Setup"],
  "scelte_al_lancio": [ { "id":"sigillata", "tipo":"waza_conosciuta" } ],
  "effetti": [
    { "tipo":"STATO", "operazione":"SCRIVI", "trigger":"AL_LANCIO",
      "chiave":"toro.waza_sigillata", "valore":"@sigillata",
      "scade":{"tipo":"TURNI","n":3} },
    { "tipo":"DIFFERITO", "finestra":{"tipo":"TURNI","n":3},
      "rilasci":[
        { "trigger":"ALL_IMPATTO", "effetti":[{"tipo":"DANNO","valore":{"tipo":"RIFERIMENTO","waza":"@sigillata"}}] },
        { "trigger":"A_COMANDO",  "effetti":[{"tipo":"DANNO","bersaglio":"LINEA","valore":{"tipo":"RIFERIMENTO","waza":"@sigillata"},"nota_master":"Diventa [Proiettile][Energetico] con le proprietà della sigillata"}] },
        { "trigger":"A_SCADENZA", "effetti":[{"tipo":"DANNO","bersaglio":"AREA","valore":{"tipo":"RIFERIMENTO","waza":"@sigillata"},"nota_master":"Il Tōrō si rompe in [Emanazione]"}] }
      ] }
  ]
}
```
*(Qui compare l'ultimo tipo di valore: `RIFERIMENTO` a un'altra waza — serve solo a Fuin no Hi, Utsushi e Rensa.)*

---

## 9. Mappatura sul form di creazione

Flusso UI del modulo "Nuova Waza":

1. **Anagrafica** — nome (trilingue), stile, tipo (Passiva/Attiva), tier (menu T1–T5, che fissa danno e CS di default dalla scala), tempo in quarti, tags (multi-select dalle Consistenze/Tipologie canoniche), descrizione narrativa (testo libero, layer narrativo).
2. **Scelte al lancio** (opzionale) — aggiungi parametri che il giocatore deciderà all'uso.
3. **Blocchi effetto** — pulsante "+ Aggiungi effetto" → menu dei 14 atomi + DIFFERITO + MANUALE. Selezionato l'atomo, il form mostra **solo i campi di quell'atomo** (schema §4) più i trasversali (trigger con default sensato, bersaglio, durata, condizione a menu).
4. **Anteprima** — il motore fa il render testuale dei blocchi ("Danno = tier in cono 6 m; +1 tier se [Batteria]; …") accanto alla descrizione narrativa: se il render non coincide col design in testa, i blocchi sono sbagliati.
5. **Validazione** — regole automatiche: DANNO richiede tier ≥ 1; BUFF_SKIRU con `conta_junkan` avvisa del pool; status senza stack → 1; tier fisso non modificabile dopo il salvataggio (design bloccato).

---

## 10. Decisioni che ho preso io (da vetare liberamente)

1. **DIFFERITO come wrapper e non come atomo** — mi sembra più pulito, ma raddoppia un filo la complessità del form (blocchi dentro blocchi, un livello solo).
2. **La disintegrazione del Tōrō in Hōshutsu lasciata a MANUALE** invece di creare un atomo DISTRUGGI_OGGETTO: dipende da quanto l'inventario sarà integrato col combattimento.
3. **`ultima_consistenza_subita` scritta dal motore di default** su ogni partecipante, non dalle passive: Junnō e Hibiki-Gaeshi diventano puri lettori.
4. **Musubi e Hikiyose declassate a manuali** nonostante siano concettualmente automatizzabili: il costo di implementare "replica eventi" e "fisica di attrazione" non vale 2 waza. Promuovibili dopo.
5. **Il tipo `RIFERIMENTO`** (puntatore a waza) limitato a 3 waza: se ti va bene tenerle manuali all'inizio, si può rinviare.
6. **Le meccaniche di stile (Tensione, Gosa, Yuragi, Junkan, Atsuryoku) NON sono blocchi-waza**: sono regole del motore che *leggono* i blocchi (es. Yuragi conta i TRASFORMA_TAG, Junkan somma i BUFF_SKIRU). Vanno implementate una volta nel motore, non ripetute nelle waza.
