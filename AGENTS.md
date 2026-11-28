# AGENTS.md

Rules for AI assistants (and humans) working in this repo. The code is the source of truth: this file states the rules and the _why_ the code can't show, and points at real files for examples. If the two disagree, fix this file in the same change.

## 1. Project

REST API starter: **Node.js 26 (ESM) + Express 5 + TypeScript 6**, Zod (env + request validation), Winston (logging). Feature folders, each layered Clean Architecture style. `src/features/todo/` is the reference feature — copy its shape.

- **Ships:** an in-memory SQLite DB via Node's built-in `node:sqlite` (`core/database`), so `todo` has a real SQL adapter to copy. Data resets on restart; `CREATE TABLE IF NOT EXISTS` is fine for `:memory:`, a persistent DB needs migrations.
- **Doesn't ship (add only when a real feature needs it):** a production DB/ORM, auth, i18n message keys. `AppError`/`createResponse` take plain strings.

## 2. Layout

```
src/
  core/        # app-wide infrastructure, knows no feature
    config/    #   env.ts (load .env + Zod), options.ts (cors/helmet/rate-limit)
    database/  #   node:sqlite connection, closed on shutdown
    error/     #   AppError + domain errors (no Express — services import these)
    http/      #   Express middleware: validateRequest, requestLogger, notFoundHandler, errorHandler
    logger/    #   Winston (no Express)
    server/    #   startServer + graceful shutdown (onShutdown)
  features/    # one folder per feature
  shared/      # pure building blocks: consts, types, utils (no imports from core/features)
  app.ts       # createApp(): middleware + routes + errorHandler (no listen — tests import it)
  main.ts      # startServer(createApp(), env.PORT)
  routes.ts    # mounts every feature router
```

Imports flow one way: `features → core → shared`. Features never import each other's internals (only `@/features/<name>`).

### Inside a feature

| File                        | Role                                                       | Must NOT import                          |
| --------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `todo.entity.ts`            | domain types (`Todo`, `NewTodo`, `TodoChanges`)            | Express, DB, `@/core/http`, `HttpStatus` |
| `todo.repository.ts`        | **port**: interface the service needs from storage         | same                                     |
| `todo.service.ts`           | business rules, throws domain errors                       | same                                     |
| `todo.repository.sqlite.ts` | **adapter** used by the app (SQL lives only here)          | Express                                  |
| `todo.repository.memory.ts` | adapter for service tests (a `Map`)                        | Express                                  |
| `todo.schema.ts`            | Zod schemas grouped per route by `params`/`query`/`body`   | DB                                       |
| `todo.controller.ts`        | Express handlers                                           | DB                                       |
| `todo.routes.ts`            | router: `validateRequest(...)` then the handler            | DB                                       |
| `index.ts`                  | composition root: picks the adapter, wires, exports router | —                                        |
| `todo.e2e.test.ts`          | one journey through the real `createApp()`                 | —                                        |

The "Must NOT import" column is lint-enforced: one `restrictImports(files, ...bans)` line per layer in `eslint.config.mjs`. Don't `eslint-disable` it; move the code. `NO_DB` lists only what the starter uses — add your driver/ORM there when a project adopts one.

- **Ports** speak domain types only and never throw for "not found": reads/updates return `null`, `remove` returns `false`. The adapter translates the driver's signal (`undefined` row, `changes === 0`, …); only the **service** decides it's a `NotFoundError`.
- **Adapters** map rows to entities (e.g. SQLite `done` 0/1 → boolean, text → `Date`) and keep the row type private. Bind values with `?`, never interpolate SQL.
- **Factories, not classes.** `create<Feature><Role>(deps)` returns `<feature><Role>`: `createTodoService({ todoRepo })` → `todoService`. Called only in `index.ts` and tests. Methods are single verbs (`list`, `getById`, `create`, `toggle`, `remove`); use `remove`, since `delete` is a reserved word.
- A feature with no rules or storage (`health`) is just routes + a plain-function controller.

## 3. Conventions

**Imports** — ESM. `./x` only within the same folder; anything else uses the `@/` alias (`import/no-relative-parent-imports`). Order and `import type` are enforced and auto-fixed by `npm run fix`.

