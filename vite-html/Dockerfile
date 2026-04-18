FROM node:22-alpine AS build

WORKDIR /app/vite-html

COPY vite-html/package*.json ./
RUN npm install

COPY vite-html/index.html ./index.html
COPY vite-html/vite.config.js ./vite.config.js
COPY vite-html/src ./src
COPY vite-html/public ./public

RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app/vite-html

COPY --from=build /app/vite-html ./
COPY vite-html/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
