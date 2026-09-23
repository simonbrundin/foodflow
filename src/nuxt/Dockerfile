# ==============================
# Build Stage
# ==============================
# Build Nuxt on the native builder architecture. The generated Nitro output is
# JavaScript/assets, so this avoids QEMU crashes when publishing arm64 images.
FROM --platform=$BUILDPLATFORM node:lts-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc

# Pinna pnpm via corepack (måste matcha packageManager i package.json)
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate

# Kopiera bara det som behövs för att hämta beroenden (cache-vänligt)
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Hämta dependencies till pnpm store (cache-vänligt — bara lockfile ändras behöver ny hämtning)
RUN pnpm fetch

# Installera dependencies till node_modules (offline-läge efter fetch)
RUN pnpm install --offline --frozen-lockfile

# Kopiera källkod (efter install för bättre cache)
COPY . .

# Rensa eventuell gammal/cachad .nuxt med lokala sökvägar (kan finnas committad i repot)
RUN rm -rf .nuxt .output && pnpm exec nuxi prepare

# Bygg applikationen
RUN pnpm run build

# ==============================
# Runtime Stage (minimal, säker)
# ==============================
FROM node:lts-alpine AS production
WORKDIR /app

USER node

# Kopiera bara det som behövs för runtime
COPY --from=build --chown=node:node /app/.output .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", "server/index.mjs"]
