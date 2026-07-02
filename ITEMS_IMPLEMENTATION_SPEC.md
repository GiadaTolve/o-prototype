# Sistema Oggetti — Spec implementativa (Fase 1)

> **Prerequisito design:** `ECONOMY_ITEMS_SPEC.md` §2  
> **Domain:** `@domain/economy` · **DB:** `items` (catalogo) + `inventory` (istanze)

## Modello dati

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

**Regola stack:** categorie stackable → una riga, `quantity` > 1. Equipaggiamento/costrutti con integrità → `quantity = 1`, righe separate.

### Slot inventario

```
slot occupati (CARRY) = Σ inventory_slot_cost per riga location=CARRY
cap CARRY = baseSlots(5) + bagBonus + housingNonApplicato
```

Pickup/add bloccato se `occupied + slotCost > cap`.

## Seed Fase 1

Senza lista esterna: script `seed-item-catalog.ts` genera da domain:

- 18 voci **junk** (`junk-*` → `junk_template_id`)
- 15 voci **materiale** (`mat-*` → `material_id`)

Blueprint/craft/consumabili: Fase 2 (dopo tool Medico/Artigiano).

## API (Fase 1)

`GET /inventory/me` espone per ogni riga:

```ts
{
  category, integrityCurrent, integrityMax, effectText,
  inventorySlotCost, origin, craftedByName, blueprintId,
  isBroken, isMarketable
}
```

`POST /inventory/me/add` (staff/mod o future drop): accetta `catalogKey` o `itemId`, `origin`, opz. firma.

## Domain helpers

- `usesIntegrity(category)` 
- `isItemBroken(integrityCurrent, integrityMax)`
- `getInventorySlotCost(item)`
- `canStackCategory(category)`
- `isMarketableCategory(category)`

## Fuori scope Fase 1

- Drop chat `/drop` (Fase 2)
- Smantellamento tool (Fase 3)
- Mercato Banco/Piazza (Fase 4)
- UI client scheda oggetto completa

## Checklist

- [x] Spec implementativa
- [x] Schema Drizzle (`items` + `inventory` colonne economy)
- [x] Seed catalogo junk + materiali (`scripts/seed-item-catalog.ts`)
- [x] Inventory service slot cost + campi `economy` in risposta
- [x] Test domain `items.ts`
- [ ] `db:push` su ambiente con DATABASE_URL
- [ ] UI client scheda oggetto
- [x] Smantellamento Artigiano API — `ITEMS_IMPLEMENTATION_SPEC` + `/artigiano/me/dismantle`
