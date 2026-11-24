# Node Starter (Express + TypeScript)

A REST API starter with a feature-based structure (Clean Architecture inside each feature), validated env, structured logging, one error handler, and OpenAPI docs.

**Stack:** Node.js 26 (ESM) · Express 5 · TypeScript 6 · Zod · Winston · SQLite (`node:sqlite`, in memory) · Vitest · ESLint + Prettier · Scalar · Docker

> Working with an AI assistant? It should read [`AGENTS.md`](./AGENTS.md) first — the conventions and the recipe for adding a feature.

## Getting Started

Requires Node.js >= 26 (see `.nvmrc`).

```bash
npm install
cp .env.example .env   # optional — every variable has a default
npm run dev            # http://localhost:3000  ·  docs at /docs
```

## Environment Variables

Loaded from `.env` if present (`process.loadEnvFile()`), never overriding variables already set, then validated with Zod (`src/core/config/env.ts`). An invalid value stops the app with a readable error.

| Variable              | Default                 | Notes                                                     |
| --------------------- | ----------------------- | --------------------------------------------------------- |
| `PORT`                | `3000`                  |                                                           |
| `NODE_ENV`            | `development`           | `development`, `production`, or `test` (silences logs)    |
| `BASE_URL`            | `http://localhost:3000` | Shown in the startup log                                  |
| `CORS_ORIGINS`        | (empty)                 | Production only (development allows all). Comma-separated |
| `LOG_LEVEL`           | `info`                  | `error` `warn` `info` `http` `verbose` `debug`            |
| `LOG_FILE`            | `false`                 | `true` also writes daily JSON files to `logs/`            |
| `SHUTDOWN_TIMEOUT_MS` | `10000`                 | Max time for graceful shutdown                            |

## Scripts

**Run**

- `npm run dev`: run from source with `tsx --watch` (reloads on save)
- `npm start`: run the compiled build (source maps on, so stacks point at `.ts` lines)

**Build**

- `npm run build`: `clean`, compile TypeScript, rewrite path aliases (`tsc-alias`), then `copy-assets`
- `npm run clean`: remove `dist/`
- `npm run copy-assets`: copy the OpenAPI spec into `dist/` (`tsc` only emits `.js`)

**Quality**

- `npm run lint`: check with ESLint
- `npm run fix`: auto-fix ESLint issues and format with Prettier
- `npm run typecheck`: `tsc --noEmit`
- `npm test` / `npm run test:watch`: Vitest, once / in watch mode

**All at once**

- `npm run check`: lint + typecheck + test + build — run before committing (CI runs the same checks on PRs and pushes to `main`)

## API

| Method   | Path                | Success | Errors                    |
| -------- | ------------------- | ------- | ------------------------- |
| `GET`    | `/health`           | 200     | —                         |
| `GET`    | `/todos`            | 200     | —                         |
| `POST`   | `/todos`            | 201     | 409 duplicate, 422 blank  |
| `GET`    | `/todos/:id`        | 200     | 404, 422 id is not a UUID |
| `PATCH`  | `/todos/:id/toggle` | 200     | 404, 422 id is not a UUID |
| `DELETE` | `/todos/:id`        | 200     | 404, 422 id is not a UUID |

Every response is `{ "message": "...", "timestamp": "ISO-8601", "data": … }`. Todos live in an in-memory SQLite DB and reset on restart.

**Docs:** `GET /docs` (Scalar UI, can send test requests) and `GET /docs/openapi.json`. The spec lives in `src/features/docs/spec/` (`openapi.yaml` + `paths/` + `components/`); import the JSON into Postman to get a collection.

## Architecture

```text
 routes → controller ──→ service → repository (port) ←── repository.<driver>
 (validateRequest)       (rules, domain errors)          (sqlite / memory / …)
                 index.ts wires them and picks the adapter
```

- The service depends only on the repository **interface**, so swapping the DB is one new adapter file plus one line in the feature's `index.ts`, and service tests inject an in-memory repo instead of mocking.
- ESLint enforces the layers: business files can't import Express, a DB client, `@/core/http`, or `HttpStatus`.
- `src/features/todo/` is the reference feature. Full rules and the recipe: [`AGENTS.md`](./AGENTS.md).

## Logging

Winston: colored lines in development, JSON in production. `LOG_FILE=true` adds `logs/YYYY-MM-DD.log` (14 days) and `YYYY-MM-DD.error.log` (30 days). Request lines (morgan) log at `http` level — set `LOG_LEVEL=http` to see them.

## Docker

```bash
docker compose up -d --build   # http://localhost:3000
docker compose down
```

- Two-stage image: build stage compiles TS; run stage has only `dist/` + production deps and runs as the non-root `node` user.
- No `.env` needed. If one exists Compose passes it in, except `LOG_FILE`, which stays `false` (containers log to stdout).
- The image defaults to `NODE_ENV=development` for local use (open CORS, stack traces in errors).
- `healthcheck` hits `/health`, so other services can `depends_on: { api: { condition: service_healthy } }`.
- Platforms that build from a Dockerfile (e.g. Render) use it directly and ignore Compose; `PORT` comes from the environment.

> **Before deploying, set `NODE_ENV=production` and `CORS_ORIGINS`.** Otherwise any origin can call the API and clients see stack traces.

## Project Structure

```text
src/
  core/         config · database · error · http (middleware) · logger · server
  features/     docs · health · todo (reference)
  shared/       consts · types · utils
  app.ts        createApp(): middleware + routes + error handler
  main.ts       entry point: startServer
  routes.ts     mounts every feature router
```

## License

MIT
