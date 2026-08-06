# ── Build stage ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# ── Dépendances en premier – cache invalide seulement si package*.json change
COPY package*.json ./
RUN npm ci --prefer-offline

# ── Code source en dernier
COPY . .
RUN npm run build

# ── Serve stage ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
