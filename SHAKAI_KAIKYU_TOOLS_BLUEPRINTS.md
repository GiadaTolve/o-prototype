# Shakai Kaikyū — Tool UX e Blueprint

> **Stato:** design lock (Luglio 2026) · catalogo machine-readable in `packages/domain/src/shakai-kaikyu/blueprint-catalog.ts`  
> **Riferimenti:** `SHAKAI_KAIKYU_SPEC.md` (regole classe/sottoclasse), `materials.ts` (junklist)

Valori piatti, coerenti con i cap giornalieri (15/20/30 HP, Integrità, Raccolta; Peso/Capacità Patti; Potere/Capacità Ofuda). Ogni classe pesca materiali dalla **junklist condivisa** in fondo.

---

## Pattern UI comune

| Classe | Pannello A | Pannello B | Output |
|--------|------------|------------|--------|
| **Medico** | Cura (HP → budget) | Preparati (ricette) | Oggetti inventario |
| **Artigiano** | Riparazione (Integrità → budget) | Costruzione (progetti) | Oggetti con Integrità |
| **Cacciatore** | Battuta (zone → catalogo) | — | Materiali da unità Raccolta |
| **Politico** | Registro Patti | — | Patti attivi/spesi/decaduti |
| **Sacerdote** | Reliquiario (Ofuda) | Fabbricazione riti | Ofuda consegnabili |

**Reset budget:** 00:00 UTC (stesso tick REM).  
**Capstone:** sblocca ricette/progetti/riti del capstone **e** tutti i blueprint dei sentieri della classe (un solo sentiero acquistato, ma il capstone «fa tutto»).

---

# BLUEPRINT #Medico

**Tool:** apre la scheda del bersaglio. *Cura*: inserisce HP da ripristinare; il sistema scala dal budget giornaliero (15/20/30) e blocca se supera il residuo. *Preparati*: lista ricette sbloccate; verifica materiali in inventario, consuma, genera oggetto (slot, scambio, vendita).

### Ricette — Minarai (Keystone)
- **Bendaggio semplice** — ripristina 5 HP a chi lo usa. *Materiali: 2 Stoffa.*
- **Analgesico lieve** — annulla per 1 turno la penalità narrativa di una ferita lieve. *Materiali: 1 Erba comune.*
- **Sedativo blando** — rimuove 1 stack di uno status emotivo a scelta. *Materiali: 1 Erba comune, 1 Reagente.*
- **Disinfettante** — impedisce che una ferita lieve peggiori (blocca infezione narrativa). *Materiali: 1 Reagente.*

### Ricette — Gekai (Bisturi Silenzioso)
- **Kit di sutura chirurgica** — ripristina 10 HP; solo dal medico. *Materiali: 2 Stoffa, 1 Componente fine.*
- **Trasfusione** — trasferisce fino a 10 HP dal medico (o donatore) al paziente. *Materiali: 1 Componente fine, 1 Reagente.*
- **Anestetico chirurgico** — il paziente ignora penalità da dolore per un'intera scena. *Materiali: 2 Reagenti.*
- **Intervento maggiore** *(procedura)* — rimuove condizione grave; consuma 15 HP del budget giornaliero. *Materiali: 1 Kit di sutura chirurgica, 2 Reagenti.*

### Ricette — Yakushi (Guardiano delle Radici)
- **Decotto rinvigorente** — ripristina 8 HP; ovunque. *Materiali: 2 Erbe comuni.*
- **Antidoto universale** — annulla un veleno entro 1 turno. *Materiali: 2 Erbe comuni, 1 Erba rara.*
- **Veleno paralizzante** — su arma: primo bersaglio perde ¼ nel turno successivo. *Materiali: 1 Erba rara, 1 Reagente.*
- **Veleno lento** — 3 danni/turno per 3 turni; non mitigabile da Itami. *Materiali: 2 Erbe rare.*
- **Fumo del torpore** — −2 all'Indice per una scena. *Materiali: 1 Erba comune, 1 Erba rara.*

### Ricette — Itamae (Cuoco dei Rimedi)
- **Zuppa del focolare** — 5 HP per porzione (max 4). *Materiali: 2 Carni, 1 Erba comune.*
- **Onigiri del viandante** — ignora fatica di marcia per un giorno. *Materiali: 1 Carne, 1 Erba comune.*
- **Piatto del coraggio** — rimuove 1 stack Osore/Paura. *Materiali: 1 Carne pregiata, 1 Erba comune.*
- **Banchetto rituale** — +1 Skiru a scelta per commensale, scena successiva. *Materiali: 2 Carni pregiate, 2 Erbe comuni.*

### Ricette — Iryō no Oni (capstone)
- **Panacea** — 15 HP + antiveleno + 1 stack emotivo in un uso. *Materiali: 1 Erba rara, 2 Reagenti, 1 Componente fine.*
- **Rianimazione** *(procedura)* — da 0 HP a 5 HP, una volta/scena; consuma intero budget residuo (min. 20).

