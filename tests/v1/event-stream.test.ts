import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl, type Event } from '../../src/index.js';

const event: Event = {
  id: 'evt_delivered', object: 'event', type: 'run.started', category: 'lifecycle',
  channel: 'platform', outcome: 'ok', source: 'runtime', seq: 7,
  actor: { type: 'platform', id: null, name: null }, target: null, data: {},
  runId: 'run_test', runtimeId: 'brw_test', conversationId: null, taskId: null,
  spaceId: null, pageId: null, spanId: null,
  time: '2026-10-03T00:00:00Z', timestamp: '2026-10-03T00:00:00Z',
  createdAt: '2026-10-03T00:00:00Z', updatedAt: '2026-10-03T00:00:00Z',
};

test('the Event stream, filtered by Run or browser, resumes with an Event ID and returns the common Event', async () => {
  const requests: { url: URL; headers: Headers }[] = [];
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async (input, init) => {
    requests.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
    return new Response(`: heartbeat\n\nid: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
      { headers: { 'content-type': 'text/event-stream' } });
  } });
  const streams = [
    await client.events.stream({ run: 'run_test', 'Last-Event-ID': 'evt_previous' }),
    await client.events.stream({ browser: 'brw_test', after: 'evt_previous' }),
  ];
  for (const stream of streams) {
    const events = [];
    for await (const delivered of stream) events.push(delivered);
    assert.deepEqual(events, [event]);
  }
  assert.equal(requests[0]!.url.pathname, '/v1/events/stream');
  assert.equal(requests[0]!.url.searchParams.get('run'), 'run_test');
  assert.equal(requests[0]!.headers.get('Last-Event-ID'), 'evt_previous');
  assert.equal(requests[1]!.url.pathname, '/v1/events/stream');
  assert.equal(requests[1]!.url.searchParams.get('browser'), 'brw_test');
  assert.equal(requests[1]!.url.searchParams.get('after'), 'evt_previous');
});
