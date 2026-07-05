# @bctrl/sdk

TypeScript and JavaScript SDK for BCTRL cloud browser automation. Create browser runtimes, start live sessions, run hosted browser agents, inspect runs, and manage platform resources from Node.js.

## Install

```bash
npm install @bctrl/sdk
```

Requires Node.js 22.14 or newer.

## Quick Start

```ts
import { Bctrl } from '@bctrl/sdk';

const bctrl = new Bctrl({
  apiKey: process.env.BCTRL_API_KEY!,
});

const runtime = await bctrl.runtimes.create({
  type: 'browser',
  name: 'browser-task',
});

const started = await bctrl.runtimes.start(runtime.id);
console.log(started.runId, started.connectUrl);

await bctrl.runtimes.targets.create(started.runtimeId, {
  uri: 'https://example.com',
  activate: true,
});

await bctrl.runtimes.stop(started.runtimeId);
```

## Hosted Invocations

Use invocations when you want BCTRL to drive the browser for you.

```ts
import { Bctrl } from '@bctrl/sdk';
import { z } from 'zod';

const bctrl = new Bctrl();

const invocation = await bctrl.runtimes.invocations.createAndWait(
  '<runtime-id>',
  {
    action: 'extract',
    instruction: 'Extract the product name and price.',
    schema: z.object({
      name: z.string(),
      price: z.string(),
    }),
  },
  { timeoutSeconds: 60 }
);

console.log(invocation.status, invocation.output);
```

The SDK accepts Zod schemas or plain JSON Schema for structured extraction. On the wire, they are sent as `outputSchema`.

## Configuration

The client reads `BCTRL_API_KEY` by default:

```ts
const bctrl = new Bctrl();
```

You can also pass configuration explicitly:

```ts
const bctrl = new Bctrl({
  apiKey: 'bctrl_...',
  timeoutMs: 30_000,
  maxRetries: 2,
});
```

For subaccount-scoped calls:

```ts
const scoped = bctrl.withSubaccount('<subaccount-id>');
```

## Errors

API failures throw typed errors with status, code, request id, and response body context:

```ts
import { BctrlApiError } from '@bctrl/sdk';

try {
  await bctrl.runtimes.get('<runtime-id>');
} catch (error) {
  if (error instanceof BctrlApiError) {
    console.error(error.status, error.code, error.requestId);
  }
}
```

The client retries retryable GET requests by default. Mutating requests are retried only when you provide an idempotency key.

## Documentation

- SDK guide: https://platform.bctrl.ai/sdk
- API reference: https://platform.bctrl.ai/api-reference
- Product: https://bctrl.ai

## Telemetry

The SDK does not include vendor-owned telemetry or usage analytics. Instrument your application directly if you want request logging or tracing.
