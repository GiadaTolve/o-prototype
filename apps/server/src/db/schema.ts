import { pgTable, text, integer, uuid, boolean, jsonb, timestamp, date, unique, foreignKey, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ==========================================
// 1. UTENTI (Account Globale)
// ==========================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  
  // Ruoli di sistema (non di gioco)
  role: text('role').$type<'PLAYER' | 'ADMIN' | 'MASTER'>().default('PLAYER'),
  
  // Gestione Ban (Shadowban non invia messaggi in chat)
  banState: text('ban_state').$type<'NONE' | 'SHADOW' | 'FULL'>().default('NONE'),

  /** Preferenze espresse in chat Yume-chan alla registrazione (visibile a staff) */
  playerPreferences: text('player_preferences'),
  
  createdAt: timestamp('created_at').defaultNow()
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow()
})

// ==========================================
// 2. LAVORI (Jobs)
// ==========================================
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(), 
  description: text('description'),
  dailySalary: integer('daily_salary').notNull().default(20), // Default 20 REM come da regole
  createdAt: timestamp('created_at').defaultNow()
})

// ==========================================
// 3. PERSONAGGI (Identità & Progressione)
// ==========================================
export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), 
  
  // --- IDENTITÀ VISIVA ---
  name: text('name').notNull(),
  surname: text('surname'), // Assegnato dopo la creazione
  bio: text('bio'), 
  avatar: text('avatar'),      // Immagine Grande (300x400)
  miniAvatar: text('mini_avatar'), // Icona (100x100) per Chat/Forum
  
  // --- METADATI UI (Dark Arcane) ---
  // Gestisce icone specifiche per l'interfaccia senza creare colonne infinite
  uiMetadata: jsonb('ui_metadata').$type<{
    roleIcon?: string;    // Icona del ruolo pixel-art
    orderIcon?: string;   // Icona specifica dell'ordine
    themeColor?: string;  // Eventuale override colore neon
    /** Background personalizzato della scheda personaggio. */
    backgroundImage?: string;
    /** URL tema musicale (.mp3) per la scheda. */
    themeMusicUrl?: string;
    /** Banner PG in fondo scheda (banner_pg). */
    bannerPg?: string;
  /** Pixel-icon premio speciale (GAME_LAYOUT_SPEC). */
  premioSpeciale?: string;
  /** Slot passivi Waza sbloccati (2–6, default 2). */
  passiveSlotsUnlocked?: number;
  /** skillId equipaggiati negli slot passivi (ordine = slot). */
  equippedPassiveIds?: string[];
  /** Stile principale Esagono */
  primaryStyleId?: string;
  /** Stili Dō sbloccati con Key */
  unlockedStyleIds?: string[];
  /** Tōrō attivo: mano a contatto con l'arma. */
  toroWeaponInContact?: boolean;
  }>().default({}),

  // --- RUOLO SOCIALE ---
  order: text('order').$type<'MUGEN-TAI' | 'CHISEN-TAI' | 'NONE'>().default('NONE'),
  grade: text('grade').default('Nemuribito'), // Grado gerarchico
  /** Alias assegnato da Shinigami / Moderatori / staff. */
  staffAlias: text('staff_alias'),
  /** Note interne Master (solo Master+ possono modificare). */
  masterNotes: text('master_notes'),
  jobId: uuid('job_id').references(() => jobs.id),

  // --- ECONOMIA & VALUTE ---
  rem: integer('rem').default(0).notNull(), // Valuta principale (Soldi)
  
  // Exp Totale: Determina il Livello (non cala mai)
  experienceTotal: integer('experience_total').default(0).notNull(), 
  // Exp Spendibile: Valuta per comprare Skill/Waza
  experienceSpendable: integer('experience_spendable').default(0).notNull(),
  
  // Valute Rare (per Skill Tree)
  keys: integer('keys').default(0).notNull(), // Sblocca rami (Appendici)
  /** @deprecated v3 — non usare in UI/API; colonna mantenuta per compat DB */
  gems: integer('gems').default(0).notNull(),

  /** Madoshō approvata dallo staff (non scelta in registrazione). UltimateManual */
  madoshoId: text('madosho_id').$type<
    'ringai-janjae' | 'gokaon' | 'komonoire' | 'nakigara' | 'ikiryo' | 'hataori'
  >(),

  // --- STATISTICHE BASE (I 5 Pilastri) ---
  // Esplose in colonne per permettere calcoli nel Domain e Query veloci
  strength: integer('strength').default(0).notNull(),     // Forza [F]
  constitution: integer('constitution').default(0).notNull(), // Costituzione [C]
  dexterity: integer('dexterity').default(0).notNull(),   // Destrezza [D]
  mind: integer('mind').default(0).notNull(),             // Mente [M]
  empathy: integer('empathy').default(0).notNull(),       // Empatia [E]

  /** Punti Skiru per id (UltimateManual). Vuoto → derivato da stats legacy. */
  skiruSheet: jsonb('skiru_sheet').$type<Record<string, number>>().default({}).notNull(),

  /** HP correnti in combattimento; null = pieni (hpMax). */
  currentHp: integer('current_hp'),

  /** Stato Chrono Stack (CS, accumulo Tenkan, Overheat). */
  chronoStackState: jsonb('chrono_stack_state')
    .$type<{
      current: number
      accumulating: boolean
      overheatTurns: number
      skipNextTurn: boolean
    }>()
    .default({
      current: 0,
      accumulating: false,
      overheatTurns: 0,
      skipNextTurn: false,
    })
    .notNull(),
  
  // --- INVENTARIO BASE ---
  // Slot "corporei" di default (Braccia, Gambe, Busto)
  baseSlots: integer('base_slots').default(5).notNull(),

  // --- FLAGS ---
  /** @deprecated — PG attivo alla registrazione; mantenuto per compat DB */
  isRaw: boolean('is_raw').default(false).notNull(),
  
  createdAt: timestamp('created_at').defaultNow()
})

