# sdk

`@bctrl/sdk` — official TypeScript client (Node 18+, npm) for the BCTRL v1 public API: a type-safe, resource-oriented interface over spaces, runtimes, runs, conversations, files, and tools. Wraps the HTTP API in resource classes and per-entity CRUD clients, with a domain error hierarchy and async-iterator pagination.

## Key files

- `src/index.ts` — exports `Bctrl` (alias `BctrlV1`), resources, errors, types.
- `src/bctrl.ts` — root client; lazy `.spaces`/`.runtimes`/`.runs`/`.conversations`/`.files`/`.tools`.
- `src/http.ts` — `V1HttpClient` (auth, baseUrl, request lifecycle).
- `src/types.ts` — hand-written v1 type interfaces. `src/node.ts` — file-based hosted-tool helpers.

## Connects / run / test

`@bctrl/api-contracts` is the schema source of truth. OpenAPI and exact built-in Tool types are generated; resource clients remain hand-written. `pnpm run build` exports from `dist/`, not `src/`; `test:v1` (mock server), `test:v1:e2e` (gated by `BCTRL_E2E=1`), `typecheck`.

## Gotchas

- After editing api-contracts source, build it first or contract tests fail.
- Tools and Conversations operate on active Runtimes; Runs are observability records, not automation targets.
- `BCTRL_API_KEY` required; empty key throws early. BaseUrl auto-strips `/v1`.
