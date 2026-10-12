# BCTRL JavaScript SDK

Typed Node.js clients for all current BCTRL public API operations: Browsers,
Sandboxes, Tasks, Agents, Spaces, Files, Secrets, Tools, Runs, and account resources.
Requires Node.js 22.14 or newer.

```bash
npm install @bctrl/sdk
```

```ts
import { Bctrl } from '@bctrl/sdk';

const client = new Bctrl({ token: process.env.BCTRL_API_KEY! });
const spaces = await client.spaces.list({ limit: 20 });
console.log(spaces.data);
```

Create a recording-enabled browser and stop its Run:

```ts
const browser = await client.browsers.create({
  name: 'example-browser', recording: true,
  wait: 60,
  'Idempotency-Key': crypto.randomUUID(),
});
console.log(browser.id, browser.currentRun);
await client.browsers.stop({ browserId: browser.id, wait: 60 });
```

While a browser has an active Run, upload a file and download it:

```ts
await client.browsers.files.upload({
  browserId: 'example-browser', path: '/workspace/input.txt',
  file: new Blob(['hello']),
});
const download = await client.browsers.files.download({
  browserId: 'example-browser', path: '/workspace/input.txt',
});
```

Clients support async pagination, streaming, binary downloads, multipart uploads,
AbortSignal, and request-specific options. `@bctrl/sdk/node` provides
`createCodeToolFromFile` for the current client. Current model types are exported
under `types`; `@bctrl/sdk/api` remains an alias for the current API entrypoint.

Requests pin `BCTRL-Version: 2026-10-03`. Use `bctrlSpace` and `bctrlSubaccountId`
for authorized scope selectors. Custom `baseUrl` values identify the API origin,
such as `https://api.bctrl.ai`, without a trailing `/v1`.

Read operations retry transient responses. Writes automatically retry only when
an explicit `Idempotency-Key` is supplied; unknown outcomes are not retried.
Streaming request bodies are not replayed. The SDK refuses authenticated redirects.
Custom fetchers are responsible for enforcing equivalent policies.

## Migrating to 2.0

The default `Bctrl` import now uses the current generated client. Replace
`apiKey` with `token` and migrate Runtime/Toolset/Conversation-message workflows
to Browsers/Sandboxes and Agents/Tasks. JSON requests may wrap fields in `body`;
the generated TypeScript signatures and API reference show each operation's shape.

Historical helper types remain under `@bctrl/sdk/legacy` and
`@bctrl/sdk/legacy/node` for callers targeting an older API. Their retired routes
are not supported by the current production API.
