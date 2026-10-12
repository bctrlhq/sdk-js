# JavaScript SDK

`@bctrl/sdk` 2.x publishes the current generated public API client by default.
Node.js 22.14 or newer is required. The source of truth is the backend public
OpenAPI artifact and its deterministic Fern generator adapters.

- `src/index.ts` and `src/api.ts`: current `Bctrl`/`BctrlClient`, errors and `types`.
- `src/generated/fern`: generated clients; change generator inputs or adapters,
  then regenerate. Do not edit generated output by hand.
- `src/node.ts`: current file-based hosted code Tool helper.
- `src/legacy.ts` and `src/legacyNode.ts`: explicit historical entrypoints for
  callers targeting older API deployments.

Run `pnpm build`, `pnpm test`, and `pnpm exec tsc --noEmit -p tests/tsconfig.json`
in a Linux container. Tests cover the current client and explicit legacy helpers;
legacy live tests require `BCTRL_E2E=1` and an appropriate older API deployment.

Current clients accept `token`, API-origin `baseUrl`, and `bctrlSpace` scope.
Simple JSON operations flatten fields; some union requests have a `body` field.
Read generated method signatures. Tools act on active Runtimes; Runs record
observability. Preserve explicit-key write retry safety and scope boundaries.
