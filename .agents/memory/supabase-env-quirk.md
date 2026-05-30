---
name: Supabase env var quirk
description: Replit secrets for VITE_ vars arrive doubled (KEY=KEY=value); must strip before createClient.
---

Replit secrets are injected into process.env but VITE_* secrets arrive with the key name prepended to the value: `process.env.VITE_SUPABASE_URL` contains `"VITE_SUPABASE_URL=https://..."` instead of just the URL.

**Why:** Replit's secret injection for VITE_* variables double-prefixes the value with the key name.

**How to apply:** In `artifacts/disciplinex/vite.config.ts`, the `cleanEnv()` helper strips the prefix before passing values to `define`:
```ts
function cleanEnv(key: string): string {
  const raw = process.env[key] ?? "";
  const prefix = key + "=";
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}
```
The Supabase client also uses a lazy Proxy pattern (in `src/lib/supabase.ts`) so `createClient()` is deferred until first use, preventing startup crashes if env vars are missing.
