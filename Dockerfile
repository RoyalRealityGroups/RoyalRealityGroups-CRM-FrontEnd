ARG NODE_VERSION=24.16.0
FROM node:${NODE_VERSION}-alpine AS builder

ARG VITE_API_BASE_URL
ARG VITE_API_TIMEOUT
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_ENV

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_TIMEOUT=${VITE_API_TIMEOUT:-30000}
ENV VITE_APP_NAME="${VITE_APP_NAME:-RRG Application}"
ENV VITE_APP_VERSION=${VITE_APP_VERSION:-1.0.0}
ENV VITE_ENV=${VITE_ENV:-production}

WORKDIR /app

COPY . .

RUN yarn install
RUN yarn build

FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY --from=builder /app/default.conf /etc/nginx/conf.d
COPY --from=builder /app/dist /usr/share/nginx/html

ENTRYPOINT ["nginx", "-g", "daemon off;"]
