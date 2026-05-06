FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copia el resto y genera la build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia solo lo necesario de builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Exponemos el puerto de Next.js
EXPOSE 3000

# Arranca el servidor Next.js
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
