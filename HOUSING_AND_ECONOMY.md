# Housing system e economia (Banca, Shop, Lavori)

Riepilogo di cosa è stato portato dal vecchio progetto (OYASUMI) al nuovo (o-prototype) e stato attuale.

## Banca (Tesoreria)

- **Conto corrente**: saldo REM, storico movimenti (ledger con tipo SALARY, TRANSFER, RENT, ecc.).
- **Bonifici**: invio REM a un altro personaggio per **nome PG** (destinatario, importo, causale). Backend: `POST /banca/me/transfer`.
- **Arubaito (lavoro)**:
  - Lista lavori da DB (`/banca/jobs`), scelta lavoro (`POST /banca/me/job`), ritiro stipendio giornaliero (`POST /banca/me/withdraw-salary`).
  - **Lascia impiego**: `POST /banca/me/leave-job` (imposta `jobId` a null). Nel vecchio progetto c’era un vincolo di 10 giorni dall’assunzione; nel nuovo al momento non c’è (si può aggiungere in futuro con `jobStartedAt` su character).

## Shop (Marketplace — Emporio)

- Lista oggetti (`/shop/items`), acquisto (`/shop/buy`), vendita da inventario con prezzo (`/shop/sell`).
- UI: finestra “Shop” dalla sidebar, stile allineato al resto della dashboard.

## Housing (Immobiliare)

- **Tipologie di abitazione** da DB (`housing_types`): codice, nome, m², affitto giornaliero (es. Stanza dell’Ordine), affitto mensile, bonus HP, bonus slot inventario.
- **Assegnazione**: `POST /housing/assign` con `housingTypeId`. Se il personaggio ha già una casa, viene sostituita.
- **Affitto mensile**: scadenza (15 del mese), pagamento manuale `POST /housing/pay-rent`, solleciti SMS dal personaggio **Locatario** (daily tick), addebito automatico il 15 se il saldo basta.
- **Affitto giornaliero**: per la Stanza dell’Ordine, detrazione automatica allo stipendio (logica in `calculateSalary` e daily-tick se abilitato).
- **Rimozione**: `POST /housing/remove` (diventa “senzatetto”).
- **Chat casa**: per le case con `chatRoomId` (affitto mensile), il personaggio ha una chat privata della casa; pulsante “Chat Casa” apre quella room dalla dashboard.
- **Inventario**: gli slot bonus dell’abitazione sono usati dall’inventario (location `HOUSING`); spostamento oggetti da/in casa dalla scheda personaggio.

### Cosa è “completo” e cosa è opzionale

- **Completo**: assegnazione casa, pagamento affitto mensile, rimozione, chat casa, bonus HP/slot, integrazione stipendio con affitto giornaliero.
- **Opzionale / da estendere**:
  - **Daily tick**: sfratto (8 del mese successivo), solleciti Locatario via SMS, addebito automatico il 15 — `housing-monthly-rent.service.ts`; seed NPC con `scripts/seed-locatario.ts`.
  - **Descrizione abitazione**: nel vecchio progetto le case avevano un campo `description`; nello schema attuale `housing_types` non ce l’ha. Si può aggiungere una colonna `description` se serve in UI/admin.
  - **Vincolo “lascia lavoro” 10 giorni**: si può introdurre una colonna `job_started_at` su `characters` e rifiutare `leave-job` se non sono passati 10 giorni.

## Lavori (Jobs)

- Tabella `jobs`: titolo, descrizione, `daily_salary` (REM/giorno).
- I lavori sono gestiti da backend/DB; la lista è esposta in Banca → tab Lavoro. Nessun “copione” hardcoded come nel vecchio Banca.jsx (JOBS array).