**Formatting** — Prettier: 2 spaces, single quotes, no semicolons, width 100, LF.

**TypeScript**

- `strict`; no `any` (use `unknown` + narrowing); unused params start with `_`; every Promise awaited or `void`-ed on purpose.
- Return types: omit for `void`/`Promise<void>` (handlers, middleware). Write them on functions returning data others rely on (services, ports, adapters) so a missed `null` check fails where it happens.
- `async` only when the body `await`s. Single-line guard clauses may skip braces (`if (!x) return`).
- `null` = "deliberately absent" in our own returns (`Todo | null`). `undefined` = optional params/props and values from runtime APIs. Don't swap them in logs or responses: `JSON.stringify` drops `undefined` but prints `null`.

**Env** (`core/config/env.ts`) — one Zod schema is the source of truth (`Env = z.infer`). Give a var a `.default()` only if that value is safe in every environment; secrets and `NODE_ENV` stay required, so a missing one exits with code 1 (locally: `cp .env.example .env`). Numbers: `z.coerce.number()` with bounds; booleans: `z.stringbool()`. New var → schema + `.env.example` (+ `requiredTestEnv` if required, §6). Never read `process.env` outside `core/config`. Loaded with Node's `process.loadEnvFile()` (no dotenv); a missing `.env` only logs, since platforms inject env themselves, while an invalid one exits with code 1.

**Logging** — use `logger` from `@/core/logger` (plain Winston): `logger.info(message, meta)`, or `logger.log(level, …)` for a runtime level. `meta` is a flat object (`{ id }`), no secrets. Write log text inline at the call. `console.*` only in `env.ts` (runs before the logger). Behavior comes from env: `LOG_LEVEL`, `LOG_FILE` (daily JSON files), `NODE_ENV=test` (silent).

**Messages** — client-facing text comes from `SUCCESS`/`ERRORS` (`@/shared/consts`, flat: `UPPER_CASE` fixed text, `camelCase` builders) or a feature's `<FEATURE>_MESSAGE` in `<feature>.const.ts`. Never inline in responses.

**HTTP status** — `HttpStatus` enum, never magic numbers, and never in the business layer.

**File names** — kebab-case + role suffix (table in §2). `<feature>.type.ts` holds shapes that aren't entities (e.g. a `LoginData` response). Middleware in `core/http/` has no `.middleware` suffix.

## 4. Errors and responses

Every success response: `createResponse(message, data?)` → `{ message, timestamp, data? }`. Controllers go `data` → `response` → `res.status(...).json(response)`, one step per line, with `data` typed (`Todo`, `Todo[]`, or `<Feature><Action>Data`). Strip secrets before assigning `data`.

All errors live in `core/error/app-error.ts`: `new AppError(message, status = 500, metadata?, { cause }?)`.

| Throw in the **service**                | When                            | Status |
| --------------------------------------- | ------------------------------- | ------ |
| `NotFoundError(resource, metadata?)`    | referenced record doesn't exist | 404    |
| `ConflictError(message, metadata?)`     | duplicate / state conflict      | 409    |
| `UnauthorizedError(message, metadata?)` | bad credentials / token         | 401    |
| `BusinessRuleError(message, metadata?)` | well-formed input breaks a rule | 422    |

Need another? Add a subclass in `app-error.ts` (no `http-errors`: domain errors keep HTTP status out of services). Outside the business layer, `throw new AppError(msg, HttpStatus.X, metadata)` directly.

**Just throw.** Express 5 forwards sync throws and rejected promises, so no `try/catch`/`next(err)` in controllers or middleware. Use `try/catch` only to _do_ something with an error (e.g. rethrow with `{ cause }`).

`errorHandler` (`core/http/error-handler.ts`, last in `app.ts`) is the single place that:

1. **Normalizes** to `AppError`: passes `AppError` through, malformed JSON → 400, anything else → 500 with a generic message (raw driver messages never reach clients).
2. **Logs** `warn` (< 500) or `error` (≥ 500) with the original message, `metadata`, `status`, `method`, `url`, `stack`.
3. **Responds**; development adds `{ name, metadata, stack }` as `data`.

