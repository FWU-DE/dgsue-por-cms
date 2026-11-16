# fwu-strapi-cms — application

The Strapi 5 project that becomes `ghcr.io/fwu-de/dgsue-por-cms`. The Helm
chart that deploys it lives in [fwu-strapi-cms/helm-chart in dgsue-por-infrastruktur](https://github.com/FWU-DE/dgsue-por-infrastruktur/tree/main/fwu-strapi-cms/helm-chart).

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
| `src/api/` | content types — **currently empty, nothing is modelled yet** |

Every variable read here is supplied by the chart's ConfigMap and Secrets; see the
"Image contract" section of [../README.md](../README.md).

## Local development

Content types are created locally and committed — `NODE_ENV=production` in the
cluster disables the Content-Type Builder on purpose, so schema changes travel as
code and as a new image, never as a click in a deployed admin panel.

```bash
cd dgsue-por-cms
cp .env.example .env          # then edit
docker run -d --name strapi-db -e POSTGRES_USER=strapi -e POSTGRES_PASSWORD=strapi \
  -e POSTGRES_DB=strapi -p 5432:5432 postgres:16
npm install                   # commit the resulting package-lock.json
npm run develop               # http://localhost:1337/admin
```

Model your content types in the admin panel, then commit what Strapi generates
under `src/api/**` (and `src/components/**` if you use components). That is the
schema; the database only holds content.

**Commit `package-lock.json`.** Without it the image build falls back to
`npm install`, so two builds of the same commit can resolve different dependency
versions. It is not committed yet because this scaffold was written without npm
available.

## Image

```bash
docker build -t fwu-strapi-cms:dev .
docker run --rm -p 1337:1337 --env-file .env fwu-strapi-cms:dev
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
  publishes `sha-XXXXXXX`, a branch tag, and `latest` on the default branch.

## Status

Written but **never built or run** — there was no Docker or npm available in the
environment where this was scaffolded. Expect the first CI run to be the real test:
the dependency versions (Strapi 5.59.0 and its React peers) are pinned from
published release data, not from a resolved lockfile.
