# ==============================
# Build Stage
# ==============================
FROM node:lts-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc

# Installera pnpm globalt
RUN npm install -g pnpm

# Kopiera bara det som behövs för install (cache-vänligt)
COPY package.json pnpm-lock.yaml* ./

# Installera beroenden
RUN pnpm install --frozen-lockfile

# Kopiera källkod (efter install för bättre cache)
COPY . .

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
