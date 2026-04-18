FROM node:22-alpine AS build

WORKDIR /app/vite-html

COPY vite-html/package*.json ./
RUN npm install

COPY vite-html/index.html ./index.html
COPY vite-html/vite.config.js ./vite.config.js
COPY vite-html/src ./src
COPY vite-html/public ./public

ARG VITE_MATEZA_BASE_URL=https://api.mateza.rw
ARG VITE_MATEZA_CLIENT_KEY
ARG VITE_MATEZA_PROJECT_ID

ENV VITE_MATEZA_BASE_URL=$VITE_MATEZA_BASE_URL
ENV VITE_MATEZA_CLIENT_KEY=$VITE_MATEZA_CLIENT_KEY
ENV VITE_MATEZA_PROJECT_ID=$VITE_MATEZA_PROJECT_ID

RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app/vite-html

ARG VITE_MATEZA_BASE_URL=https://api.mateza.rw
ARG VITE_MATEZA_CLIENT_KEY
ARG VITE_MATEZA_PROJECT_ID

ENV VITE_MATEZA_BASE_URL=$VITE_MATEZA_BASE_URL
ENV VITE_MATEZA_CLIENT_KEY=$VITE_MATEZA_CLIENT_KEY
ENV VITE_MATEZA_PROJECT_ID=$VITE_MATEZA_PROJECT_ID

COPY --from=build /app/vite-html ./

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
