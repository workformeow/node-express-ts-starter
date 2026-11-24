# Node Starter (Express + TypeScript)

A production-ready template for building REST APIs with Node.js, Express, and TypeScript. It ships with a feature-based structure that uses Clean Architecture inside each feature, structured logging, centralized error handling, rate limiting, and ready-to-use OpenAPI documentation.

> Building a new feature with an AI assistant? Read [`AGENTS.md`](./AGENTS.md) first — it documents the conventions and provides a step-by-step recipe for adding features consistently.

## Tech Stack

- Node.js (ESM)
- Express 5
- TypeScript 6
- Zod (environment + request validation)
- Winston + winston-daily-rotate-file (logging)
- ESLint 10 + Prettier
- Scalar API Reference (OpenAPI docs UI)
- Docker / Docker Compose

## Requirements

- Node.js >= 26 (see `.nvmrc`)
- npm >= 10
- Docker (optional)

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Create the environment file (optional — every variable has a default)

```bash
cp .env.example .env
```

3. Start the development server

```bash
npm run dev
```

The server starts at http://localhost:3000

## Environment Variables

At startup the app loads `.env` from the project root with `process.loadEnvFile()`. If there is no `.env` (e.g. on a host that injects variables itself), it logs that and uses `process.env` as is. Variables already set in the environment are never overridden by the file.

Values are validated with Zod (see `src/core/config/env.ts`). Every non-secret variable has a default; the process exits with a readable error if a value is invalid.