---

# BLUEPRINT #Artigiano

**Tool:** *Riparazione* (Integrità su oggetto, scala budget) e *Costruzione* (progetti, verifica materiali). Oggetti con Integrità massima; a 0 sono rotti (riparare o smantellare).

### Progetti — Minarai Shokunin (Keystone)
- **Utensile da campo** — Integrità 10. *Materiali: 1 Rottame metallico.*
- **Rammendo** — +5 Integrità stoffa/cuoio. *Materiali: 1 Stoffa.*
- **Contenitore sigillato** — protegge da acqua/contaminazione. *Materiali: 1 Rottame metallico, 1 Stoffa.*
- **Torcia a lunga durata** — luce scena notturna. *Materiali: 1 Legno, 1 Stoffa.*

### Progetti — Kajishi (Signore della Forgia)
- **Arma bianca forgiata** — Integrità 30. *Materiali: 3 Rottami metallici, 1 Legno.* *(Richiede forgia.)*
- **Armatura leggera** — Scudo 4 (T1). *Materiali: 2 Rottami metallici, 2 Cuoi.*
- **Armatura pesante** — Scudo 8 (T2), −1 m Movimento. *Materiali: 4 Rottami metallici, 1 Cuoio.*
- **Riforgiatura** — Integrità piena arma metallica; 15 pt budget. *Materiali: 1 Rottame metallico.*

### Progetti — Karakurishi (Tessitore di Meccanismi)
- **Trappola a scatto** — 8 danni al primo attivatore. *Materiali: 2 Componenti meccanici, 1 Rottame metallico.*
- **Serratura complessa / grimaldello** — apre o blinda passaggio. *Materiali: 1 Componente meccanico, 1 Componente fine.*
- **Balestra a ripetizione** — Integrità 20, ricarica ogni 2 colpi. *Materiali: 2 Componenti meccanici, 1 Legno, 1 Rottame metallico.*
- **Allarme perimetrale** — segnala intrusi in area. *Materiali: 1 Componente meccanico, 1 Stoffa.*

### Progetti — Tsukuroibito (Rammendatore)
- **Restauro** — oggetto vecchio mondo. *Materiali: 1 Componente fine, 1 variabile (Master).*
- **Recupero d'archivio** — documento/mappa leggibile. *Materiali: 1 Carta, 1 Reagente.*
- **Replica** — copia oggetto semplice esaminato. *Materiali: come originale +1 Componente fine.*

### Progetti — Hyakushu no Meishō (capstone)
- **Capolavoro** — progetto noto, Integrità +50%, tratto distintivo (Master). *Materiali: doppi del base.*

---

# BLUEPRINT #Cacciatore

**Tool:** *Battuta* — zona → catalogo prede/risorse → spende unità Raccolta (15/20/30, reset 24h). Prede pericolose possono diventare scena (Master).

### Michishirube (Keystone) · zone conosciute
- **Selvaggina minuta** *(3 u)* → 1 Carne
- **Erbe da campo** *(2 u)* → 1 Erba comune
- **Legname** *(2 u)* → 1 Legno
- **Acqua pulita** *(1 u)* → scorta idrica gruppo, 1 giorno

### Kōya (Predone) · caccia grossa
- **Grossa selvaggina** *(8 u)* → 2 Carni pregiate, 1 Cuoio
- **Predatore** *(12 u, possibile scena)* → 1 Carne pregiata, 2 Cuoi, 1 Trofeo
- **Abbattimento su commissione** *(10 u)* → minaccia eliminata + 1 Trofeo + ricompensa narrativa

### Sasurai (Nomade Onimori) · territori corrotti
- **Erba rara** *(6 u)* → 1 Erba rara
- **Residuo onirico** *(8 u)* → 1 Frammento onirico
- **Ricognizione** *(5 u)* → settore mappato, no sorprese entro giornata
- **Recupero** *(10 u)* → oggetto/corpo da zona inaccessibile ad altri

### Michimori (Guardiano sentieri)
- **Linea di trappole** *(6 u)* → 3 catture passive Selvaggina minuta in 24h. *Richiede: 1 Componente meccanico.*
- **Sentiero sicuro** *(8 u)* → percorso senza pericoli ambientali per 1 giorno
- **Nascondiglio** *(5 u)* → riparo occultato, 1 notte senza imboscata

### Ryōkon no Nushi (capstone)
- **Preda leggendaria** *(intero budget, sempre scena)* — bersaglio unico (Master). Bottino: 1 Trofeo maggiore + materiali creatura.

---

# BLUEPRINT #Politico

**Tool:** *Registro Patti* — controparte, leva (formale/popolare/sotterranea), Peso (1–5), stato (attivo/speso/decaduto). Blocco oltre Capacità e Peso max sottoclasse. Stringere in gioco (scena/Indice) → registrazione → moderazione convalida. Richiamo consuma il Patto. **Nessun materiale** — risorsa = tessuto sociale.

