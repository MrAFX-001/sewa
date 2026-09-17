# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# prisma/ must exist before npm ci ("postinstall" runs prisma generate)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# One-shot migrations (has the prisma CLI)
FROM build AS migrate
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

FROM build AS prod-deps
RUN npm prune --omit=dev --ignore-scripts

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build     /app/dist ./dist
COPY --from=build     /app/prisma ./prisma
COPY package.json ./
# Relative UPLOAD_DIR resolves to /app/uploads/id-cards, which is bind-mounted
# from /home/sewa/sewa/backend/uploads, so paths stored in the DB stay valid.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]