export const characterPlayerRequests = pgTable(
  'character_player_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    characterId: uuid('character_id')
      .references(() => characters.id, { onDelete: 'cascade' })
      .notNull(),
    kind: text('kind').$type<
      'MADOSHO' | 'ORDER' | 'SKIRU_ESCLUSIVA' | 'PREMIO' | 'TENKAN'
    >().notNull(),
    requestedValue: text('requested_value').notNull(),
    status: text('status')
      .$type<'PENDING' | 'APPROVED' | 'REJECTED'>()
      .default('PENDING')
      .notNull(),
    /** true dopo approvazione: il giocatore non può reinviare finché lo staff non sblocca. */
    locked: boolean('locked').default(false).notNull(),
    staffNote: text('staff_note'),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [unique().on(t.characterId, t.kind)],
)

/** Status combattimento attivi sul PG. */
export const characterStatusEffects = pgTable(
  'character_status_effects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    characterId: uuid('character_id')
      .references(() => characters.id, { onDelete: 'cascade' })
      .notNull(),
    statusId: text('status_id').notNull(),
    stacks: integer('stacks').notNull().default(1),
    targetKind: text('target_kind').$type<'character' | 'construct'>().default('character').notNull(),
    /** Riferimento costrutto sul campo. */
    constructRef: text('construct_ref'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [unique().on(t.characterId, t.statusId)],
)

/** Costrutti sul campo — creati da Jigo-Ka, persistenza fino a distruzione. */
export const fieldConstructs = pgTable('field_constructs', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorCharacterId: uuid('creator_character_id')
    .references(() => characters.id, { onDelete: 'cascade' })
    .notNull(),
  label: text('label').notNull().default('Costrutto'),
  size: text('size').$type<'piccola' | 'media' | 'grande' | 'enorme'>().default('media').notNull(),
  wazaTier: integer('waza_tier').notNull().default(1),
  genkai: integer('genkai').notNull().default(0),
  maxResistance: integer('max_resistance').notNull(),
  remainingResistance: integer('remaining_resistance').notNull(),
  stationary: boolean('stationary').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ==========================================
// 4. IL GRIMOIRE (Sistema Skills)
// ==========================================

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  name: text('name').notNull(),
  description: text('description'),
  /** Testo effetto waza (authoring Sviluppo). */
  effect: text('effect'),
  // Distinzione tra Passive (Skiru), Attive (Waza) e Patti (Path)
  type: text('type').$type<'SKIRU' | 'WAZA' | 'PATH'>().notNull(), 
  
  // Costi di Apprendimento
  costExp: integer('cost_exp').default(0),
  costKeys: integer('cost_keys').default(0), // Richiede Keys per sbloccare il ramo?
  
  // Meccaniche di Gioco
  costJigoka: integer('cost_jigoka').default(0), // Costo in Mana (Jigoka)
  /** Tier waza v3 (es. "T1" … "T5"). */
  rank: text('rank'),
  /** Waza sempre attiva. */
  isPassive: boolean('is_passive').default(false).notNull(),
  /** Slug stabile (wazaPool / catalogo Dō Ultimate Manual). */
  poolId: text('pool_id'),
  /** Ramo Esagono: toka | genzai | ito | naikan | hensei | hado */
  styleId: text('style_id'),
  /** Skiru di lancio (id catalogo, lowercase). */
  launchSkiruIds: jsonb('launch_skiru_ids').$type<string[] | null>(),
  /** Skiru per indice danno (CAC/CAD). */
  damageSkiruIds: jsonb('damage_skiru_ids').$type<string[] | null>(),
  damageIndexKind: text('damage_index_kind').$type<'CAC' | 'CAD' | null>(),
  /** Lignaggio Madoshō (Parte IV) — mutualmente esclusivo con styleId. */
  madoshoId: text('madosho_id').$type<
    'ringai-janjae' | 'gokaon' | 'komonoire' | 'nakigara' | 'ikiryo' | 'hataori'
  >(),
  cooldown: integer('cooldown').default(0),
  diceFormula: text('dice_formula'), // Es: "1d20 + $M"

  createdAt: timestamp('created_at').defaultNow()
})

export const characterSkills = pgTable('character_skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  skillId: uuid('skill_id').references(() => skills.id).notNull(),
  
  // Livello della Skill (Upgradabile spendendo GEMS)
  level: integer('level').default(1),
  
  createdAt: timestamp('created_at').defaultNow()
})

// ==========================================
// 4b. BESTIARIO (PNG — Personaggi Non Giocanti)
// ==========================================

