import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

const encoder = new TextEncoder();

test('fetchStream returns the upstream response with a streaming body', async () => {
  const requests: Array<{ path: string; body: unknown }> = [];
  let pulled = 0;
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async (input, init) => {
    requests.push({ path: new URL(String(input)).pathname, body: JSON.parse(String(init?.body)) });
    const chunks = ['{"items":', '[1,2]}'];
    return new Response(new ReadableStream<Uint8Array>({
      pull(controller) {
        const next = chunks[pulled++];
        if (next === undefined) controller.close(); else controller.enqueue(encoder.encode(next));
      },
    }), { status: 200, headers: { 'content-type': 'application/json', 'BCTRL-Fetch-Status': '404',
      'BCTRL-Fetch-Headers': JSON.stringify({ 'content-type': 'application/json', 'x-trace': 'abc' }), 'BCTRL-Event-Id': 'evt_1' } });
  } });
  const response = await client.browsers.fetchStream({ browserId: 'br_1', url: 'https://example.com/items', method: 'GET' });
  assert.deepEqual(requests, [{ path: '/v1/browsers/br_1/fetch/stream', body: { url: 'https://example.com/items', method: 'GET' } }]);
  assert.equal(response.status, 404);
  assert.equal(response.ok, false);
  assert.equal(response.headers.get('x-trace'), 'abc');
  assert.equal(response.eventId, 'evt_1');
  // Nothing past the first chunk is read until the caller reads.
  assert.ok(pulled <= 1, `pulled ${pulled} chunks before reading`);
  const reader = response.body.getReader();
  const parts: string[] = [];
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(new TextDecoder().decode(value)); }
  assert.equal(parts.join(''), '{"items":[1,2]}');
});

test('fetchStream reads as text or JSON, and a failure is sent once', async () => {
  let calls = 0;
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async () => {
    calls++;
    if (calls === 1) return new Response('{"a":1}', { status: 200, headers: { 'BCTRL-Fetch-Status': '200', 'BCTRL-Fetch-Headers': '{}' } });
    return new Response(JSON.stringify({ error: { code: 'browser.fetch_failed', message: 'reset', reasonClass: 'upstream' } }),
      { status: 503, headers: { 'content-type': 'application/json' } });
  } });
  const ok = await client.browsers.fetchStream({ browserId: 'br_1', url: 'https://example.com/' });
  assert.deepEqual(await ok.json(), { a: 1 });
  await assert.rejects(client.browsers.fetchStream({ browserId: 'br_1', url: 'https://example.com/' }));
  assert.equal(calls, 2, 'the failed request was not retried');
});
