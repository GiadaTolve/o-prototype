import { eq, ne, gte, and, or, ilike } from 'drizzle-orm';
import { db } from '../../plugins/db'; 
import { characters, users, characterHousing, characterSkills, skills, questRewards, quests, characterStatusEffects, fieldConstructs } from '../../db/schema';
// 👇 CORREZIONE: Usa l'alias definito nel tuo tsconfig (@domain)
import { calculateDerivedStats, type BaseStats } from '@domain/stats/calculator';
import { applyHpDelta, resolveCombatHp } from '@domain/combat/combat-hp';
import {
  buildSokaijuConfrontationFromSheets,
  buildIndicativeActionIndex,
  didOffensiveActionLand,
  messageDeclaresEnergeticWaza,
  resolveConfrontation,
  resolveDamageToHp,
  type ActionIndexInput,
  type DamagePipelineBreakdown,
} from '@domain/combat';
import { isWazaTier, type WazaTier } from '@domain/combat/tier';
import {
  normalizeStoredChronoStackState,
  processChronoChatMessage,
  processChronoEndOfTurn,
  processChronoHitTaken,
  toCombatChronoVitals,
  type StoredChronoStackState,
} from '@domain/combat/combat-chrono';
import {
  detectTenkanOffInChatMessage,
  detectTenkanOnInChatMessage,
  isChronoQualifyingAction,
} from '@domain/combat/tenkan-chat';
import {
  canAffordSkiruRaise,
  expCostToRaiseSkiru,
  expCostForNextSkiruPoint,
  getSkiruMaxPoints,
  getActiveJigaMilestone,
  getSkiruDef,
  getSkiruPoints,
  getSkiruParentUnlockMessage,
  isSokaijuFaceSheetKey,
  legacyStatsToSkiruSheet,
  validateSkiruSheet,
  SHAKAI_KAIKYU_CLASS_SKIRU_IDS,
  SKIRU_CATALOG,
  SKIRU_MAX_POINTS,
  calculateSkiruDerivedStats,
  calculateSkiruDomainIndices,
  SOKAIJU_ANCHORS,
  SOKAIJU_GATE_SKIRU_ID,
  getSokaijuAnchorBySkiruId,
  sokaijuFaceSheetKey,
  type SkiruSheet,
} from '@domain/skiru';
import { buildCharacterPixelIcons } from '../../lib/character-pixel-icons'
import {
  buildSkiruCharacterComputed,
  resolveCharacterSkiruSheet,
} from './skiru-sheet';
import {
  canUnlockNextPassiveSlot,
  getNextPassiveSlotToUnlock,
  getNextPassiveSlotUnlockCost,
  getPassiveSlotUnlockCost,
  PASSIVE_SLOT_BASE,
  PASSIVE_SLOT_MAX,
  readPassiveSlotsMeta,
  validateEquippedPassiveIds,
  type PassiveSlotsUiMeta,
  canLearnWazaFromStyle,
  getStyleRelation,
  isStyleId,
  readStyleHexMeta,
  STYLE_HEX_ORDER,
  STYLE_LABELS,
  STYLE_UNLOCK_KEY_COST,
  styleIdFromSkillDescription,
  isGenericheCatalogWaza,
  isOrdineCatalogWaza,
  isOnimoriCatalogWaza,
  canPurchaseOrdineWaza,
  type StyleHexUiMeta,
  type StyleId,
} from '@domain/progression';
import { checkKeystoneForWaza, hasKeystoneOwned } from '@domain/progression/do-statutes';
import {
  isSkillVisibleInPlayerCatalog,
  loadAuthoringPublishByLegacyId,
} from '../waza/waza-published-filter';
import {
  applyStatus,
  applyElementalStatus,
  removeStatus,
  tickStatusEndOfCharacterTurn,
  onSuccessfulHitTaken,
  onConfrontationStatusEvent,
  compileCombatModifiers,
  statusToOffensiveDamageBonuses,
  statusToDamageTakenFlatBonus,
  rowsToStatusContainer,
  toStatusEffectApiItems,
  parseStatusIdInput,
  createFieldConstruct,
  applyDamageToFieldConstruct,
  fieldConstructToApi,
  isConstructSizeId,
  canPlaceFieldConstruct,
  isConstructSizeAllowedForCreator,
  getMaxAllowedConstructSizeId,
  DEFAULT_MAX_ACTIVE_CONSTRUCTS,
  type StatusContainer,
  type StatusId,
  type ElementId,
  type FieldConstruct,
} from '@domain/combat';
import {
  resolveToroState,
  hasToroFromSkillMeta,
  TORO_PASSIVE_POOL_ID,
} from '@domain/styles/toka/toro';
import {
  resolveGosaState,
  accumulateGosaOnConstruct,
  correctGosaStacks,
  clampGosaStacks,
  GOSA_CORRECTION_CS_PER_STACK,
} from '@domain/styles/genzai/gosa';
import {
  readDoMechanicsFromMeta,
  patchDoMechanicsMeta,
  accumulateItoTensionInMeta,
  tickItoTensionInMeta,
  releaseItoTensionInMeta,
  type DoMechanicsUiMeta,
  type DoMechanicsPatch,
} from '@domain/styles/do-mechanics';
import {
  overflowDeltaOnTensioneIncrease,
  TENSIONE_RELEASE_CS,
} from '@domain/styles/ito/tensione';
import {
  buildActionStateSummaryTag,
  type ActionStateSummaryInput,
} from '@domain/combat/action-state-summary';
import { spendChronoStack } from '@domain/combat/chrono-stack';
import {
  hasDebitoRepayTag,
  processDebtorRepayMessage,
  processWazaChatAutomation,
  type WazaChatParticipant,
} from '@domain/combat/waza-chat-automation';
import { WAZA_TAG_INDEX } from '@domain/combat/waza-tag-index';
import { normalizeWazaLookupKey } from '@domain/combat/waza-tag-preview';
import {
  computeSkiruRiderFlatBonus,
  computeSkiruRiderDefenderIrPenalty,
  buildActionIndexFromDeclaredSkiru,
  extractMechanicTagsFromEffect,
  wazaEffectDeclaresContact,
} from '@domain/combat/waza-skiru-riders';
import {
  extractLaunchSkiruId,
  validateWazaChatPrerequisites,
  validateWazaChatCsAffordability,
} from '@domain/combat/waza-launch';
import { messageDeclaresSurpriseAttack } from '@domain/combat/waza-launch-extras';
import { readShakkinDebts } from '@domain/styles/hado/debito-shakkin';
import { applySutura } from '@domain/styles/naikan/hogo';
import { applyKyoshinVibration, tickKyoshinEndOfTurn } from '@domain/styles/generiche/kyoshin';
import { tickKomonoireEndOfTurn } from '@domain/styles/madosho/komonoire';
import { applyKomeiRoventeOnContactHit } from '@domain/styles/naikan/komei';
import { processShokushinHitExchange } from '@domain/styles/naikan/shokushin';
import { SHINRYAKU_CONSTRUCT_SIZE, SHINRYAKU_WAZA_TIER } from '@domain/styles/genzai/shinryaku';
import {
  MEISAKU_CONSTRUCT_SIZE,
  MEISAKU_WAZA_TIER,
} from '@domain/styles/genzai/meisaku';
import {
  readEdenState,
  recordEdenDestroyedConstruct,
  type EdenDestroyedConstructSnapshot,
} from '@domain/styles/genzai/rakuen';
import {
  KAJIBA_POOL,
  noteDamageDealtToTarget,
  onActorHpCrossedBelowHalf,
  tickGenericheIaiEndOfTurn,
} from '@domain/styles/generiche/passive-triggers';
import { clampJunkanPhase } from '@domain/styles/naikan/junkan';
import { isYuragiPhase } from '@domain/styles/hensei/yuragi';
import { clampKaden } from '@domain/styles/hado/kaden';

export class CharacterService {
  
  /**
   * Crea/aggiorna il personaggio "Grezzo" (creato a registrazione) con i dati dell'onboarding.
   * Trasforma l'utente da "Grezzo" ad "Analista" (isRaw → false).
   */
  async createOnboarding(userId: string, data: {
    name: string;
    surname: string;
    avatar: string;
    order: 'MUGEN-TAI' | 'CHISEN-TAI' | 'NONE';
    baseStats: BaseStats;
  }) {
    return this.updateOnboarding(userId, {
      surname: data.surname,
      avatar: data.avatar,
      baseStats: data.baseStats,
      order: data.order,
    });
  }

  /**
   * Aggiorna il personaggio "Grezzo" (creato a registrazione) con i dati dell'onboarding.
   * Trasforma l'utente da "Grezzo" ad "Analista" (isRaw → false).
   */
  async updateOnboarding(userId: string, data: {
    surname: string;
    bio?: string;
    avatar: string;
    miniAvatar?: string;
    baseStats: BaseStats;
    order: 'MUGEN-TAI' | 'CHISEN-TAI' | 'NONE';
  }) {
    const existing = await db.query.characters.findFirst({
      where: eq(characters.userId, userId),
    });
    if (!existing) {
      throw new Error('Personaggio non trovato. Effettua prima la registrazione.');
    }

    const [updated] = await db
      .update(characters)
      .set({
        surname: data.surname,
        bio: data.bio ?? null,
        avatar: data.avatar,
        miniAvatar: data.miniAvatar ?? null,
        strength: data.baseStats.strength,
        constitution: data.baseStats.constitution,
        dexterity: data.baseStats.dexterity,
        mind: data.baseStats.mind,
        empathy: data.baseStats.empathy,
        skiruSheet: legacyStatsToSkiruSheet(data.baseStats),
        order: data.order,
        isRaw: false,
      })
      .where(eq(characters.id, existing.id))
      .returning();

    return updated!;
  }

  /**
   * Recupera il personaggio e CALCOLA le statistiche derivate al volo.
   * - "Le regole non si piegano arbitrariamente"
   * - Applica bonus/malus HP da housing
   */
  async getCharacterByUserId(userId: string) {
    const character = await db.query.characters.findFirst({
      where: eq(characters.userId, userId),
      with: {
        job: true,
        // inventory: true (in futuro)
      }
    });

    if (!character) return null;

    // Estraiamo le stats base dal DB
    const baseStats: BaseStats = {
      strength: character.strength,
      constitution: character.constitution,
      dexterity: character.dexterity,
      mind: character.mind,
      empathy: character.empathy
    };

    // Definiamo il Rango (Y). Default 1.0 come da contesto.
    const Y = 1.0;

    const skiruSheet = resolveCharacterSkiruSheet(
      character.skiruSheet as Record<string, number> | undefined,
      baseStats,
    );

    // Calcoliamo il "Quadro Momentaneo" usando il Domain puro
    const derived = calculateDerivedStats(baseStats, Y);

    // Applica bonus/malus HP da housing
    const housing = await db.query.characterHousing.findFirst({
      where: eq(characterHousing.characterId, character.id),
      with: {
        housingType: true,
      },
    });

    let hpModifier = 0;
    if (!housing || housing.evicted) {
      // Senzatetto: -5pf
      hpModifier = -5;
    } else if (housing.housingType) {
      // Bonus HP dalla casa
      hpModifier = housing.housingType.hpBonus || 0;
    }

    return this.mergeCharacterWithSkiru(character, skiruSheet, hpModifier, derived);
  }

  private mergeCharacterWithSkiru(
    character: typeof characters.$inferSelect,
    skiruSheet: SkiruSheet,
    hpModifier: number,
    derived: ReturnType<typeof calculateDerivedStats>,
  ) {
    const skiruPayload = buildSkiruCharacterComputed(skiruSheet, hpModifier);
    const hp = resolveCombatHp(character.currentHp, skiruPayload.computed.hpMax);
    const chrono = toCombatChronoVitals(
      normalizeStoredChronoStackState(
        character.chronoStackState as StoredChronoStackState | null | undefined,
      ),
    );

    return {
      ...character,
      ...skiruPayload,
      computed: {
        ...skiruPayload.computed,
        hpMax: hp.hpMax,
        hpCurrent: hp.hpCurrent,
        body: hp.hpMax,
        jigokaMax: derived.jigokaMax,
        reflexes: derived.reflexes,
        velocity: derived.velocity,
        movement: skiruPayload.computed.movementMetersPerQuarter,
        csCurrent: chrono.csCurrent,
        csCapacity: chrono.csCapacity,
        csAccumulating: chrono.accumulating,
      },
    };
  }

  private baseStatsFromCharacter(char: {
    strength: number;
    constitution: number;
    dexterity: number;
    mind: number;
    empathy: number;
  }): BaseStats {
    return {
      strength: char.strength,
      constitution: char.constitution,
      dexterity: char.dexterity,
      mind: char.mind,
      empathy: char.empathy,
    };
  }

