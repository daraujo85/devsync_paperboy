FROM node:20-alpine
WORKDIR /app
RUN apk -U add openssl
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* .npmrc* ./ 
RUN npm ci || npm install
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
ENV PORT=3010
EXPOSE 3010
CMD sh -c "npx prisma migrate deploy && node dist/server.js"