/** Catalogo globale dei PNG esistenti e persistenti. Categorie: Holic, Phobias, Muen. */
export const creatures = pgTable('creatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  /** Categoria: Holic, Phobias, Muen. */
  category: text('category').$type<'HOLIC' | 'PHOBIAS' | 'MUEN'>().notNull(),
  /** Stats opzionali per lore/combat. */
  stats: jsonb('stats').$type<{ hp?: number; attack?: number; defense?: number; [k: string]: unknown }>(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ==========================================
// 5. INVENTARIO (Oggetti & Slot)
// ==========================================

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Chiave stabile per seed/sync (es. junk-lattine, mat-stoffa). */
  catalogKey: text('catalog_key').unique(),
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  type: text('type').$type<'GENERIC' | 'WEAPON' | 'ARMOR' | 'BAG'>().default('GENERIC'),
  /** junk · materiale · consumabile · equipaggiamento · costrutto_materiale · oggetto_trama */
  category: text('category').$type<
    'junk' | 'materiale' | 'consumabile' | 'equipaggiamento' | 'costrutto_materiale' | 'oggetto_trama'
  >().default('junk'),
  integrityMax: integer('integrity_max'),
  effectText: text('effect_text'),
  /** Slot inventario occupati da questa riga (default 1). */
  inventorySlotCost: integer('inventory_slot_cost').default(1).notNull(),
  junkTemplateId: text('junk_template_id'),
  materialId: text('material_id'),
  blueprintId: text('blueprint_id'),
  isStackable: boolean('is_stackable').default(true).notNull(),

  // Se è uno Zaino, quanti slot aggiunge all'inventario?
  slotsBonus: integer('slots_bonus').default(0),
  /** Prezzo in REM (null = non in vendita). */
  price: integer('price'),

  createdAt: timestamp('created_at').defaultNow()
})

export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  itemId: uuid('item_id').references(() => items.id).notNull(),

  quantity: integer('quantity').default(1),
  isEquipped: boolean('is_equipped').default(false), // Importante per applicare slotBonus
  /** Dove si trova fisicamente l'oggetto: CARRY, HOUSING, o MARKET (inserzione Piazza). */
  location: text('location').$type<'CARRY' | 'HOUSING' | 'MARKET'>().default('CARRY').notNull(),

  integrityCurrent: integer('integrity_current'),
  origin: text('origin').$type<'craftato' | 'droppato' | 'comprato'>(),
  craftedByCharacterId: uuid('crafted_by_character_id').references(() => characters.id),
  craftedByName: text('crafted_by_name'),
  blueprintId: text('blueprint_id'),

  createdAt: timestamp('created_at').defaultNow()
})

/** Loot a terra in una scena/chat (modalità /drop @aterra). */
export const sceneGroundLoot = pgTable('scene_ground_loot', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: text('room_id').notNull(),
  catalogKey: text('catalog_key').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  createdByCharacterId: uuid('created_by_character_id').references(() => characters.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/** Anti-farming: drop da tabella per PG per giornata UTC. */
export const dropTableDailyUsage = pgTable(
  'drop_table_daily_usage',
  {
    characterId: uuid('character_id')
      .references(() => characters.id)
      .notNull(),
    dayKey: text('day_key').notNull(),
    count: integer('count').default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.dayKey] })],
)

/** Smantellamento Artigiano — max 10/giorno UTC. */
export const dismantleDailyUsage = pgTable(
  'dismantle_daily_usage',
  {
    characterId: uuid('character_id')
      .references(() => characters.id)
      .notNull(),
    dayKey: text('day_key').notNull(),
    count: integer('count').default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.dayKey] })],
)

// ==========================================
// 5b. GRADI e LIVELLI (QUEST_AND_FETCH_SPEC)
// ==========================================

/** Gradi carriera (es. Analisti). Livelli Guida = range livello personaggio. */
export const grades = pgTable('grades', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  definition: text('definition'),
  levelMin: integer('level_min').notNull(),
  levelMax: integer('level_max').notNull(), // use 999 per 48+
  createdAt: timestamp('created_at').defaultNow(),
})

/** Lookup livelli 1–50: Exp Δ, Exp tot., fase. Per calcolo livello da EXP e requisiti Fetch. */
export const levels = pgTable('levels', {
  level: integer('level').primaryKey(),
  expDelta: integer('exp_delta'),
  expTotal: integer('exp_total').notNull(),
  phase: text('phase').$type<'EARLY-GAME' | 'MID-GAME' | 'CORE'>(),
})

/** Meteo per prefettura (modificabile da admin/mod). */
export const meteoPrefetture = pgTable('meteo_prefetture', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Prefettura ID (es. edo, kessen, kotowari). */
  prefetturaId: text('prefettura_id').notNull().unique(),
  temp: integer('temp').notNull(),
  condition: text('condition').notNull(),
  icon: text('icon').$type<'sun' | 'cloud' | 'cloud-sun' | 'rain'>().notNull(),
  /** Chi ha aggiornato (admin/mod). */
  updatedById: uuid('updated_by_id').references(() => characters.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ==========================================
// 6. RELAZIONI (Drizzle Relations)
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
}))

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, { fields: [characters.userId], references: [users.id] }),
  job: one(jobs, { fields: [characters.jobId], references: [jobs.id] }),
  skills: many(characterSkills),
  inventory: many(inventory),
  zoneMessages: many(zoneMessages),
  playerRequests: many(characterPlayerRequests),
  statusEffects: many(characterStatusEffects),
  fieldConstructs: many(fieldConstructs),
}))

export const characterPlayerRequestsRelations = relations(characterPlayerRequests, ({ one }) => ({
  character: one(characters, {
    fields: [characterPlayerRequests.characterId],
    references: [characters.id],
  }),
  reviewedBy: one(users, {
    fields: [characterPlayerRequests.reviewedByUserId],
    references: [users.id],
  }),
}))

export const characterStatusEffectsRelations = relations(characterStatusEffects, ({ one }) => ({
  character: one(characters, {
    fields: [characterStatusEffects.characterId],
    references: [characters.id],
  }),
}))

export const fieldConstructsRelations = relations(fieldConstructs, ({ one }) => ({
  creator: one(characters, {
    fields: [fieldConstructs.creatorCharacterId],
    references: [characters.id],
  }),
}))