| Variable              | Default                 | Notes                                                                  |
| --------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `PORT`                | `3000`                  |                                                                        |
| `NODE_ENV`            | `development`           | `development`, `production`, or `test` (`test` silences all logging)   |
| `BASE_URL`            | `http://localhost:3000` | Shown in the startup log                                               |
| `CORS_ORIGINS`        | (empty)                 | Production only — development allows all origins. Comma-separated      |
| `LOG_LEVEL`           | `info`                  | `error`, `warn`, `info`, `http`, `verbose`, `debug`                    |
| `LOG_FILE`            | `false`                 | `true` also writes JSON log files to `logs/` (see [Logging](#logging)) |
| `SHUTDOWN_TIMEOUT_MS` | `10000`                 | Max time for graceful shutdown before forcing exit                     |

## Available Scripts

- `npm run dev`: run with `tsx --watch`
- `npm run build`: clean `dist`, compile TypeScript, then rewrite path aliases (`tsc-alias`)
- `npm start`: run the compiled build
- `npm run fix`: auto-fix ESLint issues and format with Prettier
- `npm run lint`: check with ESLint without changing files
- `npm run typecheck`: type-check with `tsc --noEmit`
- `npm run clean`: remove the `dist` directory
- `npm test`: run the test suite once (Vitest)
- `npm run test:watch`: run the test suite in watch mode
- `npm run check`: lint + typecheck + test + build in one go

## API Endpoints

- `GET /health`: health check (liveness probe for load balancers, orchestrators, and uptime monitors)
- `GET /docs`: API documentation page
- `/todos`: reference CRUD feature (in-memory, data resets on restart)

| Method   | Path                | Success | Errors                               |
| -------- | ------------------- | ------- | ------------------------------------ |
| `GET`    | `/todos`            | 200     | —                                    |
| `POST`   | `/todos`            | 201     | 409 duplicate title, 422 blank title |
| `GET`    | `/todos/:id`        | 200     | 404 not found, 422 id is not a UUID  |
| `PATCH`  | `/todos/:id/toggle` | 200     | 404 not found, 422 id is not a UUID  |
| `DELETE` | `/todos/:id`        | 200     | 404 not found, 422 id is not a UUID  |

The standard response envelope is:

```json
{
  "message": "...",
  "timestamp": "ISO-8601",
  "data": {}
}
```

## Architecture

Folders are split by feature (`src/features/<name>/`). Inside a feature, code is layered so business logic never depends on Express, the database, or HTTP status codes:

```text
            HTTP adapter                      business layer                 storage adapter
 routes -> controller -> ------------> service -> repository (port) <------- repository.<driver>
 (validate)  (Express)                 (rules, domain errors)                (memory / mysql / mongo / …)
                                  index.ts wires them together and picks the adapter
```

- **Business layer**: `*.entity.ts`, `*.repository.ts` (interface), `*.service.ts`. Plain TypeScript. Services throw domain errors (`NotFoundError`, `ConflictError`, …) and `core/error` maps them to HTTP status codes.
- **Adapters**: `*.controller.ts` / `*.routes.ts` / `*.schema.ts` for HTTP, `*.repository.<driver>.ts` for storage.
- **Composition root**: the feature's `index.ts` is the only place that chooses an adapter. Switching from in-memory to a real database means adding one adapter file and changing one line there.
- **Enforced by ESLint**: business-layer files can't import `express`, DB clients, `@/core/http`, or `HttpStatus` (see `eslint.config.mjs`).

Because services only depend on an interface, their tests inject an in-memory repository instead of mocking modules.

`src/features/todo/` is the reference implementation. See [`AGENTS.md`](./AGENTS.md) §2 and §6 for the full rules and the step-by-step recipe.

## API Documentation

Served by the `docs` feature (`src/features/docs/`) using [Scalar](https://github.com/scalar/scalar) as the UI, with the OpenAPI spec bundled at runtime (`@apidevtools/swagger-parser`):

- UI: `GET /docs`
- Bundled OpenAPI JSON: `GET /docs/openapi.json`
- Spec entry point: `src/features/docs/spec/openapi.yaml`
- Schemas: `src/features/docs/spec/components/models`
- Responses: `src/features/docs/spec/components/responses`
- Paths: `src/features/docs/spec/paths`

Open the docs in the browser at:

http://localhost:3000/docs

## Logging

Winston, with built-in formats only:

- **Console** — colored, human-readable lines in development; JSON in production (for the platform's log collector).
- **Files** (only when `LOG_FILE="true"`) — JSON, rotated daily in `logs/`:
  - `YYYY-MM-DD.log` — everything at or above `LOG_LEVEL`, kept 14 days
  - `YYYY-MM-DD.error.log` — errors only, kept 30 days
- **HTTP access log** — `morgan` lines go through the same logger at `http` level; set `LOG_LEVEL="http"` to see them.
- `NODE_ENV=test` silences all logging, so test runs stay quiet and create no `logs/` folder.

## Continuous Integration

`.github/workflows/ci.yml` runs on every pull request to `main` and every push to `main`: `npm ci` -> `npm run lint` -> `npm run typecheck` -> `npm test`. Run `npm run check` locally before opening a PR.

## Testing

Tests run on [Vitest](https://vitest.dev/) and live next to the code they cover as `<name>.test.ts` (e.g. `src/core/error/app-error.test.ts`), mirroring the `src/` layout — no separate `test/` folder.

- Service tests inject a fresh in-memory repository per test, with no `vi.mock` (see `src/features/todo/todo.service.test.ts`).
- HTTP tests use supertest against an isolated app per test (see `src/features/todo/todo.controller.test.ts`).

```bash
npm test          # run once
npm run test:watch  # watch mode
```

## Docker

The app service is behind the `prod` Compose profile, so a plain `docker compose up` won't start it. That leaves room to add dev-only services (database, mail catcher, …) that start without the app. Run it with:

```bash
docker compose --profile prod up -d --build
```

Stop the container:

```bash
docker compose --profile prod down
```

The image is a two-stage build on `node:<version>-slim` (Debian/glibc, so native modules install without compiling):

- **Build stage** installs all dependencies and compiles TypeScript, so the running container never needs extra memory for `tsc` (useful on small/free plans).
- **Runtime stage** contains only `dist/` and production dependencies, runs as the non-root `node` user, and starts with `node dist/main.js` directly (not `npm start`), so `SIGTERM` from `docker stop` or a redeploy reaches the app and graceful shutdown runs.

`NODE_ENV=production` is the default. Create `.env.prod` first (copy `.env.example`) — `docker-compose.yml` loads it via `env_file`. It is never copied into the image; on a host like Render, set the variables in the dashboard instead (and point its health check at `/health`).

The service has a `healthcheck` that calls `GET /health` every 30s, so `docker ps` shows `(healthy)` / `(unhealthy)` and other services can wait on it with `depends_on: { nodejs: { condition: service_healthy } }`. Plain Compose only reports the status; it does **not** restart an unhealthy container (Swarm, Kubernetes, or a helper like autoheal does). If you change `PORT` in `.env.prod`, update the URL in the healthcheck too.

## Project Structure

```text
.
|- .github/workflows/ci.yml  # CI on PRs + pushes to main: lint, typecheck, test
|- src/
|  |- core/                   # App infrastructure (not feature-specific)
|  |  |- config/              # env.ts (load .env + Zod validation) + runtime options (cors/helmet/rate-limit)
|  |  |- error/               # AppError + domain errors
|  |  |- http/                # Express middleware (validateRequest, requestLogger, errorHandler)
|  |  |- logger/              # Winston logger setup
|  |  \- server/              # Server bootstrap + graceful shutdown (onShutdown hooks)
|  |- features/               # Feature modules (one folder per feature)
|  |  |- docs/                # OpenAPI spec + Scalar API reference UI
|  |  |- health/              # Health check (liveness probe)
|  |  \- todo/                # Reference feature: entity, repository port + memory adapter, service, schema, controller, routes
|  |- shared/                 # Cross-cutting building blocks
|  |  |- consts/              # HttpStatus, log levels, messages (SUCCESS/ERRORS/LOG)
|  |  |- types/               # Shared types
|  |  \- utils/               # Helpers (createResponse)
|  |- app.ts                  # createApp(): global middleware + routes + error handler
|  |- main.ts                 # App entry point (startServer + onShutdown registrations)
|  \- routes.ts               # Root router (mounts every feature router)
|- docker-compose.yml
|- Dockerfile
|- eslint.config.mjs
|- package.json
\- tsconfig.json
```

## Contributing / Adding Features

This project follows a strict, consistent structure. Before adding or changing a feature, read [`AGENTS.md`](./AGENTS.md) for the conventions and the feature-creation recipe (based on `src/features/todo/`). Always run `npm run fix`, `npm run typecheck`, and `npm test` before committing (CI runs the same checks).

## License

MIT
