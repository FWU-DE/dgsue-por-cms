# dgsue-por-cms

The Strapi 5 project that is built into the container image
`ghcr.io/fwu-de/dgsue-por-cms`. The deployment (Helm chart, configuration per
stage) is maintained separately.

Why this exists: there is no public Strapi runtime image that can boot on its own.
`strapi/strapi` and `strapi/base` are gone from Docker Hub, and the community
`naskio/strapi` image ships only the Node base entrypoint — verified by extracting
its layers — so with an empty volume it dies in seconds with
`Cannot find module 'react'`. Content types live in code, so the deployment artifact
has to be a project image.

## Layout

| Path | Purpose |
|---|---|
| `config/server.js` | host/port, `PUBLIC_URL`, `APP_KEYS`, proxy trust |
| `config/admin.js` | admin auth secret, API token salt, transfer salt, encryption key |
| `config/database.js` | PostgreSQL connection + pool, TLS handling for STACKIT Flex |
| `config/plugins.js` | upload provider: `aws-s3` (presigned URLs) or `local` |
| `config/middlewares.js` | default stack + CSP that allows the S3 host for media |
| `src/index.js` | `register`/`bootstrap` hooks (empty) |
| `src/api/` | content types (one `schema.json` per type) |

Every variable read here is supplied at runtime by the deployment (ConfigMap and
Secrets); `.env.example` lists them for local development.

## Schema workflow

Content types are code: `src/api/**` and `src/components/**` are the schema, the
database only holds content. The production image runs with `NODE_ENV=production`,
which disables the Content-Type Builder, so schema changes reach test and production
only as a new image.

The content model is created in the **development instance**, which runs the
development variant of the image (Content-Type Builder enabled):

1. Model the change in the Content-Type Builder of the development instance (take a
   database backup before deleting a type — Strapi drops its table with all entries).
2. Export `src/api` and `src/components` from that instance into this repository,
   deleting the old directories first so removed types disappear too.
3. Commit (including deletions) **before** the next deployment, push, let CI build.
4. Deploy the new `sha-XXXXXXX` tag to test, then production.

Keep git equal to the development instance: content can only be moved between
instances (`strapi export`/`import`/`transfer`) when their schemas match.

## Local development

For trying out changes locally (`npm run develop` enables the Content-Type Builder
as well):

```bash
cd dgsue-por-cms
cp .env.example .env          # then edit
docker run -d --name strapi-db -e POSTGRES_USER=strapi -e POSTGRES_PASSWORD=strapi \
  -e POSTGRES_DB=strapi -p 5432:5432 postgres:16
npm ci
npm run develop               # http://localhost:1337/admin
```

Node 22 (as in the image). `package-lock.json` is committed and the image build uses
`npm ci`; commit lockfile changes together with `package.json` changes.

## Image

```bash
docker build -t dgsue-por-cms:local .
docker run --rm -p 1337:1337 --env-file .env dgsue-por-cms:local

# development variant (admin panel compiled with NODE_ENV=development)
docker build --build-arg NODE_ENV=development -t dgsue-por-cms:local-dev .
```

Notes:

* Debian slim base, not alpine — Strapi pulls in `sharp`, whose musl builds are a
  reliable source of CI-only breakage.
* Runs as uid 1000 (`node`), matching the chart's `podSecurityContext`.
* `npm run build` compiles the admin panel at **build** time. The build arg
  `STRAPI_ADMIN_BACKEND_URL` is deliberately left empty so the panel uses its own
  origin and the image stays portable across stages; set it only if the admin has
  to call a different origin.
* CI: [.github/workflows/image.yml](.github/workflows/image.yml)
  publishes two variants per push: `sha-XXXXXXX`, a branch tag and `latest` (default
  branch), plus the development variant with the suffix `-dev` (`sha-XXXXXXX-dev`,
  `latest-dev`). The development variant is only for the development instance and is
  never promoted.

## Status

Built by CI (image `ghcr.io/fwu-de/dgsue-por-cms`, public). Strapi 5.59.0. The
content types match the development instance (last checked 2026-11-27); the
development instance runs `latest-dev`.
