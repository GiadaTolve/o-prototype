# Audit sicurezza sistema Chat

*Verifica effettuata: Marzo 2026*

## Riepilogo correzioni applicate

### 1. Sessioni giocate (congelate, chiuse, annullate)

**Problema:** Nessun controllo di autorizzazione su `freeze`, `resume`, `close`, `cancel`, `refresh-participants`. Un utente autenticato poteva modificare sessioni altrui.

**Correzione:** Solo il **creatore** della sessione oppure **Admin/Mod/Capo-Shinigami** possono:
- Congelare / riavviare / chiudere / annullare
- Aggiornare i partecipanti

### 2. Elenco sessioni per personaggio

**Problema:** `GET /game-sessions/character/:characterId` restituiva le sessioni di **qualsiasi** personaggio. Possibile enumerare le giocate altrui.

**Correzione:** L’utente può consultare **solo** le sessioni del proprio personaggio (`params.characterId === char.id`).

### 3. Lunghezza messaggi chat

**Problema:** Nessun limite server-side. Un client modificato poteva inviare messaggi molto lunghi (es. 1MB).

**Correzione:**
- `insertMessage`: limite **2000 caratteri**
- `POST /chat/global-message`: `maxLength: 2000` nel validatore Elysia

---

## Componenti verificati (senza problemi critici)

| Componente | Stato |
|------------|-------|
| **WebSocket auth** | JWT verificato all’open |
| **Shadowban** | Messaggi non persistiti né trasmessi |
| **Rate limiter** | 10 msg/60s per characterId |
| **Global Message** | Solo Admin/Mod/Capo |
| **Pulisci chat** | Solo Admin/Mod/Shinigami |
| **Accesso housing** | `canAccessPrivateChatAsync` prima di join/invio |
| **Circus (Paradise)** | Stanza deve essere aperta; nome animale da server |
| **Risoluzione dadi** | Sintassi strettamente validata, nessuna injection |
| **Shinepoints** | Derivate da `quest_votes`; voti gestiti dal modulo quests |

---

## Raccomandazioni future

1. **Rate limiter**  
   Attualmente in-memory (si resetta al riavvio). Per deploy multi-istanza valutare Redis o equivalente.

2. **Feedback WebSocket su errore**  
   Se `insertMessage` fallisce (rate limit, lunghezza), il client non riceve un messaggio di errore esplicito; si può estendere il protocollo WS.

3. **GET /game-sessions/:id**  
   Per le room pubbliche la sessione è leggibile da tutti. Se servono dati più sensibili, valutare restrizioni aggiuntive.