It must keep 4 params (`error, req, res, _next`) — Express spots error middleware by arity. Just before it, `notFoundHandler` throws a 404 for any unmatched path or method, so unknown routes get the same JSON shape instead of Express's default HTML.

**Validation** — routes run `validateRequest(<feature>Schema.<action>)` first; it parses and replaces `params`/`query`/`body`, or throws a 422 with `metadata.source`. Only request input becomes 422; a `ZodError` elsewhere is a server bug (500). Controllers type `req` with the schema's `z.infer` types.

## 5. Adding a feature

Copy `src/features/todo/` and rename, working inside out:

1. `entity` → 2. `repository` (port) → 3. `service` → 4. `repository.<driver>` (adapter) → 5. `schema` → 6. `controller` + `routes` → 7. `index.ts` (wire, export the router) → 8. mount in `src/routes.ts`.

Then: messages in `SUCCESS`/`ERRORS` or `<feature>.const.ts`; connections register cleanup with `onShutdown` where they're created. After manual testing (Postman or `/docs`), add `<feature>.e2e.test.ts` (§6) and the OpenAPI path under `src/features/docs/spec/paths/<feature>/` and reference it from `openapi.yaml` (`npm run build` copies `spec/` into `dist/`).

## 6. Testing (Vitest)

- **Write tests only when the developer asks.** A feature "looking done" is not a request.
- `<name>.test.ts` next to the file. One `describe` per export (e2e: per feature API, e.g. `'todos API'`), one `it` per behavior, named by outcome.
- **Services:** no mocks — inject a fresh memory repo per test (`createTodoService({ todoRepo: createMemoryTodoRepository(seed) })`). See `todo.service.test.ts`.
- **Adapters:** test against the real driver, a fresh one per test (`new DatabaseSync(':memory:')`), covering row mapping and the port's `null`/`false` signals. See `todo.repository.sqlite.test.ts`.
- **HTTP:** build an isolated app per test (`express()` + `express.json()` + router on a fresh repo + `errorHandler`). See `buildApp` in `todo.controller.test.ts`.
- **E2E:** `<feature>.e2e.test.ts` runs one main journey (create → … → delete) through the real `createApp()`, so it catches what isolated tests can't: a router not mounted, wrong adapter wiring, middleware order. `app.test.ts` covers app-level wiring only (`/health`, malformed JSON → 400). Keep e2e to the happy path; edge cases belong in controller tests.
- Assert against constants (`SUCCESS.OK`), not copied strings. Cast `res.body` once to `AppResponse<T>`. Avoid `expect.any(...)` (trips `no-unsafe-assignment`).
- Mocks: keep `vi.fn()` in typed local variables; type `next` as `vi.fn<(err?: unknown) => void>()`, not `NextFunction`. For values computed from `env` at import time, use `vi.resetModules()` + `vi.doMock('@/core/config', …)` + dynamic `import()`.
- **Required env vars** (no `.default()`, e.g. secrets): add a fake, low-entropy value to `requiredTestEnv` in `core/config/env.fixture.ts`, the only place. `vitest.config.ts` loads it into `process.env` (so any test importing `env` doesn't `exit(1)`), `env.test.ts` spreads it into every schema case (those parse plain objects), and `names every missing required variable` fails if the fixture and schema disagree. Import the fixture by file path, never through `@/core/config`: the barrel runs `env.ts`, which exits before Vitest has set `test.env`.
- `NODE_ENV=test` keeps the logger silent. To assert on logs, create `vi.spyOn(logger, 'log')` inside the `it` and call `vi.restoreAllMocks()` in `afterEach` (a spy made outside the `it` stops recording after the first restore). See `error-handler.test.ts`.

## 7. Done, commits, git

- **Done** = implemented → manually tested → tests + OpenAPI doc → `npm run fix` and `npm run check` (lint + typecheck + test + build) pass → router mounted. CI runs lint, typecheck, and tests on every PR/push to `main`.
- **Commits:** Conventional Commits, imperative English title ≤ 72 chars (`<type>(<scope>): <summary>`; types `feat` `fix` `refactor` `test` `chore` `docs`), bullet body explaining _why_. One logical change per commit. Never commit `.env` or secrets.
- **Git:** don't `git commit` or `git push` unless asked; otherwise suggest a message.