export const skillsRelations = relations(skills, ({ many }) => ({
  learnedBy: many(characterSkills),
}))

export const characterSkillsRelations = relations(characterSkills, ({ one }) => ({
  character: one(characters, { fields: [characterSkills.characterId], references: [characters.id] }),
  skill: one(skills, { fields: [characterSkills.skillId], references: [skills.id] }),
}))

export const inventoryRelations = relations(inventory, ({ one }) => ({
  character: one(characters, { fields: [inventory.characterId], references: [characters.id] }),
  item: one(items, { fields: [inventory.itemId], references: [items.id] })
}))

// ==========================================
// 7. CHAT DI ZONA (Play-by-Chat)
// ==========================================

export const zoneMessages = pgTable('zone_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  zone: text('zone').notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  /** Posizione del giocatore nel luogo (compilata dal giocatore). */
  locationTag: text('location_tag'),
  /** Caratteri netti (senza parlati) per calcolo EXP. */
  netChars: integer('net_chars'),
  /** EXP guadagnato da questo messaggio (calcolato da netChars). */
  expGained: integer('exp_gained'),
  /** Caratteri totali (content.length). 1 azione = messaggio con >500 totali (QUEST_AND_FETCH_SPEC). */
  totalChars: integer('total_chars'),
  /** Se true, è un messaggio globale (visibile in tutte le chat). */
  isGlobal: boolean('is_global').default(false).notNull(),
  /** Chat anonima: nome animale e colore al momento dell'invio (per display storico). */
  anonymousAnimalName: text('anonymous_animal_name'),
  anonymousColor: text('anonymous_color'),
  /** Messaggio masterscreen (Shinigami autore della quest attiva): mantiene formattazione anche dopo chiusura sessione. */
  isMasterscreen: boolean('is_masterscreen').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const zoneMessagesRelations = relations(zoneMessages, ({ one }) => ({
  character: one(characters, { fields: [zoneMessages.characterId], references: [characters.id] }),
}))

// ==========================================
// 7b. NOTE MASTER (per room/chat — modificabili solo da Shinigami)
// ==========================================

export const roomMasterNotes = pgTable('room_master_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Room ID (es. kessen__cosmicon__junk_town). Unique per room. */
  roomId: text('room_id').notNull().unique(),
  /** Note Master (modificabili solo da Shinigami). */
  notes: text('notes'),
  /** Chi ha aggiornato (Shinigami). */
  updatedById: uuid('updated_by_id').references(() => characters.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const roomMasterNotesRelations = relations(roomMasterNotes, ({ one }) => ({
  updatedBy: one(characters, { fields: [roomMasterNotes.updatedById], references: [characters.id] }),
}))

// ==========================================
// 7c. PARTYCHAT (Circus / Spazio Eventi) — chat anonima con regole a sé
// ==========================================

/** Stato stanza anonima: solo admin/mod può aprire/chiudere. Quando chiusa = area interdetta. */
export const anonymousRoomState = pgTable('anonymous_room_state', {
  roomId: text('room_id').primaryKey(),
  isOpen: boolean('is_open').default(false).notNull(),
  openedById: uuid('opened_by_id').references(() => characters.id, { onDelete: 'set null' }),
  openedAt: timestamp('opened_at'),
  /** Nome sessione deciso al toggle ON; usato come titolo della giocata "evento" al toggle OFF. */
  sessionTitle: text('session_title'),
})

/** Partecipanti sessione anonima: nome animale + colore assegnati per la durata della sessione. */
export const anonymousParticipants = pgTable('anonymous_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: text('room_id').notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  animalName: text('animal_name').notNull(),
  color: text('color').notNull(), // hex es. #a78bfa
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => [unique().on(t.roomId, t.characterId)])

/** Quando una chat è stata "pulita": i messaggi prima di cleared_at restano nel DB ma non sono mostrati in chat. Sempre visibili nel Log. */
export const roomCleared = pgTable('room_cleared', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: text('room_id').notNull().unique(),
  clearedAt: timestamp('cleared_at').defaultNow().notNull(),
  clearedById: uuid('cleared_by_id').references(() => characters.id, { onDelete: 'set null' }),
})

// ==========================================
// 8. SMS (Messaggi privati — interfaccia stile WhatsApp)
// ==========================================

export const privateMessages = pgTable('private_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  recipientId: uuid('recipient_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const privateMessagesRelations = relations(privateMessages, ({ one }) => ({
  sender: one(characters, { fields: [privateMessages.senderId], references: [characters.id], relationName: 'pmSender' }),
  recipient: one(characters, { fields: [privateMessages.recipientId], references: [characters.id], relationName: 'pmRecipient' }),
}))

// ==========================================
// 9. QUEST (Shinigami Suite)
// ==========================================

export const questTypeEnum = ['AMBIENT', 'TRAMA', 'BATTLE', 'ONE_SHOT'] as const

export const quests = pgTable('quests', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Shinigami che ha creato la quest. */
  creatorId: uuid('creator_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  /** Tipo: Ambient, Trama, Battle, One-shot, Globale (QUEST_AND_FETCH_SPEC). */
  type: text('type').$type<'AMBIENT' | 'TRAMA' | 'BATTLE' | 'ONE_SHOT' | 'GLOBALE'>().default('AMBIENT').notNull(),
  /** Stato: OPEN, IN_PROGRESS, PAUSED, CLOSED */
  status: text('status').$type<'OPEN' | 'IN_PROGRESS' | 'PAUSED' | 'CLOSED'>().default('OPEN').notNull(),
  /** Room ID dove è stata registrata la quest (auto da chat). */
  roomId: text('room_id'),
  /** Trama a cui appartiene (opzionale). */
  plotId: uuid('plot_id').references(() => plots.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
})

/** Fetch Quest: missioni create da Shinigami, approvate da superiori. Requisiti, limiti frequenza. */
export const fetches = pgTable('fetches', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  /** PENDING_APPROVAL → APPROVED | REJECTED. Solo approvate in bacheca. */
  status: text('status').$type<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>().default('PENDING_APPROVAL').notNull(),
  /** Stato completamento: null = non completata, 'AWAITING_REWARD' = completata in attesa premio/commento, 'COMPLETED' = completata e premiata. */
  completionStatus: text('completion_status').$type<'AWAITING_REWARD' | 'COMPLETED' | null>().default(null),
  /** Timestamp di completamento (quando la giocata è stata pubblicata). */
  completedAt: timestamp('completed_at'),
  /** Requisiti: levelMin/Max, gradeIds[], order[], plotIds[]; limitPerDay, limitPerWeek. */
  requirements: jsonb('requirements').$type<{
    levelMin?: number;
    levelMax?: number;
    gradeIds?: string[];
    order?: ('MUGEN-TAI' | 'CHISEN-TAI')[];
    plotIds?: string[];
    limitPerDay?: number;
    limitPerWeek?: number;
  }>().default({}),
  /** Configurazione premi: minActions, remReward, expReward. Se null, usa valori di default. */
  rewardConfig: jsonb('reward_config').$type<{
    minActions?: number; // Default: 4
    remReward?: number; // REM per partecipante con >= minActions (default: 50)
    expReward?: number; // EXP per partecipante con >= minActions (default: 0)
  }>().default({}),
  /** Commento Shinigami/Admin al responso (quando completa fetch in AWAITING_REWARD). */
  responsoComment: text('responso_comment'),
  approvedById: uuid('approved_by_id').references(() => characters.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/** Assegnazione Fetch: una per fetch, esclusiva. Chi si auto-assegna la prende. */
export const fetchAssignments = pgTable('fetch_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  fetchId: uuid('fetch_id').references(() => fetches.id, { onDelete: 'cascade' }).notNull().unique(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
})

/** Partecipanti a una quest. */
export const questParticipants = pgTable('quest_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  questId: uuid('quest_id').references(() => quests.id, { onDelete: 'cascade' }).notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Se la giocata è una Fetch assegnata al personaggio (QUEST_AND_FETCH_SPEC). */
  fetchId: uuid('fetch_id').references(() => fetches.id, { onDelete: 'set null' }),
  /** Quando ha partecipato (registrato giocata). */
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
})

/** Premi assegnati dopo una quest (tabellario). */
export const questRewards = pgTable('quest_rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  questId: uuid('quest_id').references(() => quests.id, { onDelete: 'cascade' }).notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Tipo: EXP, REM, ITEM, CUSTOM, DROP (materiali Common→Legendary). */
  type: text('type').$type<'EXP' | 'REM' | 'ITEM' | 'CUSTOM' | 'DROP'>().notNull(),
  /** Valore (EXP/REM) o descrizione. Per DROP: description = categoria (Common|Uncommon|Rare|Epic|Legendary). */
  value: integer('value'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/** Voti segreti "Let this character shine!" per una quest. */
export const questVotes = pgTable('quest_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  questId: uuid('quest_id').references(() => quests.id, { onDelete: 'cascade' }).notNull(),
  /** Chi ha votato (anonimo, ma tracciato per evitare doppi voti). */
  voterId: uuid('voter_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Chi è stato votato (il personaggio che "ha brillato"). */
  votedFor: uuid('voted_for').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Motivazione dello Shinigami per l'assegnazione (obbligatoria). */
  motivation: text('motivation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const questsRelations = relations(quests, ({ one, many }) => ({
  creator: one(characters, { fields: [quests.creatorId], references: [characters.id] }),
  plot: one(plots, { fields: [quests.plotId], references: [plots.id] }),
  participants: many(questParticipants),
  rewards: many(questRewards),
  votes: many(questVotes),
}))

export const questParticipantsRelations = relations(questParticipants, ({ one }) => ({
  quest: one(quests, { fields: [questParticipants.questId], references: [quests.id] }),
  character: one(characters, { fields: [questParticipants.characterId], references: [characters.id] }),
  fetch: one(fetches, { fields: [questParticipants.fetchId], references: [fetches.id] }),
}))

export const fetchesRelations = relations(fetches, ({ one, many }) => ({
  creator: one(characters, { fields: [fetches.creatorId], references: [characters.id] }),
  approvedBy: one(characters, { fields: [fetches.approvedById], references: [characters.id], relationName: 'fetchApprover' }),
  assignment: many(fetchAssignments),
}))

export const fetchAssignmentsRelations = relations(fetchAssignments, ({ one }) => ({
  fetch: one(fetches, { fields: [fetchAssignments.fetchId], references: [fetches.id] }),
  character: one(characters, { fields: [fetchAssignments.characterId], references: [characters.id] }),
}))

export const questRewardsRelations = relations(questRewards, ({ one }) => ({
  quest: one(quests, { fields: [questRewards.questId], references: [quests.id] }),
  character: one(characters, { fields: [questRewards.characterId], references: [characters.id] }),
}))

export const questVotesRelations = relations(questVotes, ({ one }) => ({
  quest: one(quests, { fields: [questVotes.questId], references: [quests.id] }),
  voter: one(characters, { fields: [questVotes.voterId], references: [characters.id], relationName: 'voteVoter' }),
  votedFor: one(characters, { fields: [questVotes.votedFor], references: [characters.id], relationName: 'voteTarget' }),
}))

// ==========================================
// 10. REGISTRAZIONI GIOCATA (Game Sessions)
// ==========================================

/** Registrazioni giocata: sessioni di gioco registrate, indipendenti dalle quest. */
export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Chi ha avviato la registrazione. */
  creatorId: uuid('creator_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Room ID dove è stata avviata la registrazione. */
  roomId: text('room_id').notNull(),
  /** Titolo della registrazione (opzionale). */
  title: text('title'),
  /** Fetch associata (opzionale). */
  fetchId: uuid('fetch_id').references(() => fetches.id, { onDelete: 'set null' }),
  /** Quest durante cui è stata registrata (se in sessione quest → isMasterscreen per creator) */
  questId: uuid('quest_id').references(() => quests.id, { onDelete: 'set null' }),
  /** Tipo: STANDARD (giocata normale) | EVENTO (Circus chiuso, visibile come "Evento" nel registro). */
  sessionType: text('session_type').$type<'STANDARD' | 'EVENTO'>().default('STANDARD'),
  /** Stato: ACTIVE, FROZEN, CLOSED, CANCELLED */
  status: text('status').$type<'ACTIVE' | 'FROZEN' | 'CLOSED' | 'CANCELLED'>().default('ACTIVE').notNull(),
  /** Timestamp di inizio registrazione. */
  startedAt: timestamp('started_at').defaultNow().notNull(),
  /** Timestamp di ultima modifica (per congelamento/riavvio). */
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  /** Timestamp di chiusura (quando viene chiusa definitivamente). */
  closedAt: timestamp('closed_at'),
  /** Timestamp di annullamento. */
  cancelledAt: timestamp('cancelled_at'),
})

/** Partecipanti a una registrazione giocata (con conteggio azioni). */
export const gameSessionParticipants = pgTable('game_session_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => gameSessions.id, { onDelete: 'cascade' }).notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Numero di azioni (messaggi con >500 caratteri totali) nella sessione. */
  actionCount: integer('action_count').default(0).notNull(),
  /** Timestamp di prima partecipazione. */
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  creator: one(characters, { fields: [gameSessions.creatorId], references: [characters.id], relationName: 'sessionCreator' }),
  fetch: one(fetches, { fields: [gameSessions.fetchId], references: [fetches.id] }),
  quest: one(quests, { fields: [gameSessions.questId], references: [quests.id] }),
  participants: many(gameSessionParticipants),
}))

export const gameSessionParticipantsRelations = relations(gameSessionParticipants, ({ one }) => ({
  session: one(gameSessions, { fields: [gameSessionParticipants.sessionId], references: [gameSessions.id] }),
  character: one(characters, { fields: [gameSessionParticipants.characterId], references: [characters.id] }),
}))

// ==========================================
// 10b. MERCATO (Banco + Piazza)
// ==========================================

export const marketListings = pgTable('market_listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerCharacterId: uuid('seller_character_id')
    .references(() => characters.id)
    .notNull(),
  inventoryId: uuid('inventory_id')
    .references(() => inventory.id)
    .notNull()
    .unique(),
  priceRem: integer('price_rem').notNull(),
  itemName: text('item_name').notNull(),
  itemCategory: text('item_category').notNull(),
  craftedByName: text('crafted_by_name'),
  quantity: integer('quantity').default(1).notNull(),
  status: text('status').$type<'active' | 'sold' | 'cancelled'>().default('active').notNull(),
  buyerCharacterId: uuid('buyer_character_id').references(() => characters.id),
  soldAt: timestamp('sold_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const marketTradeFeed = pgTable('market_trade_feed', {
  id: uuid('id').defaultRandom().primaryKey(),
  message: text('message').notNull(),
  sellerCharacterId: uuid('seller_character_id').references(() => characters.id),
  buyerCharacterId: uuid('buyer_character_id').references(() => characters.id),
  grossRem: integer('gross_rem'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ==========================================
// 11. LEDGER (Registro Transazioni)
// ==========================================

/** Ledger centrale: tutte le transazioni REM (stipendio, affitto, acquisti, ecc.). */
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Personaggio coinvolto. */
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Tipo di transazione. */
  type: text('type').$type<'SALARY' | 'RENT' | 'PURCHASE' | 'SALE' | 'REWARD' | 'PENALTY' | 'TRANSFER'>().notNull(),
  /** Importo (positivo = entrata, negativo = uscita). */
  amount: integer('amount').notNull(),
  /** Balance dopo la transazione. */
  balanceAfter: integer('balance_after').notNull(),
  /** Descrizione/ragione. */
  description: text('description'),
  /** Metadata aggiuntiva (JSON). */
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  /** Timestamp della transazione. */
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  character: one(characters, { fields: [ledgerEntries.characterId], references: [characters.id] }),
}))

// ==========================================
// 11b. NOTIFICHE DI SISTEMA (es. responso Fetch)
// ==========================================
export const systemNotifications = pgTable('system_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  title: text('title'),
  content: text('content'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const systemNotificationsRelations = relations(systemNotifications, ({ one }) => ({
  character: one(characters, { fields: [systemNotifications.characterId], references: [characters.id] }),
}))

// ==========================================
// 12. HOUSING (Abitazioni)
// ==========================================

/** Tipi di abitazione disponibili. */
export const housingTypes = pgTable('housing_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Codice univoco (es. 'order_room', 'container', 'monolocale', ecc.). */
  code: text('code').notNull().unique(),
  /** Nome descrittivo. */
  name: text('name').notNull(),
  /** Metri quadri. */
  squareMeters: integer('square_meters').notNull(),
  /** Affitto giornaliero (solo per Stanza dell'Ordine, altrimenti null). */
  dailyRent: integer('daily_rent'),
  /** Affitto mensile (per tutte le altre case). */
  monthlyRent: integer('monthly_rent'),
  /** Bonus punti ferita (pf). */
  hpBonus: integer('hp_bonus').default(0).notNull(),
  /** Bonus slot inventario. */
  inventorySlotsBonus: integer('inventory_slots_bonus').default(0).notNull(),
  /** Requisiti speciali (es. 'paradise_pass' per Proprietà nel Paradise). */
  requirements: jsonb('requirements').$type<{
    paradisePass?: boolean;
  }>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
})

/** Abitazioni assegnate ai personaggi. */
export const characterHousing = pgTable('character_housing', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Personaggio. */
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull().unique(),
  /** Tipo di abitazione. */
  housingTypeId: uuid('housing_type_id').references(() => housingTypes.id, { onDelete: 'restrict' }).notNull(),
  /** Room ID per la chat personalizzata della casa (es. housing_container_123). */
  chatRoomId: text('chat_room_id').unique(),
  /** Nome personalizzato per la chat della casa. */
  chatName: text('chat_name'),
  /** URL immagine di sfondo per la chat della casa. */
  chatImage: text('chat_image'),
  /** Descrizione ambientale personalizzata per la chat della casa. */
  chatDescription: text('chat_description'),
  /** Data di inizio affitto. */
  rentedAt: timestamp('rented_at').defaultNow().notNull(),
  /** Prossima scadenza pagamento (15 del mese per affitti mensili). */
  nextDueDate: timestamp('next_due_date'),
  /** Se l'affitto mensile è stato pagato per il mese corrente. */
  hasPaidCurrentMonth: boolean('has_paid_current_month').default(false).notNull(),
  /** Giorni di ritardo nel pagamento. */
  daysOverdue: integer('days_overdue').default(0).notNull(),
  /** Se è stato sfrattato. */
  evicted: boolean('evicted').default(false).notNull(),
  /** Data di sfratto (se applicabile). */
  evictedAt: timestamp('evicted_at'),
})

export const housingTypesRelations = relations(housingTypes, ({ many }) => ({
  tenants: many(characterHousing),
}))

export const characterHousingRelations = relations(characterHousing, ({ one, many }) => ({
  character: one(characters, { fields: [characterHousing.characterId], references: [characters.id] }),
  housingType: one(housingTypes, { fields: [characterHousing.housingTypeId], references: [housingTypes.id] }),
  guests: many(housingGuests),
}))

/** Ospiti invitati nella casa di un personaggio. Solo gli ospiti possono accedere alla chat della casa. */
export const housingGuests = pgTable('housing_guests', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Proprietario della casa (characterId). */
  ownerCharacterId: uuid('owner_character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Ospite invitato (characterId). */
  guestCharacterId: uuid('guest_character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [unique().on(table.ownerCharacterId, table.guestCharacterId)])

export const housingGuestsRelations = relations(housingGuests, ({ one }) => ({
  owner: one(characters, { fields: [housingGuests.ownerCharacterId], references: [characters.id] }),
  guest: one(characters, { fields: [housingGuests.guestCharacterId], references: [characters.id] }),
}))

// ==========================================
// 13. LORE (Trame e Proposte)
// ==========================================

/** Trame: insieme di quest con lo stesso tema. */
export const plots = pgTable('plots', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Titolo della trama. */
  title: text('title').notNull(),
  /** Descrizione/tema della trama. */
  description: text('description'),
  /** Chi ha creato la trama (Shinigami). */
  creatorId: uuid('creator_id').references(() => characters.id, { onDelete: 'set null' }),
  /** Stato: ACTIVE (in corso), COMPLETED, ARCHIVED */
  status: text('status').$type<'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>().default('ACTIVE').notNull(),
  /** Durata stimata (in giorni, opzionale). */
  estimatedDuration: integer('estimated_duration'),
  /** Data di inizio (prima quest collegata). */
  startedAt: timestamp('started_at'),
  /** Data di completamento. */
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/** Proposte di trama: proposte visionabili dai vertici gestionali. */
export const plotProposals = pgTable('plot_proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Titolo della proposta. */
  title: text('title').notNull(),
  /** Descrizione/tema della proposta. */
  description: text('description'),
  /** Chi ha proposto (Shinigami). */
  proposerId: uuid('proposer_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  /** Stato: PENDING (in attesa), APPROVED (accettata, diventa trama), REJECTED (rifiutata) */
  status: text('status').$type<'PENDING' | 'APPROVED' | 'REJECTED'>().default('PENDING').notNull(),
  /** Chi ha approvato/rifiutato (Admin/Mod/Capo). */
  reviewedById: uuid('reviewed_by_id').references(() => characters.id, { onDelete: 'set null' }),
  /** Commento del revisore. */
  reviewComment: text('review_comment'),
  /** Se approvata, ID della trama creata. */
  plotId: uuid('plot_id').references(() => plots.id, { onDelete: 'set null' }),
  /** Data di revisione. */
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const plotsRelations = relations(plots, ({ one, many }) => ({
  creator: one(characters, { fields: [plots.creatorId], references: [characters.id], relationName: 'plotCreator' }),
  quests: many(quests),
}))

export const plotProposalsRelations = relations(plotProposals, ({ one }) => ({
  proposer: one(characters, { fields: [plotProposals.proposerId], references: [characters.id] }),
  reviewedBy: one(characters, { fields: [plotProposals.reviewedById], references: [characters.id], relationName: 'proposalReviewer' }),
  plot: one(plots, { fields: [plotProposals.plotId], references: [plots.id] }),
}))

// ==========================================
// 15. PLAYLISTS & MUSIC (Media Player)
// ==========================================

export const playlists = pgTable('playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const songs = pgTable('songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  playlistId: uuid('playlist_id').references(() => playlists.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(), // URL del file audio o YouTube
  sourceType: text('source_type').$type<'youtube' | 'file' | 'url'>().default('url').notNull(),
  coverImageUrl: text('cover_image_url'), // URL dell'immagine di copertina
  order: integer('order').default(0).notNull(), // Ordine nella playlist
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const playlistsRelations = relations(playlists, ({ many }) => ({
  songs: many(songs),
}))

export const songsRelations = relations(songs, ({ one }) => ({
  playlist: one(playlists, { fields: [songs.playlistId], references: [playlists.id] }),
}))

// ==========================================
// 16. FORUM (Sezioni, Bacheche, Topic, Post)
// ==========================================

export const forumSections = pgTable('forum_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const forumBoards = pgTable('forum_boards', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionId: uuid('section_id').references(() => forumSections.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const forumTopics = pgTable('forum_topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').references(() => forumBoards.id, { onDelete: 'cascade' }).notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const forumPosts = pgTable('forum_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => forumTopics.id, { onDelete: 'cascade' }).notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(), // BBCode supportato
  likeCount: integer('like_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const forumPostLikes = pgTable('forum_post_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => forumPosts.id, { onDelete: 'cascade' }).notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const forumSectionsRelations = relations(forumSections, ({ many }) => ({
  boards: many(forumBoards),
}))

export const forumBoardsRelations = relations(forumBoards, ({ one, many }) => ({
  section: one(forumSections, { fields: [forumBoards.sectionId], references: [forumSections.id] }),
  topics: many(forumTopics),
}))

export const forumTopicsRelations = relations(forumTopics, ({ one, many }) => ({
  board: one(forumBoards, { fields: [forumTopics.boardId], references: [forumBoards.id] }),
  author: one(characters, { fields: [forumTopics.characterId], references: [characters.id] }),
  posts: many(forumPosts),
}))

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  topic: one(forumTopics, { fields: [forumPosts.topicId], references: [forumTopics.id] }),
  author: one(characters, { fields: [forumPosts.characterId], references: [characters.id] }),
  likes: many(forumPostLikes),
}))

export const forumPostLikesRelations = relations(forumPostLikes, ({ one }) => ({
  post: one(forumPosts, { fields: [forumPostLikes.postId], references: [forumPosts.id] }),
  character: one(characters, { fields: [forumPostLikes.characterId], references: [characters.id] }),
}))

// ==========================================
// 17. LOCATIONS (Mappe e Chat)
// ==========================================

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  type: text('type').$type<'MAP' | 'CHAT'>().notNull(),
  imageUrl: text('image_url'),
  /** Banner nell'header della vista mappa (solo per type MAP). */
  bannerUrl: text('banner_url'),
  /** Per quale mappa mostrare il banner: ogon, izayoi, onimori, ezochi, altrove. Se null, si usa lo slug del nome. */
  bannerForGameMap: text('banner_for_game_map'),
  /** Posizione immagine nel ritaglio: center, top, bottom, left, right, left top, right top, left bottom, right bottom, o "x% y%" (es. 30% 20%). */
  bannerPosition: text('banner_position'),
  description: text('description'),
  prefecture: text('prefecture'), // Solo per MAP
  posX: integer('pos_x').default(50).notNull(), // Posizione X in %
  posY: integer('pos_y').default(50).notNull(), // Posizione Y in %
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: 'locations_parent_id_fkey',
  }),
])

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, { fields: [locations.parentId], references: [locations.id], relationName: 'locationHierarchy' }),
  children: many(locations, { relationName: 'locationHierarchy' }),
}))

