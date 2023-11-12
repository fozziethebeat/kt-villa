FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=prod
ENV RUNTIME_ENV=prod

# Magic that fixes everything
COPY .yarn .yarn
COPY .yarnrc.yml .

# Copy all the stuff
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY redwood.toml redwood.toml
COPY graphql.config.js graphql.config.js

# Install and build
RUN yarn install
COPY web web
RUN yarn rw build web

EXPOSE 8910
