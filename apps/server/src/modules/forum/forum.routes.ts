import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { forumService } from "./forum.service";

export const forumRoutes = new Elysia({ prefix: "/forum" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      /**
       * GET /forum
       * Ottiene tutte le sezioni del forum con bacheche e statistiche.
       */
      .get("/", async () => {
        const sections = await forumService.getAllSections();
        return sections;
      })

      /**
       * GET /forum/bacheca/:id
       * Ottiene una bacheca con i suoi topic.
       */
      .get("/bacheca/:id", async ({ params, user }) => {
        const characterId = user?.characterId;
        const board = await forumService.getBoardById(params.id, characterId);
        if (!board) {
          return { error: "Bacheca non trovata" };
        }
        return board;
      })

      /**
       * GET /forum/bacheca/:id/topics
       * Alias per ottenere i topic di una bacheca.
       */
      .get("/bacheca/:id/topics", async ({ params, user }) => {
        const characterId = user?.characterId;
        const board = await forumService.getBoardById(params.id, characterId);
        if (!board) {
          return { error: "Bacheca non trovata" };
        }
        return { bacheca: board, topics: board.topics };
      })

      /**
       * GET /forum/bacheca/:id/latest-topics
       * Ottiene gli ultimi topic di una bacheca (per News Visor).
       */
      .get("/bacheca/:id/latest-topics", async ({ params, query }) => {
        const limit = query.limit ? Number(query.limit) : 5;
        const topics = await forumService.getLatestTopics(params.id, limit);
        return topics;
      })

      /**
       * GET /forum/topic/:id
       * Ottiene un topic con tutti i suoi post.
       */
      .get("/topic/:id", async ({ params, user }) => {
        const characterId = user?.characterId;
        const topic = await forumService.getTopicById(params.id, characterId);
        if (!topic) {
          return { error: "Topic non trovato" };
        }
        return topic;
      })

      /**
       * POST /forum/topics
       * Crea un nuovo topic.
       */
      .post(
        "/topics",
        async ({ body, user, set }) => {
          if (!user?.characterId) {
            set.status = 401;
            return { error: "Non autenticato" };
          }
          try {
            const boardId = body.bacheca_id || body.boardId;
            const title = body.titolo || body.title;
            const content = body.testo || body.content;
            if (!boardId || !title || !content) {
              set.status = 400;
              return { error: "boardId, title e content sono obbligatori" };
            }
            const topic = await forumService.createTopic({
              boardId,
              characterId: user.characterId,
              title,
              content,
            });
            return topic;
          } catch (e: unknown) {
            set.status = 400;
            return { error: e instanceof Error ? e.message : "Errore durante la creazione del topic" };
          }
        },
        {
          body: t.Object({
            bacheca_id: t.Optional(t.String()),
            boardId: t.Optional(t.String()),
            titolo: t.Optional(t.String()),
            title: t.Optional(t.String()),
            testo: t.Optional(t.String()),
            content: t.Optional(t.String()),
          }),
        }
      )

      /**
       * POST /forum/posts
       * Crea un nuovo post in un topic.
       */
      .post(
        "/posts",
        async ({ body, user, set }) => {
          if (!user?.characterId) {
            set.status = 401;
            return { error: "Non autenticato" };
          }
          try {
            const topicId = body.topic_id || body.topicId;
            const content = body.testo || body.content;
            if (!topicId || !content) {
              set.status = 400;
              return { error: "topicId e content sono obbligatori" };
            }
            const post = await forumService.createPost({
              topicId,
              characterId: user.characterId,
              content,
            });
            return post;
          } catch (e: unknown) {
            set.status = 400;
            return { error: e instanceof Error ? e.message : "Errore durante la creazione del post" };
          }
        },
        {
          body: t.Object({
            topic_id: t.Optional(t.String()),
            topicId: t.Optional(t.String()),
            testo: t.Optional(t.String()),
            content: t.Optional(t.String()),
          }),
        }
      )

      /**
       * POST /forum/posts/:id/like
       * Toggle like su un post.
       */
      .post("/posts/:id/like", async ({ params, user, set }) => {
        if (!user?.characterId) {
          set.status = 401;
          return { error: "Non autenticato" };
        }
        try {
          const result = await forumService.togglePostLike(params.id, user.characterId);
          return result;
        } catch (e: unknown) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore durante il toggle like" };
        }
      })

      /**
       * POST /forum/topics/:id/mark-as-read
       * Marca un topic come letto (placeholder per future implementazioni).
       */
      .post("/topics/:id/mark-as-read", async ({ params, user }) => {
        // TODO: Implementare logica "mark as read" se necessario
        return { success: true };
      })

      /**
       * POST /forum/mark-all-as-read
       * Marca tutte le bacheche come lette (placeholder).
       */
      .post("/mark-all-as-read", async () => {
        // TODO: Implementare logica "mark all as read" se necessario
        return { success: true };
      })
  );
