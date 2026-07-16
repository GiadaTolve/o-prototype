import { db } from "../../db";
import { forumSections, forumBoards, forumTopics, forumPosts, forumPostLikes, characters } from "../../db/schema";
import { eq, desc, asc, and, sql, count } from "drizzle-orm";

export const forumService = {
  /**
   * Ottiene tutte le sezioni del forum con le loro bacheche e statistiche.
   */
  async getAllSections() {
    const sections = await db.query.forumSections.findMany({
      orderBy: [asc(forumSections.order), asc(forumSections.createdAt)],
      with: {
        boards: {
          orderBy: [asc(forumBoards.order), asc(forumBoards.createdAt)],
        },
      },
    });

    // Per ogni bacheca, calcola statistiche (topic count, last post)
    const sectionsWithStats = await Promise.all(
      sections.map(async (section) => {
        const boardsWithStats = await Promise.all(
          section.boards.map(async (board) => {
            // Conta topic
            const topicCountResult = await db
              .select({ count: count() })
              .from(forumTopics)
              .where(eq(forumTopics.boardId, board.id));
            const topicCount = topicCountResult[0]?.count ?? 0;

            // Trova ultimo post (query manuale per evitare problemi con Drizzle)
            const lastPostQuery = await db
              .select({
                id: forumPosts.id,
                createdAt: forumPosts.createdAt,
                authorName: sql<string>`characters.name`,
                authorSurname: sql<string | null>`characters.surname`,
              })
              .from(forumPosts)
              .innerJoin(forumTopics, eq(forumPosts.topicId, forumTopics.id))
              .innerJoin(characters, eq(forumPosts.characterId, characters.id))
              .where(eq(forumTopics.boardId, board.id))
              .orderBy(desc(forumPosts.createdAt))
              .limit(1);
            
            const lastPost = lastPostQuery[0] || null;

            // Se non c'è ultimo post, cerca l'ultimo topic
            let lastPostTimestamp = null;
            let lastPostAuthor = null;
            if (lastPost) {
              lastPostTimestamp = lastPost.createdAt;
              lastPostAuthor = `${lastPost.authorName}${lastPost.authorSurname ? ` ${lastPost.authorSurname}` : ""}`;
            } else {
              const lastTopicQuery = await db
                .select({
                  createdAt: forumTopics.createdAt,
                  authorName: sql<string>`characters.name`,
                  authorSurname: sql<string | null>`characters.surname`,
                })
                .from(forumTopics)
                .innerJoin(characters, eq(forumTopics.characterId, characters.id))
                .where(eq(forumTopics.boardId, board.id))
                .orderBy(desc(forumTopics.createdAt))
                .limit(1);
              
              const lastTopic = lastTopicQuery[0] || null;
              if (lastTopic) {
                lastPostTimestamp = lastTopic.createdAt;
                lastPostAuthor = `${lastTopic.authorName}${lastTopic.authorSurname ? ` ${lastTopic.authorSurname}` : ""}`;
              }
            }

            return {
              ...board,
              topicCount,
              lastPostTimestamp,
              lastPostAuthor,
            };
          })
        );

        return {
          ...section,
          bacheche: boardsWithStats,
        };
      })
    );

    return sectionsWithStats;
  },

  /**
   * Ottiene una bacheca con i suoi topic.
   */
  async getBoardById(boardId: string, characterId?: string) {
    const board = await db.query.forumBoards.findFirst({
      where: eq(forumBoards.id, boardId),
      with: {
        section: true,
      },
    });

    if (!board) return null;

    // Carica topic con statistiche
    const topics = await db.query.forumTopics.findMany({
      where: eq(forumTopics.boardId, boardId),
      orderBy: [desc(forumTopics.isPinned), desc(forumTopics.updatedAt)],
      with: {
        author: {
          columns: { name: true, surname: true, miniAvatar: true },
        },
        posts: {
          orderBy: [asc(forumPosts.createdAt)],
          limit: 1,
          with: {
            author: {
              columns: { name: true, surname: true },
            },
          },
        },
      },
    });

    // Per ogni topic, calcola numero post e ultimo post
    const topicsWithStats = await Promise.all(
      topics.map(async (topic) => {
        const postCountResult = await db
          .select({ count: count() })
          .from(forumPosts)
          .where(eq(forumPosts.topicId, topic.id));
        const postCount = postCountResult[0]?.count ?? 0;

        const lastPost = await db.query.forumPosts.findFirst({
          where: eq(forumPosts.topicId, topic.id),
          orderBy: [desc(forumPosts.createdAt)],
          with: {
            author: {
              columns: { name: true, surname: true },
            },
          },
        });

        // Verifica se ci sono nuovi post (per characterId)
        let hasNewPosts = false;
        if (characterId && lastPost) {
          // TODO: Implementare logica "mark as read" se necessario
          // Per ora assumiamo sempre false
        }

        return {
          ...topic,
          postCount,
          lastPostTimestamp: lastPost?.createdAt ?? topic.createdAt,
          lastPostAuthor: lastPost
            ? `${lastPost.author.name}${lastPost.author.surname ? ` ${lastPost.author.surname}` : ""}`
            : `${topic.author.name}${topic.author.surname ? ` ${topic.author.surname}` : ""}`,
          hasNewPosts,
        };
      })
    );

    return {
      ...board,
      topics: topicsWithStats,
    };
  },

  /**
   * Ottiene un topic con tutti i suoi post.
   */
  async getTopicById(topicId: string, characterId?: string) {
    const topic = await db.query.forumTopics.findFirst({
      where: eq(forumTopics.id, topicId),
      with: {
        board: {
          columns: { id: true, name: true },
        },
        author: {
          columns: { id: true, name: true, surname: true, miniAvatar: true, uiMetadata: true, order: true },
        },
        posts: {
          orderBy: [asc(forumPosts.createdAt)],
          with: {
            author: {
              columns: { id: true, name: true, surname: true, miniAvatar: true, uiMetadata: true, order: true },
            },
            likes: characterId
              ? {
                  where: eq(forumPostLikes.characterId, characterId),
                }
              : undefined,
          },
        },
      },
    });

    if (!topic) return null;

    // Per ogni post, calcola like count e verifica se l'utente ha già messo like
    const postsWithLikes = await Promise.all(
      topic.posts.map(async (post) => {
        const likeCountResult = await db
          .select({ count: count() })
          .from(forumPostLikes)
          .where(eq(forumPostLikes.postId, post.id));
        const likeCount = likeCountResult[0]?.count ?? 0;

        let userHasLiked = false;
        if (characterId) {
          const userLike = await db.query.forumPostLikes.findFirst({
            where: and(eq(forumPostLikes.postId, post.id), eq(forumPostLikes.characterId, characterId)),
          });
          userHasLiked = !!userLike;
        }

        return {
          ...post,
          likeCount,
          userHasLiked,
        };
      })
    );

    return {
      ...topic,
      posts: postsWithLikes,
    };
  },

  /**
   * Crea un nuovo topic.
   */
  async createTopic(data: { boardId: string; characterId: string; title: string; content: string }) {
    const [topic] = await db
      .insert(forumTopics)
      .values({
        boardId: data.boardId,
        characterId: data.characterId,
        title: data.title,
      })
      .returning();

    // Crea il primo post (il messaggio iniziale del topic)
    const [firstPost] = await db
      .insert(forumPosts)
      .values({
        topicId: topic.id,
        characterId: data.characterId,
        content: data.content,
      })
      .returning();

    // Aggiorna updatedAt del topic
    await db
      .update(forumTopics)
      .set({ updatedAt: new Date() })
      .where(eq(forumTopics.id, topic.id));

    return topic;
  },

  /**
   * Crea un nuovo post in un topic.
   */
  async createPost(data: { topicId: string; characterId: string; content: string }) {
    const [post] = await db
      .insert(forumPosts)
      .values({
        topicId: data.topicId,
        characterId: data.characterId,
        content: data.content,
      })
      .returning();

    // Aggiorna updatedAt del topic
    await db
      .update(forumTopics)
      .set({ updatedAt: new Date() })
      .where(eq(forumTopics.id, data.topicId));

    return post;
  },

  /**
   * Toggle like su un post.
   */
  async togglePostLike(postId: string, characterId: string) {
    const existingLike = await db.query.forumPostLikes.findFirst({
      where: and(eq(forumPostLikes.postId, postId), eq(forumPostLikes.characterId, characterId)),
    });

    if (existingLike) {
      // Rimuovi like
      await db.delete(forumPostLikes).where(eq(forumPostLikes.id, existingLike.id));
      return { liked: false };
    } else {
      // Aggiungi like
      await db.insert(forumPostLikes).values({
        postId,
        characterId,
      });
      return { liked: true };
    }
  },

  /**
   * Aggiorna pin status di un topic.
   */
  async updateTopicPin(topicId: string, isPinned: boolean) {
    const [updated] = await db
      .update(forumTopics)
      .set({ isPinned })
      .where(eq(forumTopics.id, topicId))
      .returning();
    return updated;
  },

  /**
   * Aggiorna lock status di un topic.
   */
  async updateTopicLock(topicId: string, isLocked: boolean) {
    const [updated] = await db
      .update(forumTopics)
      .set({ isLocked })
      .where(eq(forumTopics.id, topicId))
      .returning();
    return updated;
  },

  /**
   * Elimina un topic.
   */
  async deleteTopic(topicId: string) {
    await db.delete(forumTopics).where(eq(forumTopics.id, topicId));
  },

  /**
   * Modifica il contenuto di un post.
   */
  async updatePost(postId: string, content: string) {
    const [updated] = await db
      .update(forumPosts)
      .set({ content, updatedAt: new Date() })
      .where(eq(forumPosts.id, postId))
      .returning();
    return updated;
  },

  /**
   * Elimina un post.
   */
  async deletePost(postId: string) {
    await db.delete(forumPosts).where(eq(forumPosts.id, postId));
  },

  /**
   * Ottiene gli ultimi topic di una bacheca (per News Visor).
   */
  async getLatestTopics(boardId: string, limit: number = 5) {
    const topics = await db.query.forumTopics.findMany({
      where: eq(forumTopics.boardId, boardId),
      orderBy: [desc(forumTopics.createdAt)],
      limit,
      with: {
        author: {
          columns: { name: true },
        },
      },
    });

    // Per ogni topic, ottieni il primo post (contenuto)
    const topicsWithContent = await Promise.all(
      topics.map(async (topic) => {
        // Usa una query esplicita per essere sicuri
        const firstPostResult = await db
          .select({ content: forumPosts.content })
          .from(forumPosts)
          .where(eq(forumPosts.topicId, topic.id))
          .orderBy(asc(forumPosts.createdAt))
          .limit(1);

        const firstPost = firstPostResult[0];

        return {
          id: topic.id,
          titolo: topic.title,
          timestamp_creazione: topic.createdAt,
          contenuto: firstPost?.content || "", // Contenuto del primo post
        };
      })
    );

    return topicsWithContent;
  },

  /**
   * Crea una nuova sezione del forum.
   */
  async createSection(data: { name: string; description?: string; order?: number }) {
    const [section] = await db
      .insert(forumSections)
      .values({
        name: data.name,
        description: data.description,
        order: data.order ?? 0,
      })
      .returning();
    return section;
  },

  /**
   * Aggiorna una sezione del forum.
   */
  async updateSection(sectionId: string, data: { name?: string; description?: string; order?: number }) {
    const [updated] = await db
      .update(forumSections)
      .set(data)
      .where(eq(forumSections.id, sectionId))
      .returning();
    return updated;
  },

  /**
   * Elimina una sezione del forum (cascade elimina anche le bacheche).
   */
  async deleteSection(sectionId: string) {
    await db.delete(forumSections).where(eq(forumSections.id, sectionId));
  },

  /**
   * Crea una nuova bacheca.
   */
  async createBoard(data: { sectionId: string; name: string; description?: string; order?: number }) {
    const [board] = await db
      .insert(forumBoards)
      .values({
        sectionId: data.sectionId,
        name: data.name,
        description: data.description,
        order: data.order ?? 0,
      })
      .returning();
    return board;
  },

  /**
   * Aggiorna una bacheca.
   */
  async updateBoard(boardId: string, data: { name?: string; description?: string; order?: number; sectionId?: string }) {
    const [updated] = await db
      .update(forumBoards)
      .set(data)
      .where(eq(forumBoards.id, boardId))
      .returning();
    return updated;
  },

  /**
   * Elimina una bacheca (cascade elimina anche i topic).
   */
  async deleteBoard(boardId: string) {
    await db.delete(forumBoards).where(eq(forumBoards.id, boardId));
  },
};
