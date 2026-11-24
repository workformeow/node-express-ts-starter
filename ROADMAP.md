# Refactor Roadmap

## ⚠️ กติกาสำคัญที่สุด: โหมดสอน (Teaching mode)

Refactor รอบนี้มีเป้าหมายเพื่อ **เรียนรู้** ไม่ใช่แก้ให้เสร็จเร็ว

- AI **ห้ามแก้ code เอง** ถ้าไม่ได้สั่งชัดเจน (เช่น "แก้เลย", "เขียนให้")
- ค่าเริ่มต้นคือ **อธิบาย + เสนอแนวทาง + ตัวอย่าง code สั้น ๆ** แล้วให้ dev เขียนเอง
- อธิบายว่า **ทำไม** (หลักการ, ข้อดี/ข้อเสีย) ไม่ใช่แค่ทำอะไร
- เมื่อ dev เขียนเสร็จ → review ให้ ชี้จุดที่ควรปรับ
- ทำทีละ phase, ทีละข้อ ไม่ข้ามไปทำล่วงหน้า

ทุก phase ต้องผ่าน `npm run fix`, `npm run typecheck`, `npm test` และอัปเดต section ที่เกี่ยวข้องใน `AGENTS.md` ใน phase นั้นเลย

---

## Phase 1 — Env

- [ ] `core/config/env/` เหลือไฟล์เดียว `env.ts` (schema + `z.infer` type)
- [ ] โหลดด้วย `process.loadEnvFile()` — เจอ `.env` → log, ไม่เจอ → log แล้วใช้ `process.env` ต่อ
- [ ] Zod validate ไม่ผ่าน → `process.exit(1)`
- [ ] ใส่ default ให้ค่าที่ไม่ใช่ secret (copy `.env.example` → `.env` แล้วรันได้ทันที)
- [ ] เพิ่ม `LOG_FILE` (default `false`)
- [ ] `NODE_ENV` รองรับ `test`
- [ ] ลบ `.env.dev`, `.env.prod`, `scripts/setup-env.ts`; อัปเดต `.env.example`
- [ ] อัปเดต `vitest.config.ts` ให้ตรง schema ใหม่

## Phase 2 — Logger + ESLint

- [ ] winston: dev = pretty (colorize + `util.inspect`), prod = JSON ออก stdout
- [ ] file transport เปิดเฉพาะ `LOG_FILE=true`
- [ ] ลบ `format.ts`, `stack.ts`, `AnsiColors`, `getLogWriter`, wrapper
- [ ] morgan → ส่งผ่าน logger ใหม่
- [ ] ESLint: ถอด `eslint-plugin-security`
- [ ] ลบ dependency `chalk`, `dayjs`

## Phase 3 — Error handler + Express 5

- [ ] ลบ `ErrorLogger` class, `StructuredError`, การ parse stack
- [ ] `wrapUnexpected` ใช้ native `{ cause }`
- [ ] `errorHandler` สั้นลง, ไม่มี `try/catch` ซ้อน
- [ ] ลบ `try/catch` ออกจาก controller ทั้งหมด (Express 5 ส่ง rejected promise ไป error handler เอง)

## Phase 4 — Schema / validate

- [ ] export schema แยกตัว (เลิก `todoSchema = { create: { body } }`)
- [ ] `validate()` เป็น generic → infer type `req` ให้ handler อัตโนมัติ
- [ ] จัดการ `req.query` (getter ใน Express 5) ให้สะอาดขึ้น — อ้างอิง
      https://stevekinney.com/courses/full-stack-typescript/validating-query-and-path-parameters

## Phase 5 — package.json

- [ ] ปรับ scripts: ลบ `setup-env`, ย่อ `dev`/`start`, ทบทวน `build`/`copy-assets`
- [ ] ลบ `ts-node`, `scripts-info` (ถ้าไม่ใช้)

## Phase 6 — Docs

- [ ] cleanup `AGENTS.md` / `README.md` ทั้งไฟล์ ลบ pattern เก่าที่ไม่ใช้แล้ว

