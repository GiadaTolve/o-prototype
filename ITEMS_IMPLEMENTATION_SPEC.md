# Sistema Economia Oggetti — Spec implementativa (Fasi 1–4)

> **Design:** `ECONOMY_ITEMS_SPEC.md`  
> **Domain:** `@domain/economy` · **DB:** `items`, `inventory`, tabelle drop/mercato

## Stato (Luglio 2026)

| Fase | Stato | Surface |
|------|-------|---------|
| 1 Oggetti | ✅ | schema, seed, slot cost, `GET /inventory/me` |
| 2 Drop chat | ✅ | Pannelli Cedi Drop + A terra/Prendi; `GET /drop/ground/:roomId`, `GET /drop/panel-data` |
| 3 Smantellamento | ✅ | `POST /artigiano/me/dismantle` (solo Artigiano) |
| 4 Mercato | ✅ | `GET/POST /market/banco/*`, `GET/POST/DELETE /market/piazza/*` |

**Fuori scope (prossimo blocco):** tool Artigiano smantellamento UI, baratto Piazza, craft da blueprint.

**UI Mercato (Step 3):** finestra `mercato` nel dashboard — Il Banco (vendi/compra) + La Piazza (inserzioni, feed).

---

## Fase 1 — Modello dati

### Catalogo (`items`)

Template condiviso — stesso `itemId` per stack di junk/materiali/consumabili.

| Colonna | Tipo | Note |
|---------|------|------|
| `catalog_key` | text UNIQUE | es. `junk-lattine`, `mat-stoffa` — id stabile per seed |
| `category` | text | junk · materiale · consumabile · equipaggiamento · costrutto_materiale · oggetto_trama |
| `integrity_max` | int? | default max Integrità (equip/costrutti) |
| `effect_text` | text? | "Scudo 4", "+5 HP", ecc. |
| `inventory_slot_cost` | int | slot occupati (default 1) |
| `junk_template_id` | text? | → `JUNK_ITEMS[].id` |
| `material_id` | text? | → `EconomyMaterialId` |
| `blueprint_id` | text? | → `SOCIAL_BLUEPRINTS[].id` (craft) |
| `is_stackable` | bool | junk/materiale/consumabile = true |
| `type` | legacy | GENERIC/WEAPON/ARMOR/BAG — zaini restano `BAG` |

### Istanza (`inventory`)

| Colonna | Tipo | Note |
|---------|------|------|
| `integrity_current` | int? | null se non usa integrità |
| `origin` | text? | craftato · droppato · comprato |
| `crafted_by_character_id` | uuid? | FK characters |
| `crafted_by_name` | text? | firma lore |
| `blueprint_id` | text? | ricetta usata (craft) |
| `location` | text | `CARRY` · `HOUSING` · `MARKET` (inserzione Piazza) |

**Regola stack:** categorie stackable → una riga, `quantity` > 1. Equipaggiamento/costrutti con integrità → `quantity = 1`, righe separate.

### Slot inventario

```
slot occupati (CARRY) = Σ inventory_slot_cost per riga location=CARRY
cap CARRY = baseSlots(5) + bagBonus + housingNonApplicato
```

Pickup/add bloccato se `occupied + slotCost > cap`.

## Seed Fase 1

Senza lista esterna: script `seed-item-catalog.ts` genera da domain:

- 19 voci **junk** (`junk-*` → `junk_template_id`)
- 16 voci **materiale** (`mat-*` → `material_id`, include `carburante`)
- 35 voci **equip mercato** (`equip-*`, `consumable-kaen-bin` → `market-equipment-catalog.ts`)

Blueprint/craft/consumabili: tool Shakai Kaikyū (blocco successivo).

## API Fase 1

`GET /inventory/me` espone per ogni riga:

```ts
{
  category, integrityCurrent, integrityMax, effectText,
  inventorySlotCost, origin, craftedByName, blueprintId,
  isBroken, isMarketable, location  // CARRY | HOUSING | MARKET
}
```

`POST /inventory/me/add` (staff/mod o future drop): accetta `catalogKey` o `itemId`, `origin`, opz. firma.

Oggetti con `location: MARKET` sono in vendita sulla Piazza (non contano negli slot CARRY).

## API Fase 2 — Drop

| Surface | Descrizione |
|---------|-------------|
| WS `[DROP]{…}` | Master — drop oggetto/tabella (pannello **Cedi Drop**) |
| WS `[PRENDI]{catalogKey}` | PG — raccoglie da terra (pannello **A terra**) |
| `GET /drop/ground/:roomId` | Stato loot scena |
| `GET /drop/panel-data` | Catalogo + tabelle per Cedi Drop (staff) |
| `GET/PUT /economy-admin/drop-tables` | Liste loot in Sviluppo |
| `GET/PUT /economy-admin/drop-pools` | Pool → catalog key |

## API Fase 3 — Smantellamento (solo Artigiano)

| Endpoint | Descrizione |
|----------|-------------|
| `GET /artigiano/me/dismantle/status` | Usi giornalieri (max 10 UTC), gate `shokunin ≥ 1` |
| `GET /artigiano/me/dismantle/inventory` | Junk/equip rotto con flag `canDismantle` |
| `POST /artigiano/me/dismantle` | `{ inventoryIds[] }` — max 10/giorno, resa da junklist |

## API Fase 4 — Mercato

| Endpoint | Descrizione |
|----------|-------------|
| `GET /market/banco/catalog` | Listino NPC |
| `POST /market/banco/sell` | `{ inventoryId }` |
| `POST /market/banco/buy` | `{ catalogKey, quantity? }` |
| `GET /market/piazza/listings` | Inserzioni attive |
| `GET /market/piazza/me/listings` | Mie inserzioni |
| `POST /market/piazza/listings` | `{ inventoryId, priceRem }` — max 5 attive |
| `DELETE /market/piazza/listings/:id` | Annulla |
| `POST /market/piazza/listings/:id/buy` | Acquisto (commissione 10%) |
| `GET /market/piazza/feed` | Feed scambi |

## Domain helpers

- `usesIntegrity(category)` 
- `isItemBroken(integrityCurrent, integrityMax)`
- `getInventorySlotCost(item)`
- `canStackCategory(category)`
- `isMarketableCategory(category)`

## DB aggiuntivo (Fasi 2–4)

| Tabella | Uso |
|---------|-----|
| `scene_ground_loot` | Loot a terra per stanza |
| `economy_drop_tables` | Tabelle drop pesate (runtime, Sviluppo) |
| `economy_drop_pools` | Pool → catalog key (runtime, Sviluppo) |
| `drop_table_daily_usage` | Anti-farming tabella drop |
| `dismantle_daily_usage` | Tetto smantellamento Artigiano |
| `market_listings` | Inserzioni Piazza |
| `market_trade_feed` | Feed pubblico scambi |

## Deploy

```bash
cd apps/server && bun run db:push
bun run seed-item-catalog   # dalla root o apps/server
```

## Checklist

- [x] Fase 1 — schema, seed, inventory slot cost
- [x] Fase 2 — drop WS + ground loot + anti-farming
- [x] Fase 3 — dismantle API Artigiano
- [x] Fase 4 — mercato Banco + Piazza
- [x] Test domain `packages/domain/src/economy/*.test.ts`
- [ ] `db:push` su ambiente con DATABASE_URL (Mac)
- [ ] UI client (scheda oggetto, tool Artigiano)
- [x] UI client — pannello Mercato (Banco + Piazza)
