import { eq, ne, gte, and } from 'drizzle-orm';
import { db } from '../../plugins/db'; 
import { characters, users, characterHousing, characterSkills, skills, questRewards, quests } from '../../db/schema';
// 👇 CORREZIONE: Usa l'alias definito nel tuo tsconfig (@domain)
import { calculateDerivedStats, type BaseStats } from '@domain/stats/calculator'; 

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

    // Applica il modificatore all'HP (hpMax)
    const modifiedDerived = {
      ...derived,
      hpMax: Math.max(1, derived.hpMax + hpModifier), // HP minimo 1
    };

    // Ritorniamo l'oggetto ibrido
    return {
      ...character,
      computed: modifiedDerived, // Qui trovi HP (body) con bonus/malus, Reflexes, ecc.
    };
  }

  /** Elenco personaggi (id, name, miniAvatar) per Nuova conversazione SMS. Esclude excludeCharacterId. */
  async listForSms(excludeCharacterId: string) {
    return db
      .select({ id: characters.id, name: characters.name, miniAvatar: characters.miniAvatar })
      .from(characters)
      .where(ne(characters.id, excludeCharacterId));
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
      roleIcon?: string;
      orderIcon?: string;
      themeColor?: string;
      backgroundImage?: string;
      themeMusicUrl?: string;
    } | null) ?? {};

    return {
      id: char.id,
      name: char.name,
      surname: char.surname,
      avatar: char.avatar,
      miniAvatar: char.miniAvatar,
      bio: char.bio,
      backgroundImage: meta.backgroundImage,
      themeMusicUrl: meta.themeMusicUrl,
      stats: {
        f: char.strength,
        c: char.constitution,
        d: char.dexterity,
        m: char.mind,
        e: char.empathy,
      },
      grade: char.grade,
      order: char.order,
    };
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
        costKotodama: row.skill!.costKotodama,
        level: row.level,
      }));
  }

  /**
   * Aggiorna il profilo pubblico del personaggio (avatar, miniAvatar, surname, bio, backgroundImage, themeMusicUrl).
   * backgroundImage e themeMusicUrl vengono salvati in uiMetadata.
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
    } | null) ?? {};

    const newMeta = { ...currentMeta };
    if (updates.backgroundImage !== undefined) {
      newMeta.backgroundImage = updates.backgroundImage;
    }
    if (updates.themeMusicUrl !== undefined) {
      newMeta.themeMusicUrl = updates.themeMusicUrl;
    }

    if (updates.backgroundImage !== undefined || updates.themeMusicUrl !== undefined) {
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
}

export const characterService = new CharacterService();