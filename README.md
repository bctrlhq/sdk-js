# @bctrl/sdk

TypeScript SDK for BCTRL v1 spaces, browser runtimes, invocations, runs, and files.

## Install

```bash
npm install @bctrl/sdk
```

Node 18+ is required.

## Quick start

```ts
import { Bctrl } from '@bctrl/sdk';
import { z } from 'zod';

const bctrl = new Bctrl({
  apiKey: process.env.BCTRL_API_KEY!,
});

const runtime = await bctrl.runtimes.create({
  type: 'browser',
  name: 'browser-task',
});
const started = await bctrl.runtimes.start(runtime.id);
console.log(started.runId, started.connectUrl);

const invocation = await bctrl.runtimes.invocations.createAndWait(
  started.runtimeId,
  {
    action: 'extract',
    instruction: 'Extract the page title.',
    schema: z.object({
      title: z.string(),
    }),
  },
  { timeoutSeconds: 60 }
);

console.log(invocation.status, invocation.output);

await bctrl.runtimes.stop(started.runtimeId);
```

The public SDK targets `https://api.bctrl.ai/v1`. For local development, pass a
local origin or v1 base URL:

```ts
const bctrl = new Bctrl({
  apiKey: process.env.BCTRL_API_KEY!,
  baseUrl: 'http://localhost:8787',
});
```

`baseUrl` may include or omit `/v1`; the client normalizes either form.

## Entry points

- `@bctrl/sdk`: v1 client, resources, errors, and public types

## Documentation

- SDK reference: https://platform.bctrl.ai/api-reference/sdk/overview
- Product site: https://bctrl.ai

## Telemetry

The published SDK does not include vendor-owned telemetry or usage analytics.

If you want observability around SDK calls, instrument your application directly with your own logging or error tracking.
