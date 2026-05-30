---
name: api-server zod import
description: api-server has no direct zod dependency; use generated schemas from @workspace/api-zod instead.
---

`artifacts/api-server/package.json` does not list `zod` or `zod/v4` as a dependency. Route files that need request validation must import Zod schemas from `@workspace/api-zod` (the Orval-generated validators).

**Why:** The api-server avoids a direct zod dep to keep bundle size minimal and prevent version conflicts with the libs that use `zod/v4`.

**How to apply:**
- Run codegen first: `pnpm --filter @workspace/api-spec run codegen`
- Import from `@workspace/api-zod`: `import { MyParams, MyBody } from "@workspace/api-zod";`
- Never add `import { z } from "zod"` or `"zod/v4"` to api-server route files.
