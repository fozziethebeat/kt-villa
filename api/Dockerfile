FROM node:20-alpine as base

WORKDIR /app

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

# Fix a prisma bug
RUN apk add --update --no-cache openssl1.1-compat

# Install and build
RUN yarn install
COPY api api
RUN yarn rw build api

EXPOSE 8911