  private async resolveHousingHpModifier(characterId: string): Promise<number> {
    const housing = await db.query.characterHousing.findFirst({
      where: eq(characterHousing.characterId, characterId),
      with: {
        housingType: true,
      },
    });
    if (!housing || housing.evicted) {
      return -5;
    }
    return housing.housingType?.hpBonus || 0;
  }

  /** Payload Skiru + derivati per un personaggio (senza join user). */
  async getSkiruBundleForCharacter(characterId: string, hpModifier?: number) {
    const char = await this.getCharacterById(characterId);
    if (!char) return null;

    const baseStats = this.baseStatsFromCharacter(char);
    const skiruSheet = resolveCharacterSkiruSheet(
      char.skiruSheet as Record<string, number> | undefined,
      baseStats,
    );
    const derived = calculateDerivedStats(baseStats, 1.0);
    const resolvedHpModifier =
      typeof hpModifier === 'number'
        ? hpModifier
        : await this.resolveHousingHpModifier(characterId);

    return this.mergeCharacterWithSkiru(char, skiruSheet, resolvedHpModifier, derived);
  }

  /** Elenco personaggi (id, name, miniAvatar) per Nuova conversazione SMS. Esclude excludeCharacterId. */
  async listForSms(excludeCharacterId: string) {
    return db
      .select({ id: characters.id, name: characters.name, miniAvatar: characters.miniAvatar })
      .from(characters)
      .where(ne(characters.id, excludeCharacterId));
  }

  /** Ricerca personaggi per nome (ILIKE parziale). Per Live Search SMS e invito ospiti. Esclude excludeCharacterId. */
  async searchForSms(excludeCharacterId: string, query: string) {
    const q = String(query).trim();
    if (!q) return this.listForSms(excludeCharacterId);
    const pattern = `%${q}%`;
    return db
      .select({ id: characters.id, name: characters.name, surname: characters.surname, miniAvatar: characters.miniAvatar })
      .from(characters)
      .where(
        and(
          ne(characters.id, excludeCharacterId),
          or(
            ilike(characters.name, pattern),
            ilike(characters.surname, pattern)
          )
        )
      )
      .limit(50);
  }

