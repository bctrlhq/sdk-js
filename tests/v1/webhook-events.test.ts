import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('generated webhook transports preserve additive Event names in requests and responses', async () => {
  const events = ['spending_cap.reached', 'task.awaiting_input', 'future.new_event'];
  const calls: { path: string; body: unknown }[] = [];
  const client = new Bctrl({ token: 'fixture', fetch: async (input, options) => {
    calls.push({ path: new URL(String(input)).pathname, body: JSON.parse(String(options?.body)) });
    return Response.json({ object: 'webhook', id: 'wh_fixture', url: 'https://example.test/events', name: null,
      events, enabled: true, subaccountId: null, createdAt: '2026-10-03T00:00:00Z', updatedAt: '2026-10-03T00:00:00Z', secret: 'fixture' });
  } });
  assert.deepEqual((await client.webhooks.create({ url: 'https://example.test/events', events })).events, events);
  assert.deepEqual((await client.webhooks.update({ webhookId: 'wh_fixture', events })).events, events);
  assert.deepEqual(calls, [{ path: '/v1/webhooks', body: { events, url: 'https://example.test/events' } },
    { path: '/v1/webhooks/wh_fixture', body: { events } }]);
});
