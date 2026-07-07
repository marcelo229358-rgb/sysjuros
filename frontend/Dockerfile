# =============================================================================
# Build — compila o frontend com variáveis Vite injetadas no build
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_EMPRESA_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_EMPRESA_ID=$VITE_EMPRESA_ID

RUN npm run build

# =============================================================================
# Runtime — Nginx servindo arquivos estáticos
# =============================================================================
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null 2>&1 || exit 1
