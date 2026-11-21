# Updating Dependencies

## Setup (once)

```bash
npm i -g npm-check-updates
```

## Steps

**1. Start clean**

```bash
git status
```

**2. See what's outdated**

```bash
ncu
```

Read-only. Lists updates grouped by Patch / Minor / Major.

**3. Pick what to update**

```bash
ncu -i --interactiveSelect minor
```

Opens a checklist and writes your picks to `package.json`.

| `--interactiveSelect` | Pre-selected               |
| --------------------- | -------------------------- |
| `none`                | nothing                    |
| `patch`               | patch only                 |
| `minor`               | patch + minor (safe start) |
| `all`                 | everything, incl. major    |
| `auto`                | default behavior           |

**4. Install**

```bash
npm install
```

Updates `package-lock.json`. Don't delete the lock file or `node_modules`.

**5. Verify**

```bash
npm run fix
npm run check
```

Then run `npm run dev` and open `/health` and `/docs`.

**6. Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): update dependencies"
```

## Versions

| Type  | Example           | Risk                            |
| ----- | ----------------- | ------------------------------- |
| Patch | `5.2.1 → 5.2.2`   | Low — bug fixes                 |
| Minor | `5.2.1 → 5.3.0`   | Low — new features              |
| Major | `5.x → 6.0.0`     | High — breaking changes         |
| `0.x` | `0.10.1 → 0.10.9` | High — unstable, treat as major |

Update majors one at a time and read their changelog first.

## If it breaks

```bash
git checkout package.json package-lock.json
npm install
```

Then update in smaller batches to find the culprit.

- `ERESOLVE` on install means a peer dependency conflict. Check with `npm view <package> peerDependencies`.
- Never use `--force` or `--legacy-peer-deps` — it hides the error until runtime.

## Watch list

- `typescript` — wait until `typescript-eslint` supports the new major.
