# BCTRL JavaScript SDK

```bash
pnpm add @bctrl/sdk
```

```ts
import { Bctrl } from '@bctrl/sdk';

const bctrl = new Bctrl({ apiKey: process.env.BCTRL_API_KEY });
const { runtime, run } = await bctrl.runtimes.start('rt_...');

const result = await bctrl.tools.call('stagehand.extract', {
  runtimeId: runtime.id,
  instruction: 'Extract the products',
  schema: {
    type: 'object',
    properties: { products: { type: 'array' } },
  },
});

const call = await bctrl.tools.start('captcha.solve', { runtimeId: runtime.id });
const solved = await bctrl.toolCalls.result(call.id, { waitSeconds: 60 });
```

Agents are persistent conversations attached to an active runtime:

```ts
const conversation = await bctrl.conversations.create({
  agent: 'browser-use',
  runtimeId: runtime.id,
});

await bctrl.conversations.messages.create(conversation.id, {
  text: 'Find the lowest refundable price',
});

const streamUrl = bctrl.conversations.events.streamUrl(conversation.id);
```

Every automation path writes into the runtime's Run. Inspect structured spans and
events with `bctrl.runs.trace`, `bctrl.runs.events`, or the unified Run stream URL.
Create a View when a browser-safe, expiring embed URL is needed.
