# Strapi 5 project image for the FWU CMS.
#
# Debian slim, not alpine: Strapi depends on sharp, whose musl prebuilds are the
# usual source of "works locally, breaks in CI" image builds.
#
# The admin panel is compiled at BUILD time and STRAPI_ADMIN_BACKEND_URL is baked
# into that bundle, so the URL has to be passed per environment:
#   docker build --build-arg STRAPI_ADMIN_BACKEND_URL=https://cms.iac.runs.onstackit.cloud .
# The Helm chart also passes it at runtime, which only matters for code paths that
# read it dynamically.
#
# NODE_ENV is baked into the admin bundle the same way — e.g. it decides whether
# the Content-Type Builder is compiled in. A runtime env var (the chart's
# `strapi.nodeEnv`) reaches the Strapi *server* process but can't change an
# already-compiled bundle, so getting a dev-capable admin panel requires this
# build arg, not just a ConfigMap change:
#   docker build --build-arg NODE_ENV=development .

FROM node:22-slim AS build
WORKDIR /opt/app

# Dependencies first, so a source-only change does not reinstall them.
COPY package.json package-lock.json* ./
# npm ci needs a committed lockfile; fall back to install so a fresh checkout
# without one still builds (see README.md — commit the lockfile).
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ARG STRAPI_ADMIN_BACKEND_URL=""
ENV STRAPI_ADMIN_BACKEND_URL=${STRAPI_ADMIN_BACKEND_URL}
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm run build

# Identifies this build to the chart's seed-app-volume init container, which
# refreshes a persisted application directory (persistence.mode: app) only when
# this value changes. Random rather than derived from the tag, because `latest`
# and branch tags move. Cached together with the layers above, so an unchanged
# build keeps its id.
RUN cat /proc/sys/kernel/random/uuid > .image-build-id


FROM node:22-slim AS runtime
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV} \
    STRAPI_TELEMETRY_DISABLED=true \
    HOST=0.0.0.0 \
    PORT=1337
WORKDIR /opt/app

# The whole project directory including node_modules and the compiled admin
# panel. Copying wholesale rather than cherry-picking build output keeps this
# correct across Strapi's changes to where `strapi build` emits.
COPY --from=build --chown=node:node /opt/app /opt/app

# uid 1000 in the node images, which is what the chart's podSecurityContext pins.
USER node
EXPOSE 1337

# `strapi start` serves the prebuilt admin panel; it never rebuilds at runtime.
CMD ["npm", "run", "start"]
