FROM oven/bun:1

WORKDIR /app

COPY packages ./packages
COPY schemas ./schemas
COPY apps/server ./apps/server

WORKDIR /app/apps/server
RUN bun install --production

EXPOSE 4000
CMD ["bun", "run", "src/server.ts"]