### Patti tipo per Peso
- **Peso 1** — favore spicciolo (info, occhio chiuso, messaggio)
- **Peso 2** — debito personale (alloggio, testimone, accesso)
- **Peso 3** — impegno di gruppo (scorta armata, sciopero/raduno, dossier)
- **Peso 4** — mobilitazione (Ordine, folla, sparizione prova)
- **Peso 5** — equilibri (alleanza fazioni, amnistia, caduta funzionario) — sempre mod

### Voci speciali
- **Rinnovo** *(Kuromaku)* — Patto speso rinegoziato, torna attivo con Peso −1
- **Patto delegato** *(Kagenui, Kuromaku)* — beneficio richiamo a un altro PG

---

# BLUEPRINT #Sacerdote

**Tool:** *Reliquiario* — Ofuda con Rito, Potere (1–5), detentore, stato (attivo/consumato). Fabbricazione blocca oltre Capacità/Potere max. Attivazione consuma Ofuda. Flag sentiero: Jareiba = solo luogo consacrato; Yumetoki = tempo doppio (mod spunta in fabbricazione).

### Potere 1
- **Ofuda del Conforto** — −1 stack emotivo. *1 Carta*
- **Ofuda della Soglia** — avviso attraversamento porta. *1 Carta*

### Potere 2
- **Ofuda della Veglia** — no sorprese nel sonno, 1 notte. *1 Carta, 1 Erba comune*
- **Ofuda del Piccolo Scudo** — assorbe 8 danni (T2). *2 Carte*
- **Ofuda del Presagio minore** — indizio pericolo (Master). *1 Carta, 1 Frammento onirico*

### Potere 3
- **Ofuda della Purificazione** — corruzione onirica minore / residuo Kyōfu. *2 Carte, 1 Frammento onirico*
- **Ofuda del Sonno Quieto** — nessuna intrusione onirica fino all'alba. *2 Carte, 1 Erba rara*
- **Ofuda della Lettura** *(Yumetoki)* — sogno: verità + avvertimento. *1 Carta, 1 Frammento onirico*

### Potere 4
- **Ofuda dell'Esorcismo** *(Jareiba, capstone)* — scaccia Kyōfu minore / spezza possessione. *3 Carte, 2 Frammenti onirici*
- **Ofuda del Grande Scudo** — 17 danni (T4). *3 Carte, 1 Componente fine*
- **Ofuda del Sigillo** — sigilla luogo/oggetto/varco (Integrità 12). *3 Carte, 1 Frammento onirico*

### Potere 5 *(Kokū no Koe, sempre mod)*
- **Ofuda del Vuoto** — rito unico concordato (bandire, rivelare, consacrare). *4 Carte, 3 Frammenti onirici, 1 Trofeo maggiore*

---

# JUNKLIST — comune a tutte le classi

Oggetti senza valore d'uso: esplorazione, saccheggio, bottino minore. **Smantellare** in materiali richiede tool di classe (Artigiano: tutto; altre: solo voci del proprio dominio tra parentesi).

**Metallo e meccanica**
- Lattine e scatolame arrugginito → 1 Rottame metallico
- Utensili spezzati → 1 Rottame metallico
- Elettrodomestico sventrato → 2 Rottami metallici, 1 Componente meccanico
- Orologio fermo → 1 Componente fine *(#Medico)*
- Serratura divelta → 1 Componente meccanico

**Stoffa, cuoio, legno**
- Abiti del vecchio mondo → 2 Stoffe
- Scarpe spaiate → 1 Cuoio
- Mobili sfasciati → 2 Legni
- Ombrello rotto → 1 Stoffa, 1 Rottame metallico

**Chimica e medicina** *(#Medico)*
- Flaconi scaduti → 1 Reagente
- Kit di pronto soccorso saccheggiato → 1 Stoffa, 1 Reagente
- Batterie corrose → 1 Reagente

**Natura e caccia** *(#Cacciatore)*
- Carcassa fresca → 1 Carne, 1 Cuoio
- Nido abbandonato → 1 Erba comune
- Ossa sbiancate → 1 Componente fine

**Carta e culto** *(#Sacerdote)*
- Libri gonfi d'umidità → 2 Carte
- Fotografie sbiadite → 1 Carta
- Piccolo altare domestico (butsudan) → 2 Carte, 1 Legno
- Amuleto esaurito → 1 Carta, 1 Frammento onirico *(raro)*

**Materiali risultanti:** Rottame metallico · Componente meccanico · Componente fine · Stoffa · Cuoio · Legno · Carta · Reagente · Erba comune · Erba rara *(solo raccolta)* · Carne / Carne pregiata · Frammento onirico · Trofeo / Trofeo maggiore.

**Politico:** nessun materiale (voluto). Opzione futura: voce junk «Oggetto di valore» come tangente per Patti ad alto Peso — non in scope attuale.
