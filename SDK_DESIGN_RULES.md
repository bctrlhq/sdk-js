# BCTRL SDK Design Rules

The SDKs should make the API reference feel natural in code without inventing a
second product model.

## Source Of Truth

- The public HTTP contract is the source of truth for SDK request and response
  types.
- Short term: keep TypeScript `sdk/src/types.ts` synchronized against
  `packages/api-contracts` with compile-time contract tests. Keep Python route
  methods covered by local HTTP contract tests.
- Long term: generate SDK types from `openapi/public-openapi.json` into a
  generated file, then hand-write only transport, resources, and small
  ergonomic helpers.

## Public Shape

- TypeScript `new Bctrl()` and Python `Bctrl()` read `BCTRL_API_KEY`.
- Resource namespaces mirror the API reference:
  `bctrl.runtimes.start(runtimeId)` maps to
  `POST /v1/runtimes/{runtimeId}/start`.
- Namespace methods return the route response body directly.
- Resource/handle objects may exist as convenience sugar, but they must not be
  the only way to call a route.

## Hidden Behavior

- No hidden follow-up requests.
- No auto-refreshing stateful resources.
- No default-space lookup inside SDK methods.
- No BCTRL-owned Playwright/Puppeteer wrappers in the core SDK.

## Allowed Ergonomics

- Cursor pagination iteration.
- SSE async iteration.
- Upload helpers for multipart routes.
- Typed error classes.
- Zod schema authoring in TypeScript, converted to JSON Schema before sending.
- Pydantic v2 model authoring in Python via `output_model=MyModel`, converted
  to JSON Schema before sending and parsed back into `parsed_output`.
- Explicit wait helpers such as `createAndWait`, where the method name says it
  performs more than one HTTP request.

## Schema Authoring

The wire API stays language-neutral and receives JSON Schema:

```ts
outputSchema: { type: "object", properties: { total: { type: "number" } } }
```

The TypeScript SDK happy path may accept Zod:

```ts
schema: z.object({ total: z.number() });
```

The SDK converts `schema` to `outputSchema` and rejects bodies that provide both.
Public TypeScript invocation helpers should not expose `outputSchema`; that is
the wire field produced by the SDK.

Python uses Pydantic instead of raw JSON Schema on the public helper surface:

```py
class Invoice(BaseModel):
    invoice_number: str

invocation = bctrl.runtimes.invocations.create_and_wait(
    runtime_id,
    action="extract",
    instruction="Extract the invoice number.",
    output_model=Invoice,
)
```
