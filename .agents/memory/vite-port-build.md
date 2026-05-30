---
name: Vite PORT build fix
description: vite.config must not throw on missing PORT/BASE_PATH so pnpm build works in CI without those env vars.
---

Both `artifacts/disciplinex/vite.config.ts` and `artifacts/mockup-sandbox/vite.config.ts` originally threw hard errors if PORT or BASE_PATH were not set. This broke `pnpm build` in CI/build contexts where those vars aren't provided.

**Why:** Workflows inject PORT and BASE_PATH at runtime for dev mode, but build commands run without them.

**How to apply:** Replace the throw with soft defaults:
```ts
const port = rawPort ? Number(rawPort) : 5173;
const basePath = process.env.BASE_PATH ?? "/";
```
Any new Vite artifact added to this project should follow the same pattern.
