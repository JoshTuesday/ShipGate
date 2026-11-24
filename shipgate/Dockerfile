FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
COPY src ./src

FROM base AS runtime
ARG APP_VERSION=dev
ENV NODE_ENV=production APP_VERSION=$APP_VERSION PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/server.js"]
