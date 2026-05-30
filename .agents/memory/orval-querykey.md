---
name: queryKey required in Orval hooks
description: Orval-generated hooks require explicit queryKey in the query options; omitting causes TS2741.
---

When passing query options to Orval-generated hooks like `useGetUserStats`, `useListTasks`, etc., the `query` object must include a `queryKey` field. Omitting it produces: `Property 'queryKey' is missing in type '{ enabled: boolean; }' but required in type 'UseQueryOptions<...>'`.

**Why:** The Orval codegen in this project generates strict UseQueryOptions types that mandate queryKey.

**How to apply:**
```ts
// Correct
useGetUserStats(userId, {
  query: {
    enabled: !!userId,
    queryKey: getGetUserStatsQueryKey(userId)
  }
});

// Wrong — missing queryKey
useGetUserStats(userId, { query: { enabled: !!userId } });
```
Each generated hook has a matching `get*QueryKey(params)` helper to use as the `queryKey` value.