## Phase 7 — Docker

ไม่ผูกกับ platform ใด (Vercel, Render, …) — config ของ platform ทำแยกตามแต่ละ project ที่นำ starter ไปใช้

- [ ] `docker-compose.yml`: `env_file: .env` + `NODE_ENV: production` (เลิกใช้ `.env.prod`); อัปเดต README ส่วน Docker
- [ ] `Dockerfile` CMD: เพิ่ม `--enable-source-maps` ให้ตรงกับ `npm start`
- [ ] ตรวจว่า container รันได้ด้วย env จากภายนอกอย่างเดียว (ไม่มี `.env` ใน image)

## Phase 8 — SQLite adapter (optional)

- [x] เพิ่ม `todo.repository.sqlite.ts` ด้วย `node:sqlite` (built-in, ไม่ต้อง install) — ตัวอย่าง adapter ของ driver จริง
- [x] map row → entity, แปล "not found" (`changes === 0`) เป็น `null`/`false`
- [x] สลับ adapter ใน `todo/index.ts` บรรทัดเดียว; `.memory.ts` เก็บไว้ใช้กับ service test
- [x] ตรวจสถานะ stability ของ `node:sqlite` ใน Node 26 ก่อนเริ่ม

## Phase 9 — Tests

เขียนหลัง refactor ทุก phase นิ่งแล้ว เพื่อไม่ต้องแก้ test ซ้ำหลายรอบ

ตาม test pyramid: unit เยอะ, integration กลาง, e2e น้อย — ใช้ Vitest + supertest ที่มีอยู่ ไม่เพิ่มเครื่องมือ

**Unit**

- [ ] `app-error.test.ts` — เขียนใหม่ + เอา `describe.skip` ออก
- [ ] `validate-request.test.ts` — เขียนใหม่ + เอา `describe.skip` ออก
- [ ] `error-handler.test.ts` — เขียนใหม่ + เอา `describe.skip` ออก
- [ ] env: export `envSchema`, test defaults (`safeParse({})`) + `z.stringbool()` (`'false'` → `false`)

**Integration**

- [ ] `todo.repository.sqlite.test.ts` — adapter กับ `node:sqlite` `:memory:` จริง (SQL, 0/1 → boolean, text → Date, not found → `null`/`false`)

**E2E (smoke)**

- [ ] 1 ไฟล์ผ่าน `createApp()` ทั้งตัว: `/health` + วงจร CRUD ของ todo หนึ่งรอบ

**ปิด phase**

- [ ] `npm run check` ผ่าน โดยไม่มี test ที่ถูก skip ค้าง
- [ ] ลบหมายเหตุ teaching mode ใน `AGENTS.md`

ยังไม่ทำใน starter: contract test (เทียบ response กับ OpenAPI), load test (k6) — เพิ่มเมื่อโปรเจกต์จริงต้องใช้

---

## Decisions

| เรื่อง                    | ตัดสินใจ                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `.env` ไม่เจอ            | log อย่างเดียว ไม่ exit (platform inject env เอง)                      |
| schema ไม่ผ่าน            | `process.exit(1)`                                                   |
| dotenv                  | ไม่ใช้ — ใช้ `process.loadEnvFile()` ของ Node 22                       |
| http-errors             | ไม่ใช้ — domain errors เดิมแยก business ออกจาก HTTP status อยู่แล้ว       |
| Logger                  | winston ต่อ แต่ใช้ format สำเร็จรูป                                      |
| `app.ts` / `main.ts`    | แยกไว้ — test (และ serverless ในอนาคต) ต้อง import app โดยไม่ `listen` |
| Deploy platform         | ไม่ผูกกับเจ้าใด — เพิ่ม config ตาม project ที่นำไปใช้                        |
| try/catch ใน controller | ลบ — Express 5 จัดการให้                                              |
| return type             | ไม่ใส่ `void` / `Promise<void>` — ใส่เฉพาะเมื่อ return ข้อมูล              |
