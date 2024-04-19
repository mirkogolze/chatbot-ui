# ---- Base Node ----
FROM node:lts-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# ---- Production ----
FROM base AS production

USER node
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/next.config.js ./
COPY --from=build --chown=node:node /app/.env.local ./


ENV NODE_ENV=production

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
