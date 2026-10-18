# JavaScript SDK

`@bctrl/sdk` is the generated public API client plus a few hand-written helpers.
Node.js 22.14 or newer is required. The source of truth is the backend public
OpenAPI artifact and its deterministic Fern generator adapters.

- `src/index.ts`: the public exports; `src/client.ts`: `Bctrl`, the generated client
  with helper resources.
- `src/generated/fern`: generated clients; change generator inputs or adapters in the
  platform repo, then regenerate. Do not edit generated output by hand. Retry safety
  (no unkeyed write replays, unknown outcomes, refused redirects) lives in its transport.
- `src/lib`: hand-written helpers (browser handles, conversation history, waits,
  output schemas, the file-based code Tool helper behind `@bctrl/sdk/node`).
- The build emits ES modules to `dist` and CommonJS to `dist/cjs`; runtime
  dependencies stay at zero.

Run `pnpm run typecheck`, `pnpm test` and `pnpm run check:package` (attw, publint,
require/import smoke) in Linux. Live tests require `BCTRL_E2E=1`. Releases: RELEASE.md.

Current clients accept `token`, API-origin `baseUrl`, and `bctrlSpace` scope.
Simple JSON operations flatten fields; some union requests have a `body` field.
Read generated method signatures. Preserve explicit-key write retry safety and
scope boundaries.
