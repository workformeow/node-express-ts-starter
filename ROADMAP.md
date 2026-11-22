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

## Phase 7 — Deploy (optional)

- [ ] รองรับ Vercel: `api/index.ts` (`export default app`) + `vercel.json`
- [ ] ตรวจ Render / Docker ใช้ได้ด้วย env จาก platform อย่างเดียว (ไม่มี `.env`)

---

## Decisions

| เรื่อง                    | ตัดสินใจ                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `.env` ไม่เจอ            | log อย่างเดียว ไม่ exit (platform inject env เอง)                |
| schema ไม่ผ่าน            | `process.exit(1)`                                             |
| dotenv                  | ไม่ใช้ — ใช้ `process.loadEnvFile()` ของ Node 22                 |
| http-errors             | ไม่ใช้ — domain errors เดิมแยก business ออกจาก HTTP status อยู่แล้ว |
| Logger                  | winston ต่อ แต่ใช้ format สำเร็จรูป                                |
| `app.ts` / `main.ts`    | แยกไว้ — test และ Vercel ต้อง import app โดยไม่ `listen`         |
| try/catch ใน controller | ลบ — Express 5 จัดการให้                                        |