  /** Ottiene un character per ID. */
  async getCharacterById(characterId: string) {
    return db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    });
  }

  /** Ottiene l'utente associato a un character. */
  async getUserByCharacterId(characterId: string) {
    const char = await this.getCharacterById(characterId);
    if (!char) return null;
    return db.query.users.findFirst({
      where: eq(users.id, char.userId),
    });
  }

  /**
   * Restituisce un profilo "pubblico" di un personaggio, senza dati sensibili.
   */
  async getPublicCharacter(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    });
    if (!char) return null;

    const meta = (char.uiMetadata as {
      roleIcon?: string
      orderIcon?: string
      premioSpeciale?: string
      backgroundImage?: string
      themeMusicUrl?: string
      bannerPg?: string
    } | null) ?? {}

    const baseStats = this.baseStatsFromCharacter(char)
    const skiruSheet = resolveCharacterSkiruSheet(
      char.skiruSheet as Record<string, number> | undefined,
      baseStats,
    );
    const housing = await db.query.characterHousing.findFirst({
      where: eq(characterHousing.characterId, char.id),
      with: {
        housingType: true,
      },
    });

    let hpModifier = 0;
    if (!housing || housing.evicted) {
      // Senzatetto: -5pf (stessa regola della scheda privata).
      hpModifier = -5;
    } else if (housing.housingType) {
      hpModifier = housing.housingType.hpBonus || 0;
    }

    const skiruPayload = buildSkiruCharacterComputed(skiruSheet, hpModifier);
    const hp = resolveCombatHp(char.currentHp, skiruPayload.computed.hpMax);

    return {
      id: char.id,
      name: char.name,
      surname: char.surname,
      avatar: char.avatar,
      miniAvatar: char.miniAvatar,
      bio: char.bio,
      staffAlias: char.staffAlias,
      masterNotes: char.masterNotes,
      backgroundImage: meta.backgroundImage,
      themeMusicUrl: meta.themeMusicUrl,
      bannerPg: meta.bannerPg,
      pixelIcons: buildCharacterPixelIcons(meta, char.order),
      /** Legacy — non esposto in vista pubblica; usare skiruSheet/computed. */
      grade: char.grade,
      order: char.order,
      skiruSheet: skiruPayload.skiruSheet,
      skiruDomains: skiruPayload.skiruDomains,
      currentHp: hp.hpCurrent,
      computed: {
        ...skiruPayload.computed,
        hpMax: hp.hpMax,
        hpCurrent: hp.hpCurrent,
        body: hp.hpMax,
      },
    };
  }

  private async getOwnedWazaPoolIds(characterId: string): Promise<Set<string>> {
    const rows = await db.query.characterSkills.findMany({
      where: eq(characterSkills.characterId, characterId),
      with: { skill: { columns: { type: true, poolId: true } } },
    });
    const ids = new Set<string>();
    for (const row of rows) {
      if (row.skill?.type !== 'WAZA' || !row.skill.poolId) continue;
      ids.add(row.skill.poolId);
    }
    return ids;
  }

  private async countOwnedWazaByStyle(characterId: string): Promise<Map<StyleId, number>> {
    const rows = await db.query.characterSkills.findMany({
      where: eq(characterSkills.characterId, characterId),
      with: { skill: true },
    });
    const counts = new Map<StyleId, number>();
    for (const row of rows) {
      if (row.skill?.type !== 'WAZA') continue;
      const sid = (row.skill.styleId && isStyleId(row.skill.styleId)
        ? row.skill.styleId
        : styleIdFromSkillDescription(row.skill.description)) as StyleId | null;
      if (!sid) continue;
      counts.set(sid, (counts.get(sid) ?? 0) + 1);
    }
    return counts;
  }

  private resolveSkillStyleId(skill: {
    styleId?: string | null;
    description?: string | null;
  }): StyleId | null {
    if (skill.styleId && isStyleId(skill.styleId)) return skill.styleId;
    return styleIdFromSkillDescription(skill.description);
  }

  /**
   * Elenco skill disponibili per acquisto con stato owned/canPurchase.
   */
  async getAvailableSkillsForPurchase(characterId: string) {
    const [allSkills, char, learned, styleCounts, ownedPoolIds, publishByLegacyId] = await Promise.all([
      db.query.skills.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
          type: true,
          costExp: true,
          costKeys: true,
          costJigoka: true,
          isPassive: true,
          styleId: true,
          madoshoId: true,
          poolId: true,
          rank: true,
        },
        orderBy: (s, { asc }) => [asc(s.name)],
      }),
      db.query.characters.findFirst({
        where: eq(characters.id, characterId),
        columns: {
          experienceSpendable: true,
          keys: true,
          uiMetadata: true,
          madoshoId: true,
          order: true,
          skiruSheet: true,
          strength: true,
          constitution: true,
          dexterity: true,
          mind: true,
          empathy: true,
        },
      }),
      db.query.characterSkills.findMany({
        where: eq(characterSkills.characterId, characterId),
        columns: { skillId: true },
      }),
      this.countOwnedWazaByStyle(characterId),
      this.getOwnedWazaPoolIds(characterId),
      loadAuthoringPublishByLegacyId(),
    ]);
    const ownedIds = new Set(learned.map((r) => r.skillId));
    const exp = char?.experienceSpendable ?? 0;
    const keys = char?.keys ?? 0;
    const skiruSheet = resolveCharacterSkiruSheet(
      char?.skiruSheet as Record<string, number> | undefined,
      char ? this.baseStatsFromCharacter(char) : undefined,
    );
    const { primaryStyleId, unlockedStyleIds } = readStyleHexMeta(
      (char?.uiMetadata ?? {}) as StyleHexUiMeta,
    );

    return allSkills
      .filter((s) => isSkillVisibleInPlayerCatalog(s.id, s.type, publishByLegacyId))
      .map((s) => {
      const hasResources =
        !ownedIds.has(s.id) && (s.costExp ?? 0) <= exp && (s.costKeys ?? 0) <= keys;
      let canPurchase = hasResources;
      let hexagonBlockedReason: string | null = null;
      let branchUnlocked = true;
      let keystoneOwned = true;

      if (s.type === 'WAZA') {
        if (s.madoshoId) {
          branchUnlocked = char?.madoshoId === s.madoshoId;
          keystoneOwned = true;
          if (hasResources) {
            if (!char?.madoshoId) {
              canPurchase = false;
              hexagonBlockedReason = 'Richiede Madoshō assegnata dallo staff.';
            } else if (char.madoshoId !== s.madoshoId) {
              canPurchase = false;
              hexagonBlockedReason = 'Waza di un altro lignaggio Madoshō.';
            }
          }
        } else if (isGenericheCatalogWaza(s)) {
          branchUnlocked = true;
          keystoneOwned = true;
        } else if (isOnimoriCatalogWaza(s)) {
          branchUnlocked = true;
          keystoneOwned = true;
        } else if (isOrdineCatalogWaza(s)) {
          branchUnlocked = true;
          keystoneOwned = true;
          const ordineCheck = canPurchaseOrdineWaza(
            { order: char?.order ?? 'NONE' },
            skiruSheet,
          );
          if (hasResources && !ordineCheck.ok) {
            canPurchase = false;
            hexagonBlockedReason = ordineCheck.reason ?? null;
          }
        } else {
          const styleId = this.resolveSkillStyleId(s);
          branchUnlocked = styleId ? unlockedStyleIds.includes(styleId) : false;
          keystoneOwned = styleId ? hasKeystoneOwned(styleId, ownedPoolIds) : true;

          if (hasResources) {
            if (!styleId) {
              canPurchase = false;
              hexagonBlockedReason = 'Stile non mappato';
            } else if (!branchUnlocked) {
              canPurchase = false;
              hexagonBlockedReason = `Sblocca il ramo con Key (Esagono).`;
            } else {
              const keystoneCheck = checkKeystoneForWaza(styleId, s.poolId, ownedPoolIds);
              if (!keystoneCheck.ok) {
                canPurchase = false;
                hexagonBlockedReason = keystoneCheck.error ?? null;
              } else {
                const check = canLearnWazaFromStyle(
                  primaryStyleId,
                  unlockedStyleIds,
                  styleId,
                );
                if (!check.ok) {
                  canPurchase = false;
                  hexagonBlockedReason = check.error ?? null;
                }
              }
            }
          }
        }
      }

      return {
        ...s,
        owned: ownedIds.has(s.id),
        canPurchase,
        hexagonBlockedReason,
        branchUnlocked,
        keystoneOwned,
        styleId: this.resolveSkillStyleId(s),
      };
    });
  }

  /**
   * Acquista una skill con EXP (e Keys se richiesto).
   */
  async purchaseSkill(characterId: string, skillId: string) {
    const [char, skill, existing, ownedPoolIds] = await Promise.all([
      db.query.characters.findFirst({
        where: eq(characters.id, characterId),
        columns: {
          id: true,
          experienceSpendable: true,
          keys: true,
          uiMetadata: true,
          madoshoId: true,
          order: true,
          skiruSheet: true,
          strength: true,
          constitution: true,
          dexterity: true,
          mind: true,
          empathy: true,
        },
      }),
      db.query.skills.findFirst({
        where: eq(skills.id, skillId),
        columns: {
          id: true,
          name: true,
          type: true,
          description: true,
          styleId: true,
          madoshoId: true,
          poolId: true,
          costExp: true,
          costKeys: true,
        },
      }),
      db.query.characterSkills.findFirst({
        where: and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillId, skillId)),
      }),
      this.getOwnedWazaPoolIds(characterId),
    ]);
    if (!char || !skill) throw new Error('Personaggio o skill non trovato');
    if (existing) throw new Error('Hai già appreso questa skill');

    if (skill.type === 'WAZA') {
      if (skill.madoshoId) {
        if (!char.madoshoId || char.madoshoId !== skill.madoshoId) {
          throw new Error('Waza riservata al tuo lignaggio Madoshō.');
        }
      } else if (isGenericheCatalogWaza(skill)) {
        // Nessun vincolo Esagono — solo EXP (e Keys se impostate).
      } else if (isOnimoriCatalogWaza(skill)) {
        // Nessun vincolo Esagono — solo EXP (contenuto di zona).
      } else if (isOrdineCatalogWaza(skill)) {
        const skiruSheet = resolveCharacterSkiruSheet(
          char.skiruSheet as Record<string, number> | undefined,
          this.baseStatsFromCharacter(char),
        );
        const ordineCheck = canPurchaseOrdineWaza({ order: char.order ?? 'NONE' }, skiruSheet);
        if (!ordineCheck.ok) throw new Error(ordineCheck.reason ?? 'Waza d\'ordine non disponibile.');
      } else {
        const styleId = this.resolveSkillStyleId(skill);
        if (!styleId) throw new Error('Waza senza stile Esagono mappato.');
        const { primaryStyleId, unlockedStyleIds } = readStyleHexMeta(
          (char.uiMetadata ?? {}) as StyleHexUiMeta,
        );
        if (!unlockedStyleIds.includes(styleId)) {
          throw new Error('Sblocca il ramo con Key (Esagono).');
        }
        const keystoneCheck = checkKeystoneForWaza(styleId, skill.poolId, ownedPoolIds);
        if (!keystoneCheck.ok) throw new Error(keystoneCheck.error ?? 'Keystone Dō mancante.');
        const check = canLearnWazaFromStyle(
          primaryStyleId,
          unlockedStyleIds,
          styleId,
        );
        if (!check.ok) throw new Error(check.error ?? 'Acquisto bloccato dall\'Esagono.');
      }
    }

    const costExp = skill.costExp ?? 0;
    const costKeys = skill.costKeys ?? 0;
    if ((char.experienceSpendable ?? 0) < costExp) throw new Error('EXP insufficienti');
    if ((char.keys ?? 0) < costKeys) throw new Error('Keys insufficienti');

    await db.transaction(async (tx) => {
      await tx.insert(characterSkills).values({
        characterId,
        skillId,
      });
      await tx
        .update(characters)
        .set({
          experienceSpendable: (char.experienceSpendable ?? 0) - costExp,
          ...(costKeys > 0 ? { keys: (char.keys ?? 0) - costKeys } : {}),
        })
        .where(eq(characters.id, characterId));
    });

    return this.getCharacterWaza(characterId);
  }

  /**
   * Restituisce le Waza (skill attive) conosciute da un personaggio.
   */
  async getCharacterWaza(characterId: string) {
    const rows = await db.query.characterSkills.findMany({
      where: eq(characterSkills.characterId, characterId),
      with: {
        skill: true,
      },
      orderBy: (cs, { desc }) => [desc(cs.createdAt)],
    });

    // Filtra solo le skill di tipo WAZA
    return rows
      .filter((row) => row.skill?.type === 'WAZA')
      .map((row) => ({
        id: row.skill!.id,
        name: row.skill!.name,
        description: row.skill!.description,
        type: row.skill!.type,
        costJigoka: row.skill!.costJigoka,
        rank: row.skill!.rank,
        isPassive: row.skill!.isPassive ?? false,
        level: row.level,
        styleId: this.resolveSkillStyleId(row.skill!),
        madoshoId: row.skill!.madoshoId ?? null,
        poolId: row.skill!.poolId ?? null,
      }));
  }

  /** Waza passive possedute. */
  async getOwnedPassiveWaza(characterId: string) {
    const rows = await db.query.characterSkills.findMany({
      where: eq(characterSkills.characterId, characterId),
      with: { skill: true },
      orderBy: (cs, { desc }) => [desc(cs.createdAt)],
    });
    return rows
      .filter((row) => row.skill?.type === 'WAZA' && row.skill?.isPassive)
      .map((row) => ({
        id: row.skill!.id,
        name: row.skill!.name,
        description: row.skill!.description,
        rank: row.skill!.rank,
        level: row.level,
      }));
  }

  async getPassiveSlotsState(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { experienceSpendable: true, uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as PassiveSlotsUiMeta;
    const { slotsUnlocked, equippedPassiveIds } = readPassiveSlotsMeta(meta);
    const ownedPassives = await this.getOwnedPassiveWaza(characterId);
    const ownedById = new Map(ownedPassives.map((p) => [p.id, p]));

    const slots = Array.from({ length: PASSIVE_SLOT_MAX }, (_, i) => {
      const slotNumber = i + 1;
      const unlocked = slotNumber <= slotsUnlocked;
      const skillId = equippedPassiveIds[i]?.trim() || null;
      const skill = skillId ? ownedById.get(skillId) : undefined;
      const isNextToUnlock = !unlocked && slotNumber === slotsUnlocked + 1;
      return {
        slotNumber,
        unlocked,
        unlockCost: isNextToUnlock ? getPassiveSlotUnlockCost(slotNumber) : null,
        equipped: skill
          ? { id: skill.id, name: skill.name, rank: skill.rank, level: skill.level }
          : null,
      };
    });

    return {
      slotsUnlocked,
      maxSlots: PASSIVE_SLOT_MAX,
      baseSlots: PASSIVE_SLOT_BASE,
      nextUnlockCost: getNextPassiveSlotUnlockCost(slotsUnlocked),
      nextSlotNumber: getNextPassiveSlotToUnlock(slotsUnlocked),
      canUnlockNext: canUnlockNextPassiveSlot(slotsUnlocked, char.experienceSpendable ?? 0),
      expSpendable: char.experienceSpendable ?? 0,
      equippedPassiveIds,
      slots,
      ownedPassives: ownedPassives.map((p) => ({
        ...p,
        equippedInSlot: (() => {
          const idx = equippedPassiveIds.findIndex((id) => id === p.id)
          return idx >= 0 ? idx + 1 : null
        })(),
      })),
    };
  }

  async unlockPassiveSlot(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { experienceSpendable: true, uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as PassiveSlotsUiMeta;
    const { slotsUnlocked } = readPassiveSlotsMeta(meta);
    const nextSlot = getNextPassiveSlotToUnlock(slotsUnlocked);
    if (nextSlot == null) throw new Error('Tutti gli slot passivi sono già sbloccati.');
    const cost = getPassiveSlotUnlockCost(nextSlot);
    if (cost == null) throw new Error('Costo slot non valido.');
    if ((char.experienceSpendable ?? 0) < cost) throw new Error('EXP insufficienti.');

    await db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          experienceSpendable: (char.experienceSpendable ?? 0) - cost,
          uiMetadata: {
            ...meta,
            passiveSlotsUnlocked: nextSlot,
          },
        })
        .where(eq(characters.id, characterId));
    });

    return this.getPassiveSlotsState(characterId);
  }

  async setEquippedPassives(characterId: string, equippedIds: string[]) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as PassiveSlotsUiMeta;
    const { slotsUnlocked } = readPassiveSlotsMeta(meta);
    const owned = await this.getOwnedPassiveWaza(characterId);
    const ownedSet = new Set(owned.map((p) => p.id));

    const trimmed = Array.from({ length: slotsUnlocked }, (_, i) => {
      const id = equippedIds[i]
      return typeof id === 'string' ? id.trim() : ''
    })

    const validation = validateEquippedPassiveIds(
      trimmed.filter(Boolean),
      slotsUnlocked,
      ownedSet,
    )
    if (!validation.ok) throw new Error(validation.errors.join(' '));

    await db
      .update(characters)
      .set({
        uiMetadata: {
          ...meta,
          equippedPassiveIds: trimmed,
        },
      })
      .where(eq(characters.id, characterId));

    return this.getPassiveSlotsState(characterId);
  }

  async getStyleHexState(characterId: string) {
    const [char, styleCounts] = await Promise.all([
      db.query.characters.findFirst({
        where: eq(characters.id, characterId),
        columns: { keys: true, uiMetadata: true },
      }),
      this.countOwnedWazaByStyle(characterId),
    ]);
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as StyleHexUiMeta & PassiveSlotsUiMeta;
    const { primaryStyleId, unlockedStyleIds } = readStyleHexMeta(meta);

    const styles = STYLE_HEX_ORDER.map((id) => {
      const relation = primaryStyleId ? getStyleRelation(primaryStyleId, id) : null;
      const ownedWaza = styleCounts.get(id) ?? 0;
      return {
        id,
        label: STYLE_LABELS[id],
        relation,
        ownedWaza,
        unlocked: unlockedStyleIds.includes(id),
        isPrimary: primaryStyleId === id,
        unlockKeyCost: STYLE_UNLOCK_KEY_COST,
      };
    });

    return {
      primaryStyleId,
      unlockedStyleIds,
      keys: char.keys ?? 0,
      unlockKeyCost: STYLE_UNLOCK_KEY_COST,
      styles,
    };
  }

  async setPrimaryStyle(characterId: string, styleId: string) {
    if (!isStyleId(styleId)) throw new Error('Stile non valido.');
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as StyleHexUiMeta;
    const { primaryStyleId: existing } = readStyleHexMeta(meta);
    if (existing && existing !== styleId) {
      throw new Error('Stile principale già impostato. Contatta lo staff per cambiarlo.');
    }

    const unlocked = new Set(meta.unlockedStyleIds?.filter(isStyleId) ?? []);
    unlocked.add(styleId);

    await db
      .update(characters)
      .set({
        uiMetadata: {
          ...meta,
          primaryStyleId: styleId,
          unlockedStyleIds: [...unlocked],
        },
      })
      .where(eq(characters.id, characterId));

    return this.getStyleHexState(characterId);
  }

  async unlockStyle(characterId: string, styleId: string) {
    if (!isStyleId(styleId)) throw new Error('Stile non valido.');
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { keys: true, uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as StyleHexUiMeta;
    const { primaryStyleId, unlockedStyleIds } = readStyleHexMeta(meta);
    if (!primaryStyleId) throw new Error('Imposta prima lo stile principale.');
    if (unlockedStyleIds.includes(styleId)) throw new Error('Stile già sbloccato.');
    if ((char.keys ?? 0) < STYLE_UNLOCK_KEY_COST) throw new Error('Keys insufficienti.');

    await db
      .update(characters)
      .set({
        keys: (char.keys ?? 0) - STYLE_UNLOCK_KEY_COST,
        uiMetadata: {
          ...meta,
          unlockedStyleIds: [...unlockedStyleIds, styleId],
        },
      })
      .where(eq(characters.id, characterId));

    return this.getStyleHexState(characterId);
  }

  private async loadCharacterStatusContainer(characterId: string): Promise<StatusContainer> {
    const rows = await db.query.characterStatusEffects.findMany({
      where: eq(characterStatusEffects.characterId, characterId),
    });
    return rowsToStatusContainer(
      rows.map((r) => ({
        statusId: r.statusId as StatusId,
        stacks: r.stacks,
        targetKind: r.targetKind,
        constructRef: r.constructRef,
      })),
    );
  }

  private async persistCharacterStatusContainer(
    characterId: string,
    container: StatusContainer,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(characterStatusEffects)
        .where(
          and(
            eq(characterStatusEffects.characterId, characterId),
            eq(characterStatusEffects.targetKind, 'character'),
          ),
        );

      if (container.statuses.length === 0) return;

      await tx.insert(characterStatusEffects).values(
        container.statuses.map((s) => ({
          characterId,
          statusId: s.id,
          stacks: s.stacks,
          targetKind: 'character' as const,
          constructRef: null,
        })),
      );
    });
  }

  async getStatusEffectsState(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, experienceSpendable: true, currentHp: true, uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const container = await this.loadCharacterStatusContainer(characterId);
    const modifiers = compileCombatModifiers(
      container,
      (char.uiMetadata ?? {}) as DoMechanicsUiMeta,
    );
    const vitals = await this.getCombatVitals(characterId);

    return {
      characterId,
      targetKind: container.targetKind,
      vitals,
      effects: toStatusEffectApiItems(container),
      modifiers: {
        offensiveTierBonus: modifiers.offensiveTierBonus,
        damageTakenTierBonus: modifiers.damageTakenTierBonus,
        damageMultiplier: modifiers.damageMultiplier,
        csCostMultiplier: modifiers.csCostMultiplier,
        movementMultiplier: modifiers.movementMultiplier,
        indexBonus: modifiers.indexBonus,
        bonusCsPerTurn: modifiers.bonusCsPerTurn,
        blockCsGain: modifiers.blockCsGain,
        blockWaza: modifiers.blockWaza,
        blockHealing: modifiers.blockHealing,
        movementTowardEnemyOnly: modifiers.movementTowardEnemyOnly,
        tranceOnirica: modifiers.tranceOnirica,
        metamorphosisActive: modifiers.metamorphosisActive,
        mitigationBonusPercent: modifiers.mitigationBonusPercent,
        komeiRovente: modifiers.komeiRovente,
      },
    };
  }

  private async getEquippedPassivePoolIds(characterId: string): Promise<string[]> {
    const passiveState = await this.getPassiveSlotsState(characterId);
    const poolIds: string[] = [];
    for (const slot of passiveState.slots) {
      if (!slot.equipped) continue;
      const skill = await db.query.skills.findFirst({
        where: eq(skills.id, slot.equipped.id),
        columns: { poolId: true },
      });
      if (skill?.poolId) poolIds.push(skill.poolId);
    }
    return poolIds;
  }

  private async compileModifiersForCharacter(
    characterId: string,
    container: StatusContainer,
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    return compileCombatModifiers(container, (char?.uiMetadata ?? {}) as DoMechanicsUiMeta);
  }

  async getCombatVitals(characterId: string) {
    const bundle = await this.getSkiruBundleForCharacter(characterId);
    if (!bundle) throw new Error('Personaggio non trovato');
    const hpMax = bundle.computed.hpMax ?? 0;
    const hp = resolveCombatHp(bundle.currentHp, hpMax);
    const chrono = await this.getCombatChronoVitals(characterId);
    return { ...hp, chronoStack: chrono };
  }

  private async loadStoredChronoState(characterId: string): Promise<StoredChronoStackState> {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { chronoStackState: true },
    });
    if (!char) throw new Error('Personaggio non trovato');
    return normalizeStoredChronoStackState(
      char.chronoStackState as StoredChronoStackState | null | undefined,
    );
  }

  private async persistStoredChronoState(
    characterId: string,
    state: StoredChronoStackState,
  ): Promise<StoredChronoStackState> {
    const normalized = normalizeStoredChronoStackState(state);
    await db
      .update(characters)
      .set({ chronoStackState: normalized })
      .where(eq(characters.id, characterId));
    return normalized;
  }

  async getCombatChronoVitals(characterId: string) {
    const state = await this.loadStoredChronoState(characterId);
    return toCombatChronoVitals(state);
  }

  /**
   * Chat: Tenkan ON/OFF + accumulo CS automatico su ogni azione ≥500 caratteri.
   * Non richiede tick Master per il guadagno a turno.
   */
  async processChatChronoOnMessage(
    characterId: string,
    messageContent: string,
    totalChars: number,
    options: { isGlobal?: boolean; isMasterscreen?: boolean } = {},
  ) {
    if (options.isGlobal || options.isMasterscreen) return null;

    const state = await this.loadStoredChronoState(characterId);
    const container = await this.loadCharacterStatusContainer(characterId);
    const modifiers = await this.compileModifiersForCharacter(characterId, container);

    const result = processChronoChatMessage(state, messageContent, totalChars, modifiers, {
      detectTenkanOn: detectTenkanOnInChatMessage,
      detectTenkanOff: detectTenkanOffInChatMessage,
      isQualifyingAction: isChronoQualifyingAction,
    });

    if (!result.changed) return null;

    if (result.overheatHpDamage > 0) {
      await this.applyCombatHpDelta(characterId, -result.overheatHpDamage);
    }

    await this.persistStoredChronoState(characterId, result.state);
    const vitals = await this.getCombatVitals(characterId);

    return {
      chronoStack: vitals.chronoStack,
      vitals: { hpCurrent: vitals.hpCurrent, hpMax: vitals.hpMax },
      csGained: result.csGained,
      overheatHpDamage: result.overheatHpDamage,
      defatigueApplied: result.defatigueApplied,
      tenkanOpened: result.tenkanOpened,
      tenkanClosed: result.tenkanClosed,
      turnApplied: result.turnApplied,
    };
  }

  async applyCombatChronoTurnTick(characterId: string) {
    const state = await this.loadStoredChronoState(characterId);
    const container = await this.loadCharacterStatusContainer(characterId);
    const modifiers = await this.compileModifiersForCharacter(characterId, container);
    const tick = processChronoEndOfTurn(state, modifiers);

    if (tick.overheatHpDamage > 0) {
      await this.applyCombatHpDelta(characterId, -tick.overheatHpDamage);
    }

    await this.persistStoredChronoState(characterId, tick.state);
    const vitals = await this.getCombatVitals(characterId);
    await this.tickItoTensionEndOfTurn(characterId);
    await this.tickGenerichePassivesEndOfTurn(characterId);

    return {
      chronoStack: vitals.chronoStack,
      vitals: { hpCurrent: vitals.hpCurrent, hpMax: vitals.hpMax },
      csGained: tick.csGained,
      overheatHpDamage: tick.overheatHpDamage,
      defatigueApplied: tick.defatigueApplied,
    };
  }

  async applyCombatChronoHitTaken(characterId: string) {
    const state = await this.loadStoredChronoState(characterId);
    const container = await this.loadCharacterStatusContainer(characterId);
    const modifiers = await this.compileModifiersForCharacter(characterId, container);
    const hit = processChronoHitTaken(state, modifiers);
    if (hit.csGained <= 0) {
      return { chronoStack: toCombatChronoVitals(state), csGained: 0 };
    }
    await this.persistStoredChronoState(characterId, hit.state);
    return { chronoStack: toCombatChronoVitals(hit.state), csGained: hit.csGained };
  }

  async applyCombatHpDelta(
    characterId: string,
    delta: number,
    options?: {
      hitTier?: number;
      attackerCharacterId?: string;
      contactHit?: boolean;
      /** Curatore Jikai — bonus cure/buff sul valore positivo. */
      supporterCharacterId?: string;
    },
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, currentHp: true, uiMetadata: true, name: true, surname: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const bundle = await this.getSkiruBundleForCharacter(characterId);
    if (!bundle) throw new Error('Personaggio non trovato');

    let appliedDelta = delta;

    const hpMax = bundle.computed.hpMax ?? 0;
    const hpBefore = char.currentHp;
    const next = applyHpDelta(char.currentHp, hpMax, appliedDelta);

    const defenderMeta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    let nextDefenderMeta: DoMechanicsUiMeta = { ...defenderMeta };
    let defenderMetaDirty = false;
    let nextAttackerMeta: DoMechanicsUiMeta | null = null;
    let attackerCharacterId: string | null = null;

    if (delta < 0 && typeof options?.hitTier === 'number') {
      const t = Math.floor(options.hitTier);
      if (t >= 1 && t <= 5) {
        nextDefenderMeta.lastReceivedHitTier = t;
        defenderMetaDirty = true;
      }
    }

    if (delta < 0 && appliedDelta < 0) {
      const passivePools = await this.getEquippedPassivePoolIds(characterId);
      const kajiba = onActorHpCrossedBelowHalf(
        nextDefenderMeta,
        hpBefore,
        next,
        hpMax,
        passivePools.includes(KAJIBA_POOL),
      );
      if (kajiba.triggered) {
        nextDefenderMeta = { ...nextDefenderMeta, ...kajiba.meta };
        defenderMetaDirty = true;
      }
    }

    if (
      delta < 0 &&
      options?.attackerCharacterId &&
      options.attackerCharacterId !== characterId
    ) {
      const attacker = await db.query.characters.findFirst({
        where: eq(characters.id, options.attackerCharacterId),
        columns: { uiMetadata: true },
      });
      if (attacker) {
        const attackerMeta = (attacker.uiMetadata ?? {}) as DoMechanicsUiMeta;
        const exchange = processShokushinHitExchange(
          attackerMeta,
          nextDefenderMeta,
          options.attackerCharacterId,
          characterId,
        );
        if (exchange.offensiveBonusConsumed || exchange.readingDeepened) {
          nextDefenderMeta = { ...nextDefenderMeta, ...exchange.defenderMeta };
          nextAttackerMeta = { ...attackerMeta, ...exchange.attackerMeta };
          attackerCharacterId = options.attackerCharacterId;
          defenderMetaDirty = true;
        }
      }
    }

    const updates: { currentHp: number; uiMetadata?: DoMechanicsUiMeta } = { currentHp: next };
    if (defenderMetaDirty) {
      updates.uiMetadata = nextDefenderMeta;
    }

    if (
      delta < 0 &&
      options?.contactHit &&
      options?.attackerCharacterId &&
      options.attackerCharacterId !== characterId
    ) {
      const attackerContainer = await this.loadCharacterStatusContainer(options.attackerCharacterId);
      const attackerChar = await db.query.characters.findFirst({
        where: eq(characters.id, options.attackerCharacterId),
        columns: { uiMetadata: true },
      });
      const attackerMeta = (attackerChar?.uiMetadata ?? {}) as DoMechanicsUiMeta;
      const attackerMods = compileCombatModifiers(attackerContainer, attackerMeta);
      if (attackerMods.komeiRovente) {
        let defenderContainer = await this.loadCharacterStatusContainer(characterId);
        defenderContainer = applyKomeiRoventeOnContactHit(defenderContainer, true);
        await this.persistCharacterStatusContainer(characterId, defenderContainer);
      }
    }

    await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, characterId));

    if (nextAttackerMeta && attackerCharacterId) {
      await db
        .update(characters)
        .set({ uiMetadata: nextAttackerMeta })
        .where(eq(characters.id, attackerCharacterId));
    }

    return resolveCombatHp(next, hpMax);
  }

  /**
   * Danno da tier waza con pipeline Sōkaiju (Kongen floor, Gōjin se reattivo) e mitigazione Itami bersaglio.
   */
  async applyCombatTierDamage(
    victimCharacterId: string,
    attackerCharacterId: string,
    tier: number,
    options: {
      isReactiveCounter?: boolean
      flatBonus?: number
      contactHit?: boolean
      wazaEffectText?: string | null
    } = {},
  ): Promise<{
    vitals: { hpCurrent: number; hpMax: number }
    hpDamage: number
    breakdown: DamagePipelineBreakdown
  }> {
    if (!isWazaTier(tier)) {
      throw new Error(`Tier waza non valido: ${tier}`);
    }

    const victimBundle = await this.getSkiruBundleForCharacter(victimCharacterId);
    const attackerBundle = await this.getSkiruBundleForCharacter(attackerCharacterId);
    if (!victimBundle || !attackerBundle) {
      throw new Error('Personaggio non trovato');
    }

    const attackerContainer = await this.loadCharacterStatusContainer(attackerCharacterId);
    const victimContainer = await this.loadCharacterStatusContainer(victimCharacterId);
    const attackerChar = await db.query.characters.findFirst({
      where: eq(characters.id, attackerCharacterId),
      columns: { uiMetadata: true },
    });
    const victimChar = await db.query.characters.findFirst({
      where: eq(characters.id, victimCharacterId),
      columns: { uiMetadata: true },
    });
    const attackerMeta = (attackerChar?.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const victimMeta = (victimChar?.uiMetadata ?? {}) as DoMechanicsUiMeta;

    const offensive = statusToOffensiveDamageBonuses(
      attackerContainer,
      tier as WazaTier,
      attackerMeta,
    );
    const takenFlat = statusToDamageTakenFlatBonus(victimContainer, tier as WazaTier);
    const victimMods = compileCombatModifiers(victimContainer, victimMeta);
    const riderAndOptionBonus = options.flatBonus ?? 0;
    const totalFlatBonus =
      riderAndOptionBonus + (offensive.flatBonus ?? 0) + takenFlat;

    const breakdown = resolveDamageToHp({
      tier: tier as WazaTier,
      attackerSheet: attackerBundle.skiruSheet as SkiruSheet,
      targetSheet: victimBundle.skiruSheet as SkiruSheet,
      isReactiveCounter: options.isReactiveCounter,
      wazaTags: extractMechanicTagsFromEffect(options.wazaEffectText),
      bonuses: {
        flatBonus: totalFlatBonus,
        damageMultiplier: offensive.damageMultiplier,
      },
      extraMitigationPercent: victimMods.mitigationBonusPercent,
    });

    const vitals = await this.applyCombatHpDelta(victimCharacterId, -breakdown.hpDamage, {
      hitTier: tier,
      attackerCharacterId,
      contactHit: options.contactHit,
    });

    return { vitals, hpDamage: breakdown.hpDamage, breakdown };
  }

  /** Confronto IR attaccante vs difensore; a parità IR vince chi ha speso meno quarti. */
  async resolveCombatConfrontationBetween(
    actorCharacterId: string,
    defenderCharacterId: string,
    actorInput: ActionIndexInput,
    defenderInput: ActionIndexInput,
    options: { actorContent?: string; defenderContent?: string } = {},
  ) {
    const actorBundle = await this.getSkiruBundleForCharacter(actorCharacterId);
    const defenderBundle = await this.getSkiruBundleForCharacter(defenderCharacterId);
    if (!actorBundle || !defenderBundle) {
      throw new Error('Personaggio non trovato');
    }

    const actorSheet = actorBundle.skiruSheet as SkiruSheet;
    const defenderSheet = defenderBundle.skiruSheet as SkiruSheet;
    const sokaiju = buildSokaijuConfrontationFromSheets(
      actorSheet,
      defenderSheet,
      options.actorContent ? messageDeclaresEnergeticWaza(options.actorContent) : false,
      options.defenderContent ? messageDeclaresEnergeticWaza(options.defenderContent) : false,
    );

    const actorSkiruId = options.actorContent ? extractLaunchSkiruId(options.actorContent) : null;
    const defenderIrPenalty = computeSkiruRiderDefenderIrPenalty(actorSkiruId);
    const adjustedDefenderInput =
      defenderIrPenalty !== 0
        ? {
            ...defenderInput,
            indexBonus: (defenderInput.indexBonus ?? 0) + defenderIrPenalty,
          }
        : defenderInput;

    return resolveConfrontation(actorSheet, actorInput, defenderSheet, adjustedDefenderInput, sokaiju);
  }

  async applyStatusEffectToCharacter(
    characterId: string,
    input: {
      statusId?: string;
      element?: ElementId;
      stacks?: number;
      durationTurns?: number;
      addStacks?: boolean;
    },
  ) {
    if (!input.statusId && !input.element) {
      throw new Error('Specificare statusId o element.');
    }

    let container = await this.loadCharacterStatusContainer(characterId);

    if (input.element) {
      container = applyElementalStatus(container, input.element, {
        stacks: input.stacks,
        durationTurns: input.durationTurns,
        addStacks: input.addStacks,
      });
    } else {
      const statusId = parseStatusIdInput(input.statusId!);
      container = applyStatus(container, statusId, {
        stacks: input.stacks,
        durationTurns: input.durationTurns,
        addStacks: input.addStacks,
      });
    }

    await this.persistCharacterStatusContainer(characterId, container);
    return this.getStatusEffectsState(characterId);
  }

  async removeStatusEffectFromCharacter(characterId: string, statusIdRaw: string) {
    const statusId = parseStatusIdInput(statusIdRaw);
    let container = await this.loadCharacterStatusContainer(characterId);
    container = removeStatus(container, statusId);
    await this.persistCharacterStatusContainer(characterId, container);
    return this.getStatusEffectsState(characterId);
  }

  /** Fine sessione: azzera stack CS, elimina tutti gli status e i costrutti in campo. HP intatti. */
  async resetCombatState(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, baseSlots: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const resetChrono: StoredChronoStackState = {
      current: 0,
      accumulating: false,
      skipNextTurn: false,
      overheatTurns: 0,
    };

    await db.transaction(async (tx) => {
      // reset chrono stack
      await tx.update(characters)
        .set({ chronoStackState: resetChrono })
        .where(eq(characters.id, characterId));

      // cancella tutti gli status effect del PG
      await tx.delete(characterStatusEffects)
        .where(
          and(
            eq(characterStatusEffects.characterId, characterId),
            eq(characterStatusEffects.targetKind, 'character'),
          ),
        );

      // rimuove tutti i costrutti in campo del PG
      await tx.delete(fieldConstructs)
        .where(eq(fieldConstructs.creatorCharacterId, characterId));
    });

    return { ok: true, resetChrono };
  }

  async tickCharacterStatusEndOfTurn(characterId: string, currentCs?: number) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, uiMetadata: true, madoshoId: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    let uiMeta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const kyoshinTick = tickKyoshinEndOfTurn(uiMeta);
    uiMeta = kyoshinTick.meta;
    const kyoshinDamage = kyoshinTick.damage;

    if (char.madoshoId === 'komonoire') {
      uiMeta = tickKomonoireEndOfTurn(uiMeta);
    }

    const container = await this.loadCharacterStatusContainer(characterId);
    const chronoBefore = await this.getCombatChronoVitals(characterId);
    const csForStatus = currentCs ?? chronoBefore.csCurrent;
    const combatMods = compileCombatModifiers(container, uiMeta);
    const result = tickStatusEndOfCharacterTurn(container, {
      currentCs: csForStatus,
      blockStatusDecay: combatMods.blockStatusDecay,
    });
    await this.persistCharacterStatusContainer(characterId, result.container);

    await db
      .update(characters)
      .set({ uiMetadata: uiMeta })
      .where(eq(characters.id, characterId));

    if (result.selfDamage > 0) {
      await this.applyCombatHpDelta(characterId, -result.selfDamage);
    }
    if (kyoshinDamage > 0) {
      await this.applyCombatHpDelta(characterId, -kyoshinDamage);
    }

    const itoTick = await this.tickItoTensionEndOfTurn(characterId);

    return {
      ...await this.getStatusEffectsState(characterId),
      tick: {
        selfDamage: result.selfDamage,
        log: result.log,
      },
      itoTension: itoTick,
    };
  }

  /** Fine azione chat: DoT status + decay stack + rilascio Itō naturale. */
  async tickCharacterStatusAfterChatAction(characterId: string, currentCs?: number) {
    return this.tickCharacterStatusEndOfTurn(characterId, currentCs);
  }

  async recordCharacterStatusHitTaken(characterId: string) {
    const container = await this.loadCharacterStatusContainer(characterId);
    const next = onSuccessfulHitTaken(container);
    await this.persistCharacterStatusContainer(characterId, next);
    const chronoHit = await this.applyCombatChronoHitTaken(characterId);
    return {
      ...await this.getStatusEffectsState(characterId),
      chronoHit: { csGained: chronoHit.csGained },
    };
  }

  async recordCharacterStatusConfrontation(
    characterId: string,
    event: { won: boolean; tookDamage: boolean },
  ) {
    const container = await this.loadCharacterStatusContainer(characterId);
    const next = onConfrontationStatusEvent(container, event);
    await this.persistCharacterStatusContainer(characterId, next);
    return this.getStatusEffectsState(characterId);
  }

  async listFieldConstructsForCharacter(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const proprietaMap = this.readFieldConstructProprietaMap(
      char.uiMetadata as { fieldConstructProprieta?: Record<string, string[]> },
    );

    const rows = await db.query.fieldConstructs.findMany({
      where: eq(fieldConstructs.creatorCharacterId, characterId),
      orderBy: (fc, { desc }) => [desc(fc.createdAt)],
    });

    return {
      characterId,
      constructs: rows.map((r) =>
        fieldConstructToApi(
          {
            id: r.id,
            creatorCharacterId: r.creatorCharacterId,
            label: r.label,
            size: r.size,
            wazaTier: r.wazaTier as FieldConstruct['wazaTier'],
            kongenRank: r.kongenRank,
            maxResistance: r.maxResistance,
            remainingResistance: r.remainingResistance,
            stationary: r.stationary,
            createdAt: r.createdAt?.toISOString(),
          },
          { proprieta: proprietaMap[r.id] },
        ),
      ),
    };
  }

  private readFieldConstructProprietaMap(
    meta: { fieldConstructProprieta?: Record<string, string[]> } | null | undefined,
  ): Record<string, string[]> {
    return meta?.fieldConstructProprieta ?? {};
  }

  async getFieldConstructOwnerId(constructId: string): Promise<string | null> {
    const row = await db.query.fieldConstructs.findFirst({
      where: eq(fieldConstructs.id, constructId),
      columns: { creatorCharacterId: true },
    });
    return row?.creatorCharacterId ?? null;
  }

  async createFieldConstructForCharacter(
    characterId: string,
    input: {
      label: string;
      wazaTier: number;
      size?: string;
      stationary?: boolean;
      descriptionChars?: number;
      isNewForm?: boolean;
      proprieta?: string[];
    },
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const bundle = await this.getSkiruBundleForCharacter(characterId);
    if (!bundle) throw new Error('Personaggio non trovato');
    const skiruSheet = bundle.skiruSheet as SkiruSheet;
    const activeConstructs = await db.query.fieldConstructs.findMany({
      where: eq(fieldConstructs.creatorCharacterId, characterId),
      columns: { id: true },
    });
    if (!canPlaceFieldConstruct(activeConstructs.length, skiruSheet)) {
      throw new Error(`Limite costrutti attivi: massimo ${DEFAULT_MAX_ACTIVE_CONSTRUCTS} sul campo.`);
    }

    const size = input.size && isConstructSizeId(input.size) ? input.size : 'media';
    if (!isConstructSizeAllowedForCreator(size, skiruSheet)) {
      const maxSize = getMaxAllowedConstructSizeId(skiruSheet);
      throw new Error(`Taglia costrutto non consentita: massimo «${maxSize}».`);
    }

    const id = crypto.randomUUID();
    const built = createFieldConstruct({
      id,
      creatorCharacterId: characterId,
      label: input.label,
      wazaTier: input.wazaTier,
      size,
      stationary: input.stationary,
    });

    await db.insert(fieldConstructs).values({
      id: built.id,
      creatorCharacterId: characterId,
      label: built.label,
      size: built.size,
      wazaTier: built.wazaTier,
      kongenRank: built.kongenRank,
      maxResistance: built.maxResistance,
      remainingResistance: built.remainingResistance,
      stationary: built.stationary,
    });

    const proprieta = (input.proprieta ?? [])
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);

    let meta = (char.uiMetadata ?? {}) as {
      fieldConstructProprieta?: Record<string, string[]>;
      gosaStacks?: number;
    };
    if (proprieta.length > 0) {
      meta = {
        ...meta,
        fieldConstructProprieta: {
          ...(meta.fieldConstructProprieta ?? {}),
          [built.id]: proprieta,
        },
      };
    }

    const currentGosa = clampGosaStacks(meta.gosaStacks ?? 0);
    const nextGosa = accumulateGosaOnConstruct(currentGosa, {
      descriptionChars: input.descriptionChars ?? input.label.length,
      wazaTier: input.wazaTier,
      size,
      isNewForm: input.isNewForm,
    });
    if (nextGosa !== currentGosa || proprieta.length > 0) {
      await db
        .update(characters)
        .set({
          uiMetadata: {
            ...meta,
            ...(nextGosa !== currentGosa ? { gosaStacks: nextGosa } : {}),
          },
        })
        .where(eq(characters.id, characterId));
    }

    return this.listFieldConstructsForCharacter(characterId);
  }

  async damageFieldConstructById(
    constructId: string,
    incomingDamage: number,
  ) {
    const row = await db.query.fieldConstructs.findFirst({
      where: eq(fieldConstructs.id, constructId),
    });
    if (!row) throw new Error('Costrutto non trovato');

    const current: FieldConstruct = {
      id: row.id,
      creatorCharacterId: row.creatorCharacterId,
      label: row.label,
      size: row.size,
      wazaTier: row.wazaTier as FieldConstruct['wazaTier'],
      kongenRank: row.kongenRank,
      maxResistance: row.maxResistance,
      remainingResistance: row.remainingResistance,
      stationary: row.stationary,
    };

    const result = applyDamageToFieldConstruct(current, incomingDamage);

    if (result.destroyed) {
      await this.recordEdenDestroyedConstructIfActive(row.creatorCharacterId, {
        label: row.label,
        wazaTier: row.wazaTier,
        size: row.size,
        stationary: row.stationary,
      });
      await db.delete(fieldConstructs).where(eq(fieldConstructs.id, constructId));
    } else {
      await db
        .update(fieldConstructs)
        .set({ remainingResistance: result.construct.remainingResistance })
        .where(eq(fieldConstructs.id, constructId));
    }

    return {
      constructId,
      absorbed: result.absorbed,
      remainder: result.remainder,
      destroyed: result.destroyed,
      remainingResistance: result.destroyed ? 0 : result.construct.remainingResistance,
      list: await this.listFieldConstructsForCharacter(row.creatorCharacterId),
    };
  }

  async destroyFieldConstructById(constructId: string) {
    const row = await db.query.fieldConstructs.findFirst({
      where: eq(fieldConstructs.id, constructId),
    });
    if (!row) throw new Error('Costrutto non trovato');
    await this.recordEdenDestroyedConstructIfActive(row.creatorCharacterId, {
      label: row.label,
      wazaTier: row.wazaTier,
      size: row.size,
      stationary: row.stationary,
    });
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, row.creatorCharacterId),
      columns: { uiMetadata: true },
    });
    if (char) {
      const meta = (char.uiMetadata ?? {}) as {
        fieldConstructProprieta?: Record<string, string[]>;
      };
      if (meta.fieldConstructProprieta?.[constructId]) {
        const next = { ...meta.fieldConstructProprieta };
        delete next[constructId];
        await db
          .update(characters)
          .set({
            uiMetadata: {
              ...meta,
              fieldConstructProprieta: next,
            },
          })
          .where(eq(characters.id, row.creatorCharacterId));
      }
    }
    await db.delete(fieldConstructs).where(eq(fieldConstructs.id, constructId));
    return this.listFieldConstructsForCharacter(row.creatorCharacterId);
  }

  async getToroState(characterId: string, weaponTagsInContext: string[] = []) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as {
      toroWeaponInContact?: boolean;
      toroBatteria?: boolean;
    };
    const passiveState = await this.getPassiveSlotsState(characterId);
    const equipped = passiveState.slots
      .map((s) => s.equipped)
      .filter(Boolean) as { id: string; name: string }[];

    const ownedToro = passiveState.ownedPassives.some((p) =>
      hasToroFromSkillMeta({ poolId: null, name: p.name }),
    );

    let hasToroEquipped = false;
    for (const slot of equipped) {
      const skill = await db.query.skills.findFirst({
        where: eq(skills.id, slot.id),
        columns: { poolId: true, name: true },
      });
      if (skill && hasToroFromSkillMeta(skill)) {
        hasToroEquipped = true;
        break;
      }
    }

    const hasMichishirube = passiveState.ownedPassives.some((p) =>
      p.name.toLowerCase().includes('michishirube'),
    );

    const toro = resolveToroState({
      hasToroPassiveEquipped: hasToroEquipped || ownedToro,
      weaponInContact: meta.toroWeaponInContact ?? false,
      weaponTagsInContext,
    });

    return {
      ...toro,
      toroPassivePoolId: TORO_PASSIVE_POOL_ID,
      weaponInContact: meta.toroWeaponInContact ?? false,
      toroBatteria: meta.toroBatteria ?? false,
      hasToroPassiveOwned: ownedToro,
      hasToroPassiveEquipped: hasToroEquipped,
      hasMichishirube,
      contactToProjectile: toro.allowsTokaChannel && hasMichishirube,
    };
  }

  async patchToroState(
    characterId: string,
    patch: { weaponInContact?: boolean; toroBatteria?: boolean },
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as {
      toroWeaponInContact?: boolean;
      toroBatteria?: boolean;
    };
    const next = {
      ...meta,
      ...(patch.weaponInContact !== undefined
        ? { toroWeaponInContact: patch.weaponInContact }
        : {}),
      ...(patch.toroBatteria !== undefined ? { toroBatteria: patch.toroBatteria } : {}),
    };
    await db
      .update(characters)
      .set({ uiMetadata: next })
      .where(eq(characters.id, characterId));

    return this.getToroState(characterId);
  }

  /** @deprecated usa patchToroState */
  async setToroWeaponInContact(characterId: string, weaponInContact: boolean) {
    return this.patchToroState(characterId, { weaponInContact });
  }

  async getGosaState(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');
    const meta = (char.uiMetadata ?? {}) as { gosaStacks?: number };
    return resolveGosaState(meta.gosaStacks ?? 0);
  }

  async patchGosaState(
    characterId: string,
    input: { action?: 'correct'; stacks?: number },
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = char.uiMetadata ?? {};
    const current = clampGosaStacks((meta as { gosaStacks?: number }).gosaStacks ?? 0);
    let next = current;

    if (input.action === 'correct') {
      const result = correctGosaStacks(current, GOSA_CORRECTION_CS_PER_STACK);
      if (!result) throw new Error('Impossibile correggere Gosa');
      next = result.stacksAfter;
    } else if (typeof input.stacks === 'number') {
      next = clampGosaStacks(input.stacks);
    }

    await db
      .update(characters)
      .set({
        uiMetadata: {
          ...meta,
          gosaStacks: next,
        },
      })
      .where(eq(characters.id, characterId));

    return this.getGosaState(characterId);
  }

  async getDoMechanics(characterId: string, currentCs = 0) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');
    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    return {
      ...readDoMechanicsFromMeta(meta, currentCs),
      combatActiveWeaponIds: meta.combatActiveWeaponIds ?? [],
      combatToroWeaponIds: meta.combatToroWeaponIds ?? [],
      combatAmmo: meta.combatAmmo ?? {},
    };
  }

  /** Tag `[stato: …]` con meccaniche Dō e status attivi (coda azione chat). */
  async buildActionStateSummaryTag(characterId: string): Promise<string | null> {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) return null;

    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const cs = (await this.getCombatChronoVitals(characterId)).csCurrent;
    const input: ActionStateSummaryInput = {
      doMechanics: readDoMechanicsFromMeta(meta, cs),
      statusContainer: await this.loadCharacterStatusContainer(characterId),
      uiMeta: meta,
    };
    return buildActionStateSummaryTag(input);
  }

  private async syncDebitoStatusStacks(debtorCharacterId: string, stacks: number): Promise<void> {
    let container = await this.loadCharacterStatusContainer(debtorCharacterId);
    if (stacks <= 0) {
      container = removeStatus(container, 'debito');
    } else {
      container = applyStatus(container, 'debito', { stacks });
    }
    await this.persistCharacterStatusContainer(debtorCharacterId, container);
  }

  /**
   * Automazione waza Hadō avanzate + tag investimento/debito da messaggio chat.
   */
  async processChatWazaAutomation(
    characterId: string,
    content: string,
    options: {
      roomParticipants?: WazaChatParticipant[];
      isMasterscreen?: boolean;
    } = {},
  ) {
    if (options.isMasterscreen) return null;

    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true, name: true, surname: true, madoshoId: true, skiruSheet: true, constitution: true, dexterity: true, mind: true, empathy: true },
    });
    if (!char) return null;

    const baseStats = this.baseStatsFromCharacter(char);
    const actorSkiruSheet = resolveCharacterSkiruSheet(
      char.skiruSheet as Record<string, number> | undefined,
      baseStats,
    );

    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const chronoState = await this.loadStoredChronoState(characterId);
    const chronoBefore = chronoState.current;
    const statusContainer = await this.loadCharacterStatusContainer(characterId);
    const equippedPassivePoolIds = await this.getEquippedPassivePoolIds(characterId);
    const ownedWazaPoolIds = await this.getOwnedWazaPoolIds(characterId);

    const prereq = validateWazaChatPrerequisites({
      content,
      wazaIndex: WAZA_TAG_INDEX,
      chronoCsAvailable: chronoBefore,
      ownedWazaPoolIds,
    });
    if (!prereq.ok) {
      return {
        log: [...prereq.errors, ...prereq.warnings],
        effects: [],
        affectedCharacterIds: [],
        chronoStack: await this.getCombatChronoVitals(characterId),
      };
    }

    const automation = processWazaChatAutomation({
      content,
      meta,
      statusContainer,
      wazaIndex: WAZA_TAG_INDEX,
      chronoCsAvailable: chronoBefore,
      actorCharacterId: characterId,
      roomParticipants: options.roomParticipants,
      madoshoId: char.madoshoId,
      actorSkiruSheet,
      equippedPassivePoolIds,
    });

    const csBlock = validateWazaChatCsAffordability(automation.csDelta, chronoBefore);
    if (csBlock) {
      return {
        log: [csBlock, ...prereq.warnings],
        effects: [],
        affectedCharacterIds: [],
        chronoStack: await this.getCombatChronoVitals(characterId),
      };
    }

    let nextChrono = chronoState;
    if (automation.csDelta !== 0) {
      if (automation.csDelta < 0) {
        const spent = spendChronoStack(
          {
            current: nextChrono.current,
            overheatTurns: nextChrono.overheatTurns,
            skipNextTurn: nextChrono.skipNextTurn,
          },
          -automation.csDelta,
        );
        if (spent) {
          nextChrono = { ...nextChrono, ...spent };
        }
      } else {
        nextChrono = {
          ...nextChrono,
          current: nextChrono.current + automation.csDelta,
        };
      }
      await this.persistStoredChronoState(characterId, nextChrono);
    }

    const affectedCharacterIds = new Set<string>([characterId]);

    for (const effect of automation.effects) {
      if (effect.kind === 'debito_applied') {
        await this.syncDebitoStatusStacks(effect.debtorCharacterId, effect.stacks);
        affectedCharacterIds.add(effect.debtorCharacterId);
      }
      if (effect.kind === 'debito_interest') {
        await this.syncDebitoStatusStacks(effect.debtorCharacterId, effect.stacks);
        affectedCharacterIds.add(effect.debtorCharacterId);
      }
      if (effect.kind === 'debito_collection') {
        await this.syncDebitoStatusStacks(effect.debtorCharacterId, 0);
        if (effect.damage > 0) {
          await this.applyCombatHpDelta(effect.debtorCharacterId, -effect.damage);
        }
        affectedCharacterIds.add(effect.debtorCharacterId);
      }
      if (effect.kind === 'sutura_applied') {
        const victim = await db.query.characters.findFirst({
          where: eq(characters.id, effect.victimCharacterId),
          columns: { uiMetadata: true },
        });
        if (victim) {
          const victimMeta = (victim.uiMetadata ?? {}) as DoMechanicsUiMeta;
          const actorName = `${char.name}${char.surname ? ` ${char.surname}` : ''}`.trim();
          const patched = applySutura(victimMeta, {
            characterId,
            displayName: actorName,
          }, effect.suturaKind);
          await db
            .update(characters)
            .set({ uiMetadata: { ...victimMeta, ...patched } })
            .where(eq(characters.id, effect.victimCharacterId));
          affectedCharacterIds.add(effect.victimCharacterId);
        }
      }
      if (effect.kind === 'shinryaku_construct') {
        await this.createFieldConstructForCharacter(characterId, {
          label: effect.label,
          wazaTier: SHINRYAKU_WAZA_TIER,
          size: SHINRYAKU_CONSTRUCT_SIZE,
          stationary: true,
          isNewForm: true,
        });
      }
      if (effect.kind === 'meisaku_construct') {
        await this.createFieldConstructForCharacter(characterId, {
          label: effect.label,
          wazaTier: MEISAKU_WAZA_TIER,
          size: MEISAKU_CONSTRUCT_SIZE,
          stationary: true,
          isNewForm: true,
        });
      }
      if (effect.kind === 'eden_regen') {
        for (const snap of effect.constructs) {
          const size = isConstructSizeId(snap.size) ? snap.size : 'media';
          const tier = isWazaTier(snap.wazaTier) ? snap.wazaTier : 1;
          await this.createFieldConstructForCharacter(characterId, {
            label: snap.label,
            wazaTier: tier,
            size,
            stationary: snap.stationary,
            isNewForm: false,
          });
        }
      }
      if (effect.kind === 'shinryaku_contact_damage' && effect.damage > 0) {
        await this.applyCombatTierDamage(effect.victimCharacterId, characterId, SHINRYAKU_WAZA_TIER, {
          contactHit: true,
        });
        affectedCharacterIds.add(effect.victimCharacterId);
      }
      if (effect.kind === 'generiche_status_applied') {
        let victimContainer = await this.loadCharacterStatusContainer(effect.victimCharacterId);
        victimContainer = applyStatus(victimContainer, effect.statusId, {
          stacks: effect.stacks,
          durationTurns: effect.durationTurns,
          addStacks: effect.statusId === 'emorragia',
        });
        await this.persistCharacterStatusContainer(effect.victimCharacterId, victimContainer);
        affectedCharacterIds.add(effect.victimCharacterId);
      }
      if (effect.kind === 'sokaiju_goju_status_applied') {
        let victimContainer = await this.loadCharacterStatusContainer(effect.victimCharacterId);
        victimContainer = applyStatus(victimContainer, effect.statusId, {
          stacks: effect.stacks,
          durationTurns: effect.durationTurns,
        });
        await this.persistCharacterStatusContainer(effect.victimCharacterId, victimContainer);
        affectedCharacterIds.add(effect.victimCharacterId);
      }
      if (effect.kind === 'waza_launch_damage') {
        const entry = WAZA_TAG_INDEX.get(normalizeWazaLookupKey(effect.wazaName));
        const effectText = entry?.effect ?? entry?.description ?? '';

        const wazaTags = extractMechanicTagsFromEffect(effectText);
        const actorInput: ActionIndexInput = effect.skiruId
          ? { ...buildActionIndexFromDeclaredSkiru(actorSkiruSheet, effect.skiruId), wazaTags }
          : { ...buildIndicativeActionIndex(actorSkiruSheet), wazaTags };
        const defenderBundle = await this.getSkiruBundleForCharacter(effect.victimCharacterId);
        const defenderSheet = (defenderBundle?.skiruSheet ?? {}) as SkiruSheet;
        const defenderInput = buildIndicativeActionIndex(defenderSheet);

        const confrontation = await this.resolveCombatConfrontationBetween(
          characterId,
          effect.victimCharacterId,
          actorInput,
          defenderInput,
          { actorContent: content },
        );

        let landed = didOffensiveActionLand(confrontation);

        if (!landed) {
          automation.log.push(
            `Lancio waza: colpo mancato su ${effect.displayName} (IR ${confrontation.actor.successIndex} vs ${confrontation.defender.successIndex})`,
          );
          continue;
        }

        const riderBonus = computeSkiruRiderFlatBonus(effect.skiruId, effectText);
        const launchFlatBonus = (effect.flatBonus ?? 0) + riderBonus;
        await this.applyCombatTierDamage(effect.victimCharacterId, characterId, effect.tier, {
          flatBonus: launchFlatBonus,
          contactHit: wazaEffectDeclaresContact(effectText),
          wazaEffectText: effectText,
        });
        automation.meta = noteDamageDealtToTarget(automation.meta, effect.victimCharacterId);
        automation.log.push(
          `Lancio waza: colpo a segno su ${effect.displayName} (IR ${confrontation.actor.successIndex} vs ${confrontation.defender.successIndex})`,
        );
        affectedCharacterIds.add(effect.victimCharacterId);
      }
      if (effect.kind === 'kyoshin_vibration_applied') {
        const victim = await db.query.characters.findFirst({
          where: eq(characters.id, effect.victimCharacterId),
          columns: { uiMetadata: true },
        });
        if (victim) {
          const victimMeta = (victim.uiMetadata ?? {}) as DoMechanicsUiMeta;
          const patched = applyKyoshinVibration(victimMeta, effect.tier as 1 | 2 | 3 | 4 | 5);
          await db
            .update(characters)
            .set({ uiMetadata: { ...victimMeta, ...patched } })
            .where(eq(characters.id, effect.victimCharacterId));
          affectedCharacterIds.add(effect.victimCharacterId);
        }
      }
    }

    if (hasDebitoRepayTag(content) && options.roomParticipants?.length) {
      for (const p of options.roomParticipants) {
        if (p.characterId === characterId) continue;
        const creditor = await db.query.characters.findFirst({
          where: eq(characters.id, p.characterId),
          columns: { uiMetadata: true },
        });
        if (!creditor) continue;
        const creditorMeta = (creditor.uiMetadata ?? {}) as DoMechanicsUiMeta;
        const debts = readShakkinDebts(creditorMeta);
        if (!debts.some((d) => d.debtorCharacterId === characterId)) continue;

        const repaid = processDebtorRepayMessage(creditorMeta, characterId);
        await db
          .update(characters)
          .set({ uiMetadata: { ...creditorMeta, ...repaid.meta } })
          .where(eq(characters.id, p.characterId));

        await this.syncDebitoStatusStacks(
          characterId,
          repaid.cleared ? 0 : repaid.stacks,
        );
        affectedCharacterIds.add(p.characterId);
        automation.log.push(
          repaid.cleared
            ? 'Debito estinto (restituzione)'
            : `Debito −1 stack (restituzione, ×${repaid.stacks} restanti)`,
        );
      }
    }

    await db
      .update(characters)
      .set({ uiMetadata: automation.meta })
      .where(eq(characters.id, characterId));

    await this.persistCharacterStatusContainer(characterId, automation.statusContainer);

    return {
      log: automation.log,
      effects: automation.effects,
      affectedCharacterIds: [...affectedCharacterIds],
      chronoStack: await this.getCombatChronoVitals(characterId),
    };
  }

  /**
   * Validazione pre-invio chat: blocca solo i lanci waza non sostenibili in CS.
   * Non valida quarti/turni (restano narrativa Master).
   */
  async validateChatWazaCsOnly(
    characterId: string,
    content: string,
    options: {
      roomParticipants?: WazaChatParticipant[];
      isMasterscreen?: boolean;
    } = {},
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    if (options.isMasterscreen) return { ok: true };
    if (!/\[waza:[^\]]+\]/i.test(content)) return { ok: true };

    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true, name: true, surname: true, madoshoId: true, skiruSheet: true, constitution: true, dexterity: true, mind: true, empathy: true },
    });
    if (!char) return { ok: true };

    const baseStats = this.baseStatsFromCharacter(char);
    const actorSkiruSheet = resolveCharacterSkiruSheet(
      char.skiruSheet as Record<string, number> | undefined,
      baseStats,
    );
    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const chronoState = await this.loadStoredChronoState(characterId);
    const chronoBefore = chronoState.current;
    const statusContainer = await this.loadCharacterStatusContainer(characterId);
    const equippedPassivePoolIds = await this.getEquippedPassivePoolIds(characterId);

    const automation = processWazaChatAutomation({
      content,
      meta,
      statusContainer,
      wazaIndex: WAZA_TAG_INDEX,
      chronoCsAvailable: chronoBefore,
      actorCharacterId: characterId,
      roomParticipants: options.roomParticipants,
      madoshoId: char.madoshoId,
      actorSkiruSheet,
      equippedPassivePoolIds,
    });

    const csBlock = validateWazaChatCsAffordability(automation.csDelta, chronoBefore);
    if (csBlock) return { ok: false, message: csBlock };
    return { ok: true };
  }

  async applyItoEmorragiaFromOverflow(characterId: string, stacksToAdd: number) {
    if (stacksToAdd <= 0) return;
    let container = await this.loadCharacterStatusContainer(characterId);
    container = applyStatus(container, 'emorragia', {
      stacks: stacksToAdd,
      addStacks: true,
    });
    await this.persistCharacterStatusContainer(characterId, container);
  }

  async tickItoTensionEndOfTurn(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const tick = tickItoTensionInMeta(meta);

    await db
      .update(characters)
      .set({ uiMetadata: tick.meta })
      .where(eq(characters.id, characterId));

    return {
      decayed: tick.decayed,
      skippedDecay: tick.decayed === 0 && (meta.itoUsedThisTurn ?? false),
      tension: readDoMechanicsFromMeta(tick.meta).ito,
    };
  }

  /** Fine turno: aggiorna stato Iai (turno senza waza → incombenza pronta). */
  async tickGenerichePassivesEndOfTurn(characterId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) return;

    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const next = tickGenericheIaiEndOfTurn(meta, meta.genericheTurnWazaUsed === true);

    await db
      .update(characters)
      .set({ uiMetadata: next })
      .where(eq(characters.id, characterId));
  }

  private async recordEdenDestroyedConstructIfActive(
    creatorCharacterId: string,
    snapshot: EdenDestroyedConstructSnapshot,
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, creatorCharacterId),
      columns: { uiMetadata: true },
    });
    if (!char) return;

    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    if (!readEdenState(meta)) return;

    const patched = recordEdenDestroyedConstruct(meta, snapshot);
    await db
      .update(characters)
      .set({ uiMetadata: patched })
      .where(eq(characters.id, creatorCharacterId));
  }

  async patchDoMechanics(
    characterId: string,
    input: DoMechanicsPatch & {
      itoTension?: number;
      naikanPhase?: number;
      yuragiPhase?: string;
      kaden?: number;
      currentCs?: number;
      lastReceivedHitTier?: number;
      threads?: 1 | 2;
    },
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');

    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    let next: DoMechanicsUiMeta = { ...meta };
    let emorragiaStacks = 0;
    let csSpent = 0;
    let decayed = 0;
    let chronoVitals: Awaited<ReturnType<typeof this.getCombatChronoVitals>> | null = null;

    if (input.style === 'ito' && input.action === 'accumulate') {
      const threads = input.threads === 2 ? 2 : 1;
      const acc = accumulateItoTensionInMeta(next, threads);
      next = acc.meta;
      emorragiaStacks = acc.emorragiaStacks;
    } else if (input.style === 'ito' && input.action === 'release') {
      const chronoState = await this.loadStoredChronoState(characterId);
      const spent = spendChronoStack(
        {
          current: chronoState.current,
          overheatTurns: chronoState.overheatTurns,
          skipNextTurn: chronoState.skipNextTurn,
        },
        TENSIONE_RELEASE_CS,
      );
      if (!spent) {
        throw new Error(`Servono ${TENSIONE_RELEASE_CS} CS per rilasciare i fili (−2 Tensione).`);
      }
      await this.persistStoredChronoState(characterId, { ...chronoState, ...spent });
      chronoVitals = await this.getCombatChronoVitals(characterId);
      csSpent = TENSIONE_RELEASE_CS;
      next = releaseItoTensionInMeta(next);
    } else if (input.style === 'ito' && input.action === 'tickTurn') {
      const tick = tickItoTensionInMeta(next);
      next = tick.meta;
      decayed = tick.decayed;
    } else if (input.style && input.action) {
      if (input.style === 'hensei' && input.action === 'setPhase') {
        if (!input.phase || !isYuragiPhase(input.phase)) {
          throw new Error('Fase Yuragi richiesta');
        }
      }
      next = patchDoMechanicsMeta(next, input as DoMechanicsPatch);
    }

    if (typeof input.itoTension === 'number') {
      const before = next.itoTension ?? 0;
      const after = Math.max(0, Math.floor(input.itoTension));
      emorragiaStacks += overflowDeltaOnTensioneIncrease(before, after);
      next.itoTension = after;
    }
    if (typeof input.naikanPhase === 'number') {
      next.naikanPhase = clampJunkanPhase(input.naikanPhase);
    }
    if (typeof input.yuragiPhase === 'string' && isYuragiPhase(input.yuragiPhase)) {
      next.yuragiPhase = input.yuragiPhase;
    }
    if (typeof input.kaden === 'number') {
      next.kaden = clampKaden(input.kaden);
    }
    if (typeof input.lastReceivedHitTier === 'number') {
      const t = Math.floor(input.lastReceivedHitTier);
      if (t >= 1 && t <= 5) next.lastReceivedHitTier = t;
      else delete next.lastReceivedHitTier;
    }

    await db
      .update(characters)
      .set({ uiMetadata: next })
      .where(eq(characters.id, characterId));

    if (emorragiaStacks > 0) {
      await this.applyItoEmorragiaFromOverflow(characterId, emorragiaStacks);
    }

    const snapshot = await this.getDoMechanics(characterId, input.currentCs ?? 0);
    return {
      ...snapshot,
      itoPatch: {
        emorragiaStacks,
        csSpent,
        decayed,
        chrono: chronoVitals,
      },
    };
  }

  async patchCombatWeapons(
    characterId: string,
    input: { activeWeaponIds?: string[]; toroWeaponIds?: string[]; ammo?: Record<string, number> },
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) throw new Error('Personaggio non trovato');
    const meta = (char.uiMetadata ?? {}) as DoMechanicsUiMeta;
    const next: DoMechanicsUiMeta = { ...meta };
    if (input.activeWeaponIds !== undefined) {
      // Vincolo armi impugnate — max 1, salvo Ambidestria (max 2). Cfr. spec §2 Zona2.
      next.combatActiveWeaponIds = input.activeWeaponIds.slice(0, 2);
    }
    if (input.toroWeaponIds !== undefined) {
      // Tōrō liberi e multipli — nessun limite. Cfr. spec §2 Zona2.
      next.combatToroWeaponIds = input.toroWeaponIds;
    }
    if (input.ammo !== undefined) {
      next.combatAmmo = { ...(meta.combatAmmo ?? {}), ...input.ammo };
    }
    await db.update(characters).set({ uiMetadata: next }).where(eq(characters.id, characterId));
    return {
      combatActiveWeaponIds: next.combatActiveWeaponIds ?? [],
      combatToroWeaponIds: next.combatToroWeaponIds ?? [],
      combatAmmo: next.combatAmmo ?? {},
    };
  }

  /**
   * Aggiorna il profilo pubblico del personaggio (avatar, miniAvatar, surname, bio, backgroundImage, themeMusicUrl, bannerPg).
   * backgroundImage, themeMusicUrl e bannerPg vengono salvati in uiMetadata.
   */
  async updateProfile(
    characterId: string,
    updates: {
      avatar?: string;
      miniAvatar?: string;
      surname?: string;
      bio?: string;
      backgroundImage?: string;
      themeMusicUrl?: string;
      bannerPg?: string;
    }
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    });

    if (!char) {
      throw new Error('Personaggio non trovato');
    }

    const updateData: Partial<typeof characters.$inferInsert> = {};
    
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.miniAvatar !== undefined) updateData.miniAvatar = updates.miniAvatar;
    if (updates.surname !== undefined) updateData.surname = updates.surname;
    if (updates.bio !== undefined) updateData.bio = updates.bio;

    // Aggiorna uiMetadata per backgroundImage e themeMusicUrl
    const currentMeta = (char.uiMetadata as {
      roleIcon?: string;
      orderIcon?: string;
      themeColor?: string;
      backgroundImage?: string;
      themeMusicUrl?: string;
      bannerPg?: string;
    } | null) ?? {};

    const newMeta = { ...currentMeta };
    if (updates.backgroundImage !== undefined) {
      newMeta.backgroundImage = updates.backgroundImage;
    }
    if (updates.themeMusicUrl !== undefined) {
      newMeta.themeMusicUrl = updates.themeMusicUrl;
    }
    if (updates.bannerPg !== undefined) {
      newMeta.bannerPg = updates.bannerPg;
    }

    if (
      updates.backgroundImage !== undefined ||
      updates.themeMusicUrl !== undefined ||
      updates.bannerPg !== undefined
    ) {
      updateData.uiMetadata = newMeta as any;
    }

    const [updated] = await db
      .update(characters)
      .set(updateData)
      .where(eq(characters.id, characterId))
      .returning();

    if (!updated) {
      throw new Error('Personaggio non trovato');
    }

    return updated;
  }

  /**
   * Alias staff e note Master (permessi verificati dal controller).
   */
  async updateStaffMeta(
    characterId: string,
    updates: { staffAlias?: string | null; masterNotes?: string | null },
  ) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    });

    if (!char) {
      throw new Error('Personaggio non trovato');
    }

    const updateData: Partial<typeof characters.$inferInsert> = {};
    if (updates.staffAlias !== undefined) {
      updateData.staffAlias = updates.staffAlias?.trim() || null;
    }
    if (updates.masterNotes !== undefined) {
      updateData.masterNotes = updates.masterNotes?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return char;
    }

    const [updated] = await db
      .update(characters)
      .set(updateData)
      .where(eq(characters.id, characterId))
      .returning();

    if (!updated) {
      throw new Error('Personaggio non trovato');
    }

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Skiru API — v. ROADMAP.md §6
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Restituisce la scheda Skiru completa del personaggio con:
   * - skiruSheet: nodi attuali
   * - expSpendable: EXP disponibili
   * - expCostNextByNode: costo del prossimo punto per ogni nodo standard
   * - derived: HP max, mitigazione, movimento
   * - skiruDomains: indici Ten/Chi/Jin per radar
   */
  async getSkiruSheet(userId: string) {
    const character = await db.query.characters.findFirst({
      where: eq(characters.userId, userId),
      columns: {
        id: true,
        strength: true,
        constitution: true,
        dexterity: true,
        mind: true,
        empathy: true,
        experienceSpendable: true,
        skiruSheet: true,
        currentHp: true,
      },
    });
    if (!character) return null;

    const baseStats: BaseStats = {
      strength: character.strength,
      constitution: character.constitution,
      dexterity: character.dexterity,
      mind: character.mind,
      empathy: character.empathy,
    };

    const skiruSheet = resolveCharacterSkiruSheet(
      character.skiruSheet as Record<string, number> | undefined,
      baseStats,
    );

    const expSpendable = character.experienceSpendable ?? 0;

    // Mapping exp spendibile → costo prossimo punto per ogni nodo standard.
    // null = nodo già al massimo o milestone (non acquistabile con EXP).
    const expCostNextByNode: Record<string, number | null> = {};
    for (const def of SKIRU_CATALOG) {
      if (def.kind === 'milestone' || def.expPurchasable === false) {
        expCostNextByNode[def.id] = null;
        continue;
      }
      const pts = getSkiruPoints(skiruSheet, def.id);
      const maxPoints = getSkiruMaxPoints(def.id);
      expCostNextByNode[def.id] = pts >= maxPoints ? null : expCostForNextSkiruPoint(pts);
    }
    for (const anchor of SOKAIJU_ANCHORS) {
      if (anchor.id === SOKAIJU_GATE_SKIRU_ID) continue;
      for (const face of ['meiju', 'shiju'] as const) {
        const key = sokaijuFaceSheetKey(anchor.id, face);
        const pts = getSkiruPoints(skiruSheet, key);
        expCostNextByNode[key] =
          pts >= SKIRU_MAX_POINTS ? null : expCostForNextSkiruPoint(pts);
      }
    }

    const derivedStats = calculateSkiruDerivedStats(skiruSheet);
    const skiruDomains = calculateSkiruDomainIndices(skiruSheet);
    const hp = resolveCombatHp(character.currentHp, Math.max(1, derivedStats.hpMax));

    return {
      skiruSheet,
      expSpendable,
      expCostNextByNode,
      derived: {
        hpMax: hp.hpMax,
        hpCurrent: hp.hpCurrent,
        mitigationPercent: derivedStats.mitigationPercent,
        movementMetersPerQuarter: derivedStats.movementMetersPerQuarter,
        cac: derivedStats.cac,
        cad: derivedStats.cad,
        dodgeIr: derivedStats.dodgeIr,
        parryIr: derivedStats.parryIr,
      },
      skiruDomains,
      activeJigaMilestone: getActiveJigaMilestone(skiruSheet),
    };
  }

  /**
   * Alza un nodo Skiru a targetPoints, scalando l'EXP necessaria.
   * - Rifiuta milestone (non si comprano con EXP)
   * - Rifiuta se EXP insufficienti (canAffordSkiruRaise)
   * - Valida la scheda risultante con validateSkiruSheet
   * - Ritorna la scheda aggiornata (stesso formato di getSkiruSheet)
   */
  async raiseSkiruNode(userId: string, skiruId: string, targetPoints: number) {
    const character = await db.query.characters.findFirst({
      where: eq(characters.userId, userId),
      columns: {
        id: true,
        strength: true,
        constitution: true,
        dexterity: true,
        mind: true,
        empathy: true,
        experienceSpendable: true,
        skiruSheet: true,
      },
    });
    if (!character) throw new Error('Personaggio non trovato');

    const isFaceKey = isSokaijuFaceSheetKey(skiruId);
    const def = isFaceKey ? undefined : getSkiruDef(skiruId);
    if (!isFaceKey && !def) throw new Error(`Skiru «${skiruId}» non trovata nel catalogo.`);
    if ((SHAKAI_KAIKYU_CLASS_SKIRU_IDS as readonly string[]).includes(skiruId)) {
      throw new Error('La classe sociale si sceglie da POST /characters/me/social-class, non dall\'albero Skiru.');
    }
    if (!isFaceKey && def?.kind === 'milestone') {
      throw new Error('Le milestone Jiga no Shihaisha non si acquistano con EXP.');
    }
    if (!isFaceKey && def?.expPurchasable === false) {
      throw new Error(`«${def.name}» non si acquista con EXP — inserimento narrativo in scheda.`);
    }

    const nodeLabel = isFaceKey
      ? (() => {
          const anchor = getSokaijuAnchorBySkiruId(skiruId.split(':')[0] ?? '')
          const face = skiruId.endsWith(':meiju') ? 'Vita' : 'Morte'
          return anchor ? `${anchor.sectionTitle} · ${face}` : skiruId
        })()
      : def!.name;

    const baseStats: BaseStats = {
      strength: character.strength,
      constitution: character.constitution,
      dexterity: character.dexterity,
      mind: character.mind,
      empathy: character.empathy,
    };

    const skiruSheet = resolveCharacterSkiruSheet(
      character.skiruSheet as Record<string, number> | undefined,
      baseStats,
    );

    const current = getSkiruPoints(skiruSheet, skiruId);
    if (targetPoints <= current) {
      throw new Error(`Il nodo «${nodeLabel}» ha già ${current} punti.`);
    }
    if (targetPoints > getSkiruMaxPoints(skiruId)) {
      throw new Error(`Massimo ${getSkiruMaxPoints(skiruId)} punti per nodo.`);
    }

    const unlockMsg = getSkiruParentUnlockMessage(skiruSheet, skiruId);
    if (unlockMsg) throw new Error(unlockMsg);

    const spendable = character.experienceSpendable ?? 0;
    if (!canAffordSkiruRaise(skiruSheet, skiruId, targetPoints, spendable)) {
      const cost = expCostToRaiseSkiru(current, targetPoints - current);
      throw new Error(
        `EXP insufficienti: occorrono ${cost ?? '?'} EXP per portare «${nodeLabel}» da ${current} a ${targetPoints} (disponibili: ${spendable}).`,
      );
    }

    const cost = expCostToRaiseSkiru(current, targetPoints - current)!;
    const newSheet: SkiruSheet = { ...skiruSheet, [skiruId]: targetPoints };

    const validation = validateSkiruSheet(newSheet);
    if (!validation.ok) throw new Error(validation.errors.join('; '));

    await db
      .update(characters)
      .set({
        skiruSheet: newSheet as Record<string, number>,
        experienceSpendable: spendable - cost,
      })
      .where(eq(characters.id, character.id));

    // Restituisce la scheda aggiornata (stesso formato di getSkiruSheet)
    return this.getSkiruSheet(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Ottiene EXP guadagnati negli ultimi 7 giorni e log premi EXP per un personaggio.
   */
  async getCharacterExpLogs(characterId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // EXP ultimi 7 giorni: somma di tutti i premi EXP ricevuti negli ultimi 7 giorni
    const recentRewards = await db.query.questRewards.findMany({
      where: and(
        eq(questRewards.characterId, characterId),
        eq(questRewards.type, 'EXP'),
        gte(questRewards.createdAt, sevenDaysAgo)
      ),
      with: {
        quest: {
          with: {
            creator: {
              columns: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
      orderBy: (rewards, { desc }) => [desc(rewards.createdAt)],
    });

    const expLast7Days = recentRewards.reduce((sum, r) => sum + (r.value ?? 0), 0);

    // Log premi EXP: tutti i premi EXP ricevuti (non solo ultimi 7 giorni)
    const allExpRewards = await db.query.questRewards.findMany({
      where: and(
        eq(questRewards.characterId, characterId),
        eq(questRewards.type, 'EXP')
      ),
      with: {
        quest: {
          with: {
            creator: {
              columns: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
      orderBy: (rewards, { desc }) => [desc(rewards.createdAt)],
    });

    return {
      expLast7Days,
      expRewards: allExpRewards.map((r) => ({
        id: r.id,
        date: r.createdAt,
        questName: r.quest.title,
        shinigamiName: r.quest.creator.surname
          ? `${r.quest.creator.name} ${r.quest.creator.surname}`
          : r.quest.creator.name,
        reward: r.value ?? 0,
      })),
    };
  }

  /**
   * Fine sessione: resetta stack meccaniche e status attivi del PG.
   * HP, CS, costrutti in campo e dichiarazioni armi NON vengono toccati.
   * Chiamato da closeGameSession per ogni partecipante.
   */
  async resetCombatStateForSession(characterId: string): Promise<void> {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { uiMetadata: true },
    });
    if (!char) return;

    // Copia tutto (roleIcon, orderIcon, themeColor, ecc.) poi azzera solo i campi combat
    const meta = { ...(char.uiMetadata ?? {}) } as DoMechanicsUiMeta & Record<string, unknown>;

    const COMBAT_MECHANICS_KEYS: (keyof DoMechanicsUiMeta)[] = [
      'itoTension', 'itoUsedThisTurn', 'naikanPhase', 'yuragiPhase', 'yuragiLastConsistency',
      'kaden', 'gosaStacks', 'lastReceivedHitTier',
      'hadoInvestimentoActive', 'hadoInvestimentoTurnsLeft', 'hadoInvestimentoPoolCs',
      'hadoInvestimentoDepositedThisTurn', 'hadoInvestimentoPayout', 'hadoDebts',
      'naikanKomei', 'naikanReadTarget', 'henseiNagori', 'itoGiurisdizione',
      'itoDecreto', 'itoMugenShihai', 'genzaiEden', 'genzaiEdenDestroyedQueue',
      'genzaiMeisaku', 'naikanSutura',
      'genericheKajibaHalfHpTriggered', 'genericheKajibaTierBonusPending',
      'genericheIaiReady', 'genericheIaiWazaLaunchesThisTurn', 'genericheIaiDamagedTargetIds',
      'genericheTurnWazaUsed', 'tokaOmocha', 'tokaGangushi', 'henseiIgyoLast',
      'komonoireWeapon', 'genericheKyoshin',
    ];

    for (const key of COMBAT_MECHANICS_KEYS) {
      delete meta[key];
    }

    // Cancella tutti i status effects del PG (stack Emorragia, Pressione, ecc.)
    await db.delete(characterStatusEffects).where(eq(characterStatusEffects.characterId, characterId));

    // Riaggiorna uiMetadata: conserva roleIcon/ammo/armi, azzera meccaniche
    await db.update(characters)
      .set({ uiMetadata: meta as typeof char.uiMetadata })
      .where(eq(characters.id, characterId));
  }
}

export const characterService = new CharacterService();