// ==========================================
// 18. BANNERS
// ==========================================

export const banners = pgTable('banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'),
  isActive: boolean('is_active').default(true).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ==========================================
// 19. DAILY EVENTS (Eventi Giornalieri)
// ==========================================

export const dailyEvents = pgTable('daily_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventDate: date('event_date').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ==========================================
// 20. SANCTIONS (Log Sanzioni Utenti)
// ==========================================

export const sanctions = pgTable('sanctions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').$type<'BAN' | 'SHADOWBAN' | 'WARNING' | 'UNBAN'>().notNull(),
  reason: text('reason'),
  adminId: uuid('admin_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sanctionsRelations = relations(sanctions, ({ one }) => ({
  user: one(users, { fields: [sanctions.userId], references: [users.id] }),
  admin: one(users, { fields: [sanctions.adminId], references: [users.id], relationName: 'adminUser' }),
}))

// ==========================================
// 21. WIKI (Guida & Ambientazione)
// ==========================================

export const wikiSections = pgTable('wiki_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').$type<'guida' | 'ambientazione'>().notNull(),
  parentId: uuid('parent_id'),
  level: integer('level').$type<1 | 2>().notNull(),
  title: text('title').notNull(),
  content: text('content').default('').notNull(),
  imageUrl: text('image_url'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: 'wiki_sections_parent_id_fkey',
  }).onDelete('cascade'),
])

export const wikiSectionsRelations = relations(wikiSections, ({ one, many }) => ({
  parent: one(wikiSections, {
    fields: [wikiSections.parentId],
    references: [wikiSections.id],
    relationName: 'wikiHierarchy',
  }),
  children: many(wikiSections, { relationName: 'wikiHierarchy' }),
